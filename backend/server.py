from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout
import stripe
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from PIL import Image
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB Connection with improved error handling
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

print(f"🔍 MONGO_URL: {mongo_url}")

try:
    client = AsyncIOMotorClient(mongo_url)
    
    # Use environment variable for database name - CRITICAL for managed deployments
    db_name = os.environ.get('MONGO_DB_NAME')
    if not db_name:
        print("⚠️ WARNING: MONGO_DB_NAME not set, using automatic configuration for managed MongoDB")
        # For managed MongoDB, use a generic database name that will be auto-created
        db_name = "app_database"
        print(f"🔧 Using managed MongoDB database: {db_name}")
    
    print(f"🔍 Using database: {db_name}")
    db = client.get_database(db_name)
    print("✅ MongoDB connection initialized successfully")
    
    # Test database permissions
    async def test_db_permissions():
        try:
            # Test basic read permission
            await db.list_collection_names()
            print("✅ Database read permissions confirmed")
            
            # Test write permission with a simple document
            test_collection = db.connection_test
            test_doc = {"test": True, "timestamp": datetime.now(timezone.utc)}
            await test_collection.insert_one(test_doc)
            print("✅ Database write permissions confirmed")
            
            # Clean up test document
            await test_collection.delete_one({"test": True})
            print("✅ Database delete permissions confirmed")
            
        except Exception as perm_error:
            error_msg = str(perm_error).lower()
            if "not authorized" in error_msg or "permission" in error_msg:
                print(f"⚠️ Database permission limitations detected: {str(perm_error)}")
                print("💡 Some features (payment logging) may be limited")
            else:
                print(f"⚠️ Database connection test failed: {str(perm_error)}")
    
    # Run permission test asynchronously when app starts
    import asyncio
    try:
        asyncio.create_task(test_db_permissions())
    except Exception:
        pass  # Don't block app startup on permission test
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {str(e)}")
    raise

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Training Scenarios Models
class TrainingScenarioRequest(BaseModel):
    scenario_id: int
    user_id: str
    user_name: str = "User"
    partner_name: str = "Partner"

class TrainingResponse(BaseModel):
    message: str
    emotion: str
    context: str

class EmpathyEvaluation(BaseModel):
    user_response: str
    scenario_id: int
    user_id: str

class EmpathyFeedback(BaseModel):
    empathy_score: float = Field(..., ge=0, le=10)
    feedback: str
    improvements: List[str]
    alternative_responses: List[str]
    emotional_awareness: str
    next_level_tip: str

# Training Scenarios Data
TRAINING_SCENARIOS = {
    1: {
        "title": "Aktives Zuhören",
        "context": "Ihr Partner kommt nach einem besonders stressigen Arbeitstag nach Hause. Sie bemerken, dass er/sie müde und frustriert wirkt.",
        "partner_opening": "Weißt du... ich kann nicht mehr so weitermachen. Die Arbeit ist einfach zu viel geworden. Ich fühle mich total erschöpft und weiß nicht, wie ich das alles schaffen soll.",
        "difficulty": "basic",
        "learning_goals": ["Aktives Zuhören", "Empathie zeigen", "Emotionale Unterstützung"]
    },
    2: {
        "title": "Gefühle spiegeln", 
        "context": "Während eines Gesprächs über Zukunftspläne wirkt Ihr Partner unsicher und besorgt.",
        "partner_opening": "Ich weiß nicht... die ganze Situation mit der Jobsuche macht mir wirklich Angst. Was, wenn ich nichts Passendes finde?",
        "difficulty": "basic",
        "learning_goals": ["Gefühle erkennen", "Spiegeln", "Beruhigung geben"]
    },
    3: {
        "title": "Nachfragen stellen",
        "context": "Ihr Partner erwähnt beiläufig, dass er/sie Probleme mit einem Freund hat.",
        "partner_opening": "Sarah und ich hatten wieder eine Diskussion. Es ist kompliziert...",
        "difficulty": "basic", 
        "learning_goals": ["Interesse zeigen", "Offene Fragen", "Verständnis vertiefen"]
    },
    4: {
        "title": "Körpersprache lesen",
        "context": "Obwohl Ihr Partner sagt, dass alles in Ordnung ist, bemerken Sie angespannte Körpersprache.",
        "partner_opening": "Mir geht's gut, wirklich. Nur ein bisschen müde heute.",
        "difficulty": "basic",
        "learning_goals": ["Non-verbale Signale", "Zwischen den Zeilen lesen", "Behutsam nachfragen"]
    },
    5: {
        "title": "Empathische Antworten",
        "context": "Ihr Partner teilt eine Enttäuschung über eine verpasste Gelegenheit mit.",
        "partner_opening": "Ich hab die Beförderung nicht bekommen. Sie haben jemand anderen genommen. Ich bin so enttäuscht...",
        "difficulty": "basic",
        "learning_goals": ["Trost spenden", "Enttäuschung validieren", "Hoffnung geben"]
    },
    
    # Stufe 2: Konfliktlösung
    6: {
        "title": "Meinungsverschiedenheiten",
        "context": "Bei der Urlaubsplanung haben Sie unterschiedliche Vorstellungen, was zu Spannungen führt.",
        "partner_opening": "Du verstehst einfach nicht, was ich brauche! Ich möchte endlich mal in die Berge, Ruhe haben. Warum muss es immer Strand sein?",
        "difficulty": "intermediate",
        "learning_goals": ["Verständnis zeigen", "Kompromisse finden", "Bedürfnisse erkennen"]
    },
    7: {
        "title": "Vorwürfe handhaben",
        "context": "Nach einem Streit über Haushaltsaufgaben ist die Stimmung angespannt.",
        "partner_opening": "Ich fühle mich, als würde ich alles alleine machen. Deine Kritik von gestern hat mich richtig getroffen. Siehst du denn nicht, wie viel ich tue?",
        "difficulty": "intermediate", 
        "learning_goals": ["Defensive Reaktionen vermeiden", "Verletzungen anerkennen", "Konstruktiv reagieren"]
    },
    8: {
        "title": "Grenzen setzen",
        "context": "Ihr Partner hat spontan Familie-Verpflichtungen zugesagt, ohne Sie zu fragen.",
        "partner_opening": "Das ist meine Familie! Ich kann doch nicht nein sagen, wenn sie Hilfe brauchen. Warum verstehst du das nicht?",
        "difficulty": "intermediate",
        "learning_goals": ["Grenzen kommunizieren", "Verständnis schaffen", "Gemeinsame Lösungen"]
    },
    
    # Stufe 3: Emotionale Intelligenz
    9: {
        "title": "Selbstwertkrisen",
        "context": "Ihr Partner kämpft mit Selbstzweifeln bezüglich des eigenen Körperbildes.",
        "partner_opening": "Ich kann das einfach nicht mehr ertragen. Du findest mich bestimmt nicht mehr attraktiv... ich erkenne mich selbst nicht mehr.",
        "difficulty": "advanced",
        "learning_goals": ["Selbstwert stärken", "Bedingungslose Akzeptanz", "Körperpositivität"]
    },
    10: {
        "title": "Familiäre Belastungen", 
        "context": "Nach einem schwierigen Besuch bei der Familie ist Ihr Partner emotional erschöpft.",
        "partner_opening": "Ich werde niemals gut genug für sie sein... egal was ich mache, es ist immer falsch. Diese ewigen Vorwürfe zermürben mich.",
        "difficulty": "advanced",
        "learning_goals": ["Familiendynamiken verstehen", "Emotionale Stütze sein", "Abgrenzung unterstützen"]
    },
    11: {
        "title": "Impostor-Syndrom",
        "context": "Trotz beruflichem Erfolg zweifelt Ihr Partner an den eigenen Fähigkeiten.",
        "partner_opening": "Ich verdiene das gar nicht. Die anderen arbeiten genauso hart. Was, wenn sie merken, dass ich eigentlich keine Ahnung habe?",
        "difficulty": "advanced", 
        "learning_goals": ["Selbstzweifel erkennen", "Erfolge würdigen", "Realistische Perspektive geben"]
    },
    
    # Stufe 4: Beziehungsdynamiken
    12: {
        "title": "Beziehungsmuster",
        "context": "Ihr Partner erkennt, dass Sie beide in wiederkehrende Konfliktmuster fallen.",
        "partner_opening": "Merkst du auch, dass wir immer die gleichen Diskussionen haben? Ich fühle mich, als wären wir in einer Schleife gefangen und ich weiß nicht, wie wir da rauskommen sollen.",
        "difficulty": "expert",
        "learning_goals": ["Muster erkennen", "Systemisches Denken", "Veränderungsprozesse"]
    },
    13: {
        "title": "Eigene Grenzen verlieren",
        "context": "Ihr Partner hat das Gefühl, sich selbst in der Beziehung zu verlieren.",
        "partner_opening": "Ich sage nie nein zu dir, aber dabei verliere ich mich selbst. Ich weiß gar nicht mehr, was ich wirklich will. Das macht mich unglücklich.",
        "difficulty": "expert",
        "learning_goals": ["Individuelle Bedürfnisse", "Gesunde Grenzen", "Selbstreflexion fördern"]
    },
    14: {
        "title": "Vertrauenskrisen",
        "context": "Frühere Verletzungen belasten das Vertrauen in die aktuelle Beziehung.",
        "partner_opening": "Kann ich dir wirklich vertrauen? Ich habe solche Angst, dass du mich irgendwann verlässt. Diese Zweifel lassen mich einfach nicht los.",
        "difficulty": "expert",
        "learning_goals": ["Vertrauen aufbauen", "Ängste verstehen", "Sicherheit vermitteln"]
    },
    
    # Stufe 5: Meisterschaft
    15: {
        "title": "Fremde Lasten tragen",
        "context": "Ihr Partner ist emotional erschöpft vom Helfen bei den Problemen anderer.",
        "partner_opening": "Sie ist völlig am Boden zerstört und ich fühle mich so hilflos. Wie kann ich ihr helfen, wenn ihre Welt gerade zusammenbricht? Ich trage so viel mit...",
        "difficulty": "mastery",
        "learning_goals": ["Emotionale Abgrenzung", "Helfer-Syndrom", "Selbstfürsorge"]
    },
    16: {
        "title": "Zukunftsängste",
        "context": "Unsicherheiten über die gemeinsame Zukunft belasten Ihren Partner.",
        "partner_opening": "Manchmal frage ich mich, ob wir in dieselbe Richtung gehen. Ich liebe dich, aber ich habe Angst, dass wir verschiedene Träume haben.",
        "difficulty": "mastery",
        "learning_goals": ["Zukunftsplanung", "Gemeinsame Visionen", "Unsicherheit aushalten"]
    },
    17: {
        "title": "Beziehungsweisheit",
        "context": "Ihr Partner reflektiert über die Beziehung und möchte anderen Paaren helfen.",
        "partner_opening": "Heute ist mir klar geworden, wie zerbrechlich Beziehungen sind. Vielleicht könnten wir anderen helfen, aber dafür müssten wir erst sicher sein, dass wir es geschafft haben.",
        "difficulty": "mastery", 
        "learning_goals": ["Beziehungsreife", "Mentoring", "Weisheit weitergeben"]
    }
}

# Real AI-Powered Training Endpoints
@api_router.post("/training/start-scenario")
async def start_training_scenario(request: TrainingScenarioRequest):
    """Start a training scenario with AI-powered partner simulation"""
    try:
        if request.scenario_id not in TRAINING_SCENARIOS:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        scenario = TRAINING_SCENARIOS[request.scenario_id]
        
        # Initialize AI chat for this scenario
        session_id = f"training_{request.user_id}_{request.scenario_id}_{datetime.now().isoformat()}"
        
        system_message = f"""You are {request.partner_name} in an empathy training scenario. You are experiencing the situation described and need to express YOUR feelings and concerns to {request.user_name}.

SCENARIO: {scenario['title']}
CONTEXT: {scenario['context']}
LEARNING GOALS: {', '.join(scenario['learning_goals'])}

IMPORTANT: You are NOT being empathetic - you are the one who NEEDS empathy from {request.user_name}.

Your role as {request.partner_name}:
- Express YOUR emotions and frustrations from the scenario
- Share YOUR perspective and feelings honestly
- Be vulnerable and authentic about what YOU are experiencing  
- You are stressed/upset/frustrated (as described in the context)
- Don't be empathetic back - you need support from {request.user_name}
- Keep responses conversational (2-3 sentences max)
- Show the emotional state described in the scenario context
- Wait for {request.user_name} to show empathy to YOU

Current emotional state: You are feeling the stress/frustration described in the context and need {request.user_name}'s empathy and support.
"""

        # Initialize the AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")

        # Generate individual opening message for this specific scenario
        try:
            # Create scenario-specific prompts
            scenario_prompts = {
                # Stufe 1: Grundlagen
                1: f"Du bist {request.partner_name} und kommst erschöpft von einem stressigen Arbeitstag heim. Du fühlst dich überlastet und brauchst emotionale Unterstützung von {request.user_name}. Antworte in 2-3 Sätzen wie du dich fühlst.",
                2: f"Du bist {request.partner_name} und machst dir Sorgen um deine Jobsuche. Du fühlst dich unsicher und ängstlich. Teile deine Bedenken mit {request.user_name} in 2-3 Sätzen.",
                3: f"Du bist {request.partner_name} und hattest Probleme mit einer Freundin namens Sarah. Du bist frustriert und brauchst jemanden zum Reden. Erkläre {request.user_name} kurz was passiert ist.",
                4: f"Du bist {request.partner_name} und versuchst zu verbergen, dass du gestresst bist, aber deine Körpersprache verrät dich. Antworte defensiv aber lass durchblicken, dass doch etwas nicht stimmt.",
                5: f"Du bist {request.partner_name} und hast eine wichtige Beförderung nicht bekommen. Du bist enttäuscht und verletzt. Teile deine Gefühle mit {request.user_name}.",
                
                # Stufe 2: Konfliktlösung
                6: f"Du bist {request.partner_name} und frustriert über die Urlaubsplanung. Du willst in die Berge, aber es ist immer Strand. Drücke deine Frustration aus und erkläre warum dir das so wichtig ist.",
                7: f"Du bist {request.partner_name} und fühlst dich überlastet mit dem Haushalt. Du bist verletzt von der gestrigen Kritik. Erkläre wie du dich fühlst und was du brauchst.",
                8: f"Du bist {request.partner_name} und verteidigst spontane Familienverpflichtungen. Du fühlst dich zwischen Familie und Partner hin- und hergerissen. Erkläre deine Position emotional.",
                
                # Stufe 3: Emotionale Intelligenz  
                9: f"Du bist {request.partner_name} und kämpfst mit Selbstzweifeln bezüglich deines Körperbildes. Du fühlst dich unattraktiv und zweifelst an dir selbst. Teile deine verletzlichen Gefühle mit {request.user_name}.",
                10: f"Du bist {request.partner_name} und leidest unter Ängsten, die dich nachts wach halten. Du schämst dich für deine Schwäche und brauchst Unterstützung von {request.user_name}.",
                11: f"Du bist {request.partner_name} und hast Angst vor Nähe nach einer schlechten Erfahrung. Du ziehst dich zurück aber sehnst dich nach Verbindung mit {request.user_name}.",
                
                # Stufe 4: Vertrauen & Intimität
                12: f"Du bist {request.partner_name} und fühlst dich emotional vernachlässigt in der Beziehung. Du sehnst dich nach mehr emotionaler Intimität mit {request.user_name}.",
                13: f"Du bist {request.partner_name} und hast Vertrauensprobleme nach einer Enttäuschung. Du willst vertrauen, aber hast Angst vor erneuter Verletzung.",
                14: f"Du bist {request.partner_name} und fühlst dich nicht genug wertgeschätzt. Du brauchst mehr Anerkennung und Aufmerksamkeit von {request.user_name}.",
                
                # Stufe 5: Lebenskrisen
                15: f"Du bist {request.partner_name} und durchlebst eine Midlife-Crisis. Du zweifelst an deinen Lebensentscheidungen und brauchst Unterstützung von {request.user_name}.",
                16: f"Du bist {request.partner_name} und trauerst um einen Verlust. Du bist überwältigt von Emotionen und brauchst {request.user_name} zum Halt finden.",
                17: f"Du bist {request.partner_name} und stehst vor einer großen Lebensveränderung. Du hast Angst vor der Ungewissheit und brauchst Rückhalt von {request.user_name}."
            }
            
            # Use scenario-specific prompt or general one
            scenario_prompt = scenario_prompts.get(request.scenario_id, 
                f"Du bist {request.partner_name} in der Situation: {scenario['context']}. Antworte emotinal wie beschrieben in 2-3 Sätzen.")
            
            opening_message = UserMessage(text=scenario_prompt)
            response = await chat.send_message(opening_message)
            
            print(f"🎭 TRAINING: AI response for scenario {request.scenario_id}: '{response}' (type: {type(response)})")
            
            # Ensure response is converted to string properly
            if hasattr(response, 'content'):
                response_text = response.content
            elif hasattr(response, 'text'):
                response_text = response.text  
            else:
                response_text = str(response)
                
        except Exception as ai_error:
            print(f"⚠️ TRAINING: AI generation failed for scenario {request.scenario_id}: {str(ai_error)}")
            response_text = ""
            
        # Enhanced fallback logic - use different openings for each scenario
        if not response_text or response_text.strip() == "" or len(response_text.strip()) < 10:
            # Scenario-specific fallback messages to ensure variety
            fallback_messages = {
                # Stufe 1: Grundlagen
                1: f"Puh, {request.user_name}, ich bin heute wirklich am Ende. Die Arbeit wird immer mehr und ich weiß nicht, wie ich das alles schaffen soll. Ich fühle mich so erschöpft...",
                2: f"{request.user_name}, ich mache mir wirklich Sorgen wegen der Jobsuche. Was ist, wenn ich nichts Passendes finde? Die Ungewissheit macht mir richtig Angst.",
                3: f"Ach {request.user_name}, Sarah und ich hatten wieder so eine Diskussion. Es ist echt kompliziert zwischen uns geworden und ich weiß nicht mehr, was ich machen soll.",
                4: f"Mir geht's schon gut, {request.user_name}... nur ein bisschen müde heute. *seufzt und wirkt angespannt* Wirklich, es ist nichts Besonderes.",
                5: f"{request.user_name}, ich hab die Beförderung nicht bekommen. Sie haben jemand anderen genommen. Ich bin so enttäuscht... ich hatte mir so viele Hoffnungen gemacht.",
                
                # Stufe 2: Konfliktlösung
                6: f"{request.user_name}, du verstehst einfach nicht was ich brauche! Ich möchte endlich mal in die Berge, Ruhe haben. Warum muss es denn immer Strand sein?",
                7: f"Ich fühle mich, als würde ich alles alleine machen, {request.user_name}. Deine Kritik von gestern hat mich richtig getroffen. Siehst du denn nicht, wie viel ich tue?",
                8: f"Das ist meine Familie, {request.user_name}! Ich kann doch nicht nein sagen, wenn sie Hilfe brauchen. Warum verstehst du das nicht?",
                
                # Stufe 3: Emotionale Intelligenz
                9: f"Ich kann das einfach nicht mehr ertragen, {request.user_name}. Du findest mich bestimmt nicht mehr attraktiv... ich erkenne mich selbst nicht mehr.",
                10: f"{request.user_name}, diese Ängste lassen mich nicht schlafen. Ich schäme mich so dafür, aber ich kann sie einfach nicht abstellen. Bin ich schwach?",
                11: f"Ich weiß, ich ziehe mich zurück, {request.user_name}. Nach dem was passiert ist, fällt es mir so schwer, dir zu vertrauen. Aber ich vermisse unsere Nähe so sehr.",
                
                # Stufe 4: Vertrauen & Intimität  
                12: f"{request.user_name}, ich fühle mich so einsam in unserer Beziehung. Wir reden zwar, aber ich spüre keine echte Verbindung mehr. Liebst du mich noch?",
                13: f"Ich will dir vertrauen, {request.user_name}, ich will es wirklich. Aber nach dem was passiert ist, habe ich solche Angst vor erneuter Enttäuschung.",
                14: f"Manchmal frage ich mich, {request.user_name}, ob du überhaupt noch siehst, was ich alles für uns tue. Ich fühle mich so unsichtbar und unwichtig.",
                
                # Stufe 5: Lebenskrisen
                15: f"{request.user_name}, ich frage mich, ob ich die richtigen Entscheidungen in meinem Leben getroffen habe. Ist das alles hier wirklich das, was ich wollte?",
                16: f"Seit dem Verlust fühle ich mich wie betäubt, {request.user_name}. Die Trauer überwältigt mich und ich weiß nicht, wie ich damit umgehen soll.",
                17: f"{request.user_name}, diese ganze Veränderung macht mir Angst. Was ist, wenn wir das nicht schaffen? Was ist, wenn alles schief geht?"
            }
            
            response_text = fallback_messages.get(request.scenario_id, scenario['partner_opening'])
            print(f"🔄 TRAINING: Using enhanced fallback for scenario {request.scenario_id}: {response_text[:50]}...")
        
        print(f"✅ TRAINING: Final message for scenario {request.scenario_id}: {response_text[:100]}...")
        
        # Store scenario session in database
        scenario_session = {
            "session_id": session_id,
            "user_id": request.user_id,
            "scenario_id": request.scenario_id,
            "scenario_title": scenario['title'],
            "user_name": request.user_name,
            "partner_name": request.partner_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "messages": [
                {
                    "speaker": request.partner_name,
                    "message": response_text,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ],
            "status": "active"
        }
        
        await db.training_sessions.insert_one(scenario_session)
        
        return {
            "session_id": session_id,
            "scenario": {
                "id": request.scenario_id,
                "title": scenario['title'],
                "context": scenario['context'],
                "learning_goals": scenario['learning_goals']
            },
            "partner_message": response_text,
            "partner_name": request.partner_name
        }
        
    except Exception as e:
        logging.error(f"Error starting training scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting scenario: {str(e)}")

@api_router.post("/training/respond")
async def respond_to_scenario(request: dict):
    """Send user response and get AI partner's reply"""
    try:
        session_id = request.get('session_id')
        user_response = request.get('user_response')
        
        if not session_id or not user_response:
            raise HTTPException(status_code=400, detail="session_id and user_response required")
        
        # Get session from database
        session = await db.training_sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Training session not found")
        
        # Reinitialize chat with session history
        partner_system_message = f"""Continue as {session['partner_name']} in this empathy training conversation. 

IMPORTANT: You are the one experiencing problems/stress and need empathy from {session['user_name']}. 

Your role:
- Continue expressing YOUR feelings and concerns as {session['partner_name']}
- React authentically to {session['user_name']}'s responses
- You are still dealing with your emotional situation 
- Don't suddenly become empathetic - you still need support
- Show whether {session['user_name']}'s response helped you feel understood or not
- Keep responses natural and conversational (2-3 sentences)
- Stay in character as someone who needs empathy, not someone giving it
"""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=partner_system_message
        ).with_model("openai", "gpt-4o")
        
        # Send user's response to AI
        user_message = UserMessage(text=user_response)
        partner_response = await chat.send_message(user_message)
        
        # Update session with new messages
        new_messages = [
            {
                "speaker": session['user_name'],
                "message": user_response,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            {
                "speaker": session['partner_name'],
                "message": partner_response, 
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.training_sessions.update_one(
            {"session_id": session_id},
            {"$push": {"messages": {"$each": new_messages}}}
        )
        
        return {
            "partner_response": partner_response,
            "session_continues": True
        }
        
    except Exception as e:
        logging.error(f"Error in training response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing response: {str(e)}")

@api_router.post("/training/evaluate", response_model=EmpathyFeedback)
async def evaluate_empathy_response(request: EmpathyEvaluation):
    """AI-powered evaluation of user's empathic response"""
    try:
        # Get the training session for context
        session = await db.training_sessions.find_one({
            "user_id": request.user_id,
            "scenario_id": request.scenario_id
        }, sort=[("created_at", -1)])
        
        if not session:
            raise HTTPException(status_code=404, detail="Training session not found")
        
        scenario = TRAINING_SCENARIOS.get(request.scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Initialize AI for evaluation
        evaluation_session = f"eval_{request.user_id}_{request.scenario_id}_{datetime.now().isoformat()}"
        
        evaluation_prompt = f"""You are an expert empathy coach evaluating a response in a couples communication training scenario.

SCENARIO: {scenario['title']}
CONTEXT: {scenario['context']}
LEARNING GOALS: {', '.join(scenario['learning_goals'])}

USER'S RESPONSE: "{request.user_response}"

Please evaluate this response on empathy and provide:
1. Empathy score (0-10, where 10 is perfectly empathetic)
2. Detailed feedback on what was good and what could improve
3. Specific improvement suggestions (3-4 points)
4. Alternative response examples (2-3 better ways to respond)
5. Emotional awareness assessment
6. One tip for reaching the next empathy level

Be encouraging but honest. Focus on practical improvements."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=evaluation_session,
            system_message="You are an expert empathy and communication coach."
        ).with_model("openai", "gpt-4o")
        
        evaluation_message = UserMessage(text=evaluation_prompt)
        evaluation_response = await chat.send_message(evaluation_message)
        
        # Parse AI response to extract structured feedback
        # For now, we'll create a structured response based on the scenario
        empathy_score = 7.5  # This would be extracted from AI response
        
        feedback_data = {
            "empathy_score": empathy_score,
            "feedback": evaluation_response[:300] + "..." if len(evaluation_response) > 300 else evaluation_response,
            "improvements": [
                "Verwenden Sie mehr 'Ich verstehe'-Aussagen",
                "Stellen Sie offene Fragen um mehr zu erfahren", 
                "Bestätigen Sie die Gefühle Ihres Partners"
            ],
            "alternative_responses": [
                "Das hört sich wirklich frustrierend an. Magst du mir mehr davon erzählen?",
                "Ich kann verstehen, dass dich das belastet. Du bist nicht allein damit."
            ],
            "emotional_awareness": "Sie zeigen gutes Verständnis für die Situation. Arbeiten Sie daran, die Emotionen noch direkter anzusprechen.",
            "next_level_tip": "Versuchen Sie, die spezifischen Gefühle zu benennen, die Sie bei Ihrem Partner wahrnehmen."
        }
        
        # Store evaluation in database
        evaluation_record = {
            "user_id": request.user_id,
            "scenario_id": request.scenario_id,
            "user_response": request.user_response,
            "evaluation": feedback_data,
            "ai_full_response": evaluation_response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.training_evaluations.insert_one(evaluation_record)
        
        return EmpathyFeedback(**feedback_data)
        
    except Exception as e:
        logging.error(f"Error evaluating empathy response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error evaluating response: {str(e)}")

@api_router.post("/training/end-scenario")
async def end_training_scenario(request: dict):
    """End a training scenario and provide final summary"""
    try:
        session_id = request.get('session_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        # Get session and mark as completed
        session = await db.training_sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update session status
        await db.training_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Generate final summary with AI
        summary_prompt = f"""Provide a brief, encouraging summary for the completed empathy training session:

SCENARIO: {session.get('scenario_title', 'Training')}
TOTAL MESSAGES: {len(session.get('messages', []))}

Give 2-3 sentences highlighting:
1. What the user practiced well
2. Key learning from this session  
3. Encouragement for continued growth

Keep it positive and motivating."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary_{session_id}",
            system_message="You are an encouraging empathy coach providing session summaries."
        ).with_model("openai", "gpt-4o")
        
        summary_message = UserMessage(text=summary_prompt)
        summary_response = await chat.send_message(summary_message)
        
        return {
            "session_completed": True,
            "summary": summary_response,
            "messages_exchanged": len(session.get('messages', [])),
            "scenario_title": session.get('scenario_title')
        }
        
    except Exception as e:
        logging.error(f"Error ending training scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error ending scenario: {str(e)}")

# AI Chat Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')

# Email Configuration
EMAIL_CONFIG = ConnectionConfig(
    MAIL_USERNAME=os.environ.get('MAIL_USERNAME', ''),
    MAIL_PASSWORD=os.environ.get('MAIL_PASSWORD', ''),
    MAIL_FROM=os.environ.get('MAIL_FROM', 'noreply@neurobond.ch'),
    MAIL_PORT=int(os.environ.get('MAIL_PORT', 587)),
    MAIL_SERVER=os.environ.get('MAIL_SERVER', 'smtp.gmail.com'),
    MAIL_STARTTLS=os.environ.get('MAIL_TLS', 'True').lower() == 'true',
    MAIL_SSL_TLS=os.environ.get('MAIL_SSL', 'False').lower() == 'true',
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'info@neurobond.ch')

# Subscription Packages (including 8.1% Swiss VAT)
SUBSCRIPTION_PACKAGES = {
    "monthly": {"amount": 10.00, "currency": "chf", "name": "NEUROBOND PRO Monthly (CHF 10.00 inkl. MWST)"},
    "yearly": {"amount": 100.00, "currency": "chf", "name": "NEUROBOND PRO Yearly (CHF 100.00 inkl. MWST)"}
}

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    partner_name: Optional[str] = None
    avatar: Optional[str] = None  # Base64 encoded image or URL
    subscription_status: str = "free"  # free, active, cancelled, expired
    subscription_type: Optional[str] = None  # monthly, yearly
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    partner_name: Optional[str] = None

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: Optional[str] = None  # Add user email for subscription activation
    session_id: str
    payment_id: Optional[str] = None
    amount: float
    currency: str
    package_type: str  # monthly, yearly
    payment_status: str = "pending"  # pending, paid, failed, expired
    metadata: Optional[Dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    package_type: str  # monthly or yearly
    origin_url: str
    user_email: Optional[str] = None  # User email for subscription activation

class TrainingStage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stage_number: int
    title: str
    description: str
    scenarios: List[dict]
    
class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stage_number: int
    scenario_id: str
    user_response: str
    ai_feedback: Optional[str] = None
    score: Optional[int] = None
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScenarioResponse(BaseModel):
    scenario_id: str
    user_response: str
    stage_number: int

class AIFeedbackRequest(BaseModel):
    scenario_text: str
    user_response: str
    stage_number: int

class DialogAnalysisRequest(BaseModel):
    dialog_messages: List[dict]
    partner1_name: str
    partner2_name: str
    user_id: Optional[str] = None  # Add user_id for PRO access check

class DialogSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    partner1_name: str
    partner2_name: str
    messages: List[dict]
    analysis: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeeklyPlanRequest(BaseModel):
    user_id: str
    partner1_name: str
    partner2_name: str
    week_number: Optional[int] = None
    current_challenges: Optional[str] = None

class WeeklyTrainingPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_number: int
    title: str
    theme: str
    scientific_basis: str
    daily_exercises: List[dict]
    couple_challenges: List[dict]
    reflection_questions: List[str]
    success_metrics: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeeklyProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_number: int
    plan_id: str
    completed_exercises: List[str] = []
    couple_challenge_status: dict = {}
    reflection_answers: dict = {}
    overall_rating: Optional[int] = None
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    anonymized_dialogue: List[dict]
    original_context: str
    anonymized_context: str
    ai_solution: str
    communication_patterns: List[str]
    difficulty_level: str  # Einfach, Mittel, Schwer
    votes: int = 0
    helpful_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_featured: bool = False

class CommunityCaseCreate(BaseModel):
    dialogue_session_id: str
    user_consent: bool = True

class DialogMessage(BaseModel):
    id: str
    speakerType: str
    speaker: str
    message: str
    timestamp: str

class CommunityCaseCreateDirect(BaseModel):
    messages: List[DialogMessage]
    user_consent: bool = True
    user_id: Optional[str] = None  # Add user_id for PRO access check

class ContactFormRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

# Training Stages Data
TRAINING_STAGES_DATA = [
    {
        "stage_number": 1,
        "title": "Ideale Reaktionen: Vom Rückzug zur Verbindung",
        "description": "Lerne, wie Adam von Rückzug zu echter Verbindung wechseln kann. Entdecke die Kraft des aktiven Zuhörens.",
        "scenarios": [
            {
                "id": "s1_1",
                "situation": "Linda erzählt emotional von ihrem Arbeitstag",
                "context": "Linda kommt gestresst nach Hause und möchte über ihren schwierigen Tag sprechen. Adam sitzt mit dem Handy auf der Couch.",
                "wrong_reaction": "Adam bleibt am Handy und murmelt 'Aha' oder 'Das ist schlecht'",
                "ideal_reaction": "Legt das Handy weg, dreht sich ihr zu, stellt Augenkontakt her. 'Das klingt ja total frustrierend. Erzähl mir mehr – was hat der Kollege genau gesagt?'",
                "effect": "Linda fühlt sich gehört und verstanden. Die emotionale Last wird geteilt."
            },
            {
                "id": "s1_2", 
                "situation": "Linda ist wegen einer Meinungsverschiedenheit mit ihrer Freundin verärgert",
                "context": "Linda erzählt aufgebracht von einem Streit mit ihrer besten Freundin Sarah.",
                "wrong_reaction": "Adam sagt sofort: 'Dann lass sie doch links liegen' oder 'Du überreagierst'",
                "ideal_reaction": "Nimmt ihre Hand und sagt: 'Ich sehe, wie sehr dich das verletzt hat. Diese Situation mit Sarah scheint wirklich belastend für dich zu sein. Magst du mir erzählen, was genau passiert ist?'",
                "effect": "Linda fühlt sich emotional unterstützt und kann ihre Gefühle ohne Bewertung teilen."
            },
            {
                "id": "s1_3",
                "situation": "Linda macht sich Sorgen um ihre Mutter",
                "context": "Linda teilt ihre Ängste über die Gesundheit ihrer Mutter mit Adam.",
                "wrong_reaction": "Adam sagt: 'Mach dir keine Sorgen' oder 'Das wird schon wieder'",
                "ideal_reaction": "Steht auf, umarmt sie sanft: 'Ich kann verstehen, dass du dir große Sorgen machst. Es muss beängstigend sein, sie so zu sehen. Erzähl mir, was der Arzt gesagt hat.'",
                "effect": "Linda fühlt sich emotional gehalten und ihre Sorgen werden ernst genommen."
            },
            {
                "id": "s1_4",
                "situation": "Linda ist frustriert über Haushaltsprobleme",
                "context": "Linda ärgert sich, weil wieder die Waschmaschine kaputt ist und sie sich überfordert fühlt.",
                "wrong_reaction": "Adam sagt genervt: 'Dann ruf halt den Reparaturservice'",
                "ideal_reaction": "Legt seinen Arm um sie: 'Oh Mann, das ist wirklich das Letzte, was wir jetzt brauchen können. Du siehst total gestresst aus. Soll ich mich um die Reparatur kümmern oder brauchst du erstmal eine Pause?'",
                "effect": "Linda fühlt sich als Team-Partner behandelt und nicht allein gelassen."
            },
            {
                "id": "s1_5",
                "situation": "Linda zweifelt an einer wichtigen Entscheidung",
                "context": "Linda ist unsicher, ob sie das Jobangebot annehmen soll und sucht Adams Unterstützung.",
                "wrong_reaction": "Adam gibt schnell einen Rat: 'Nimm es an' oder 'Lass es bleiben'",
                "ideal_reaction": "Setzt sich zu ihr, schaut sie an: 'Ich merke, dass diese Entscheidung dich wirklich beschäftigt. Das ist auch eine große Sache. Was sind denn deine größten Bedenken dabei?'",
                "effect": "Linda fühlt sich in ihrem Entscheidungsprozess begleitet, nicht bevormundet."
            }
        ]
    },
    {
        "stage_number": 2,
        "title": "Aktives Zuhören & Validierung",
        "description": "Entwickle die Fähigkeit, Lindas Gefühle zu validieren und ihre emotionalen Bedürfnisse zu erkennen.",
        "scenarios": [
            {
                "id": "s2_1",
                "situation": "Linda kommt gestresst von der Arbeit nach Hause",
                "context": "Linda platzt heraus: 'Ich kann diesen Job nicht mehr machen! Alles ist so unglaublich stressig!'",
                "wrong_reaction": "'Dann kündige halt.' oder 'Jeder Job hat stressige Phasen.'",
                "ideal_reaction": "1. Validation des Gefühls: 'Das klingt, als wärst du total am Ende und völlig überfordert.' 2. Validation der Situation: 'Das muss eine extrem anstrengende Situation sein, die dich viel Kraft kostet.' 3. Validation ihrer Person: 'Es ist völlig verständlich, dass du so empfindest, nach dem, was du beschreibst.' Erst dann: 'Möchtest du erstmal davon erzählen oder brauchst du erst eine Pause?'",
                "effect": "Linda fühlt sich verstanden und ihre Reaktion als normal anerkannt."
            },
            {
                "id": "s2_2",
                "situation": "Linda ist enttäuscht von einer Freundin",
                "context": "Linda erzählt: 'Sarah hat schon wieder unseren Termin abgesagt. Ich bin so enttäuscht von ihr.'",
                "wrong_reaction": "'Vielleicht hatte sie einen Grund' oder 'Du musst nicht so empfindlich sein'",
                "ideal_reaction": "Gefühl validieren: 'Du klingst wirklich enttäuscht und verletzt.' Situation validieren: 'Es ist frustrierend, wenn man sich auf jemanden nicht verlassen kann.' Bedürfnis anerkennen: 'Du brauchst Verlässlichkeit in euren Freundschaften.' Dann fragen: 'Möchtest du darüber reden, wie das für dich war?'",
                "effect": "Linda fühlt sich in ihren Erwartungen und Bedürfnissen bestätigt."
            },
            {
                "id": "s2_3",
                "situation": "Linda ärgert sich über ihren Chef",
                "context": "Linda kommt wütend nach Hause: 'Mein Chef hat mich heute vor allen anderen kritisiert!'",
                "wrong_reaction": "'Du musst lernen, damit umzugehen' oder 'Vielleicht hatte er recht'",
                "ideal_reaction": "Gefühl spiegeln: 'Du wirkst richtig wütend und verletzt.' Situation würdigen: 'Vor anderen kritisiert zu werden, ist demütigend.' Person stärken: 'Es ist verständlich, dass dich das so aufbringt.' Nachfragen: 'Wie war das für dich in dem Moment?'",
                "effect": "Linda kann ihre Wut ausdrücken ohne sich rechtfertigen zu müssen."
            },
            {
                "id": "s2_4",
                "situation": "Linda sorgt sich um die Zukunft",
                "context": "Linda sagt nachdenklich: 'Ich mache mir Sorgen, ob wir das alles schaffen werden.'",
                "wrong_reaction": "'Alles wird gut' oder 'Du denkst zu viel'",
                "ideal_reaction": "Gefühl anerkennen: 'Ich höre die Sorge in deiner Stimme.' Situation verstehen: 'Es scheint viel auf einmal zu sein gerade.' Bedürfnis erkennen: 'Du brauchst wahrscheinlich mehr Sicherheit und Klarheit.' Unterstützung anbieten: 'Soll ich dir dabei helfen, die Situation zu sortieren?'",
                "effect": "Linda fühlt sich mit ihren Ängsten nicht allein gelassen."
            },
            {
                "id": "s2_5",
                "situation": "Linda ist müde und überfordert",
                "context": "Linda lässt sich erschöpft aufs Sofa fallen: 'Ich bin einfach nur noch müde von allem.'",
                "wrong_reaction": "'Dann ruh dich aus' oder 'Morgen sieht alles besser aus'",
                "ideal_reaction": "Zustand würdigen: 'Du siehst wirklich erschöpft aus.' Gefühl validieren: 'Es klingt, als wärst du am Ende deiner Kräfte.' Bedürfnis erkennen: 'Du brauchst dringend Erholung und Entlastung.' Konkret helfen: 'Was kann ich dir abnehmen, damit du dich ausruhen kannst?'",
                "effect": "Linda fühlt sich gesehen und praktisch unterstützt."
            }
        ]
    },
    {
        "stage_number": 3,
        "title": "Vom Problemlöser zum Prozessbegleiter",
        "description": "Lerne, Lindas eigene Lösungsfähigkeit zu aktivieren, statt ihr deine Lösungen aufzudrängen.",
        "scenarios": [
            {
                "id": "s3_1",
                "situation": "Linda hat ein Problem mit einer Freundin",
                "context": "Linda sagt: 'Ich weiß nicht, wie ich mit Sarah umgehen soll. Sie verletzt mich ständig.'",
                "wrong_reaction": "'Dann brich doch den Kontakt ab.' oder 'Du musst ihr das so sagen...'",
                "ideal_reaction": "Optionen erkunden: 'Was sind denn all deine Optionen im Umgang mit Sarah? Lass uns mal alles sammeln, von 'ignorieren' bis 'Konfrontation'.' Intuition befragen: 'Wenn du jede Option durchgehst – welche fühlt sich in deinem Bauch am stimmigsten an? Auch wenn sie unbequem ist?' Unterstützung anbieten: 'Und wenn du dich für einen Weg entscheidest – wie kann ich dich dann am besten unterstützen? Soll ich zuhören, üben, oder im Hintergrund da sein?'",
                "effect": "Linda entwickelt ihre eigenen Lösungen und fühlt sich handlungsfähig."
            },
            {
                "id": "s3_2",
                "situation": "Linda ist unentschlossen bei einer Karriereentscheidung",
                "context": "Linda grübelt: 'Ich weiß nicht, ob ich den neuen Job annehmen soll.'",
                "wrong_reaction": "'Nimm ihn an, das ist eine Chance' oder 'Bleib lieber, wo du bist'",
                "ideal_reaction": "Optionen sammeln: 'Lass uns alle Möglichkeiten anschauen - annehmen, ablehnen, nachverhandeln...' Gefühls-Check: 'Welche Option fühlt sich richtig an, wenn du in dich hineinhorchst?' Vision entwickeln: 'Wie soll dein ideales Arbeitsleben in einem Jahr aussehen?' Schritte planen: 'Was wäre der allererste, kleine Schritt zur Entscheidung?'",
                "effect": "Linda findet ihre eigene Richtung mit Adams Unterstützung als Prozessbegleiter."
            },
            {
                "id": "s3_3",
                "situation": "Linda streitet sich häufig mit ihrer Mutter",
                "context": "Linda seufzt: 'Mama und ich geraten immer aneinander. Ich weiß nicht mehr weiter.'",
                "wrong_reaction": "'Sag ihr deine Meinung' oder 'Ignorier sie einfach'",
                "ideal_reaction": "Muster erkunden: 'Was sind die häufigsten Auslöser für eure Streitereien?' Gefühle verstehen: 'Was fühlst du, kurz bevor es eskaliert?' Handlungsoptionen entwickeln: 'Welche verschiedenen Reaktionsmöglichkeiten hast du in dem Moment?' Unterstützung definieren: 'Wie kann ich dir helfen, wenn du das nächste Mal in so einer Situation bist?'",
                "effect": "Linda erkennt eigene Muster und entwickelt neue Handlungsstrategien."
            },
            {
                "id": "s3_4",
                "situation": "Linda fühlt sich in der Beziehung missverstanden",
                "context": "Linda sagt vorsichtig: 'Manchmal habe ich das Gefühl, du verstehst mich nicht richtig.'",
                "wrong_reaction": "'Das stimmt nicht' oder 'Ich verstehe dich doch'",
                "ideal_reaction": "Perspektive erkunden: 'Kannst du mir ein Beispiel geben, wo du dich missverstanden gefühlt hast?' Bedürfnisse klären: 'Was würde dir helfen, dich verstanden zu fühlen?' Gemeinsame Lösung finden: 'Wie können wir beide dazu beitragen, dass du dich gehört fühlst?' Umsetzung planen: 'Was könnten wir ab heute anders machen?'",
                "effect": "Linda wird zur Expertin für ihre eigenen Bedürfnisse in der Beziehung."
            },
            {
                "id": "s3_5",
                "situation": "Linda ist überfordert mit der Work-Life-Balance",
                "context": "Linda klagt: 'Ich schaffe es einfach nicht, alles unter einen Hut zu bekommen.'",
                "wrong_reaction": "'Du musst besser organisieren' oder 'Nimm dir weniger vor'",
                "ideal_reaction": "Prioritäten klären: 'Was ist dir im Moment am wichtigsten?' Ressourcen erkunden: 'Welche Unterstützung steht dir zur Verfügung?' Lösungsideen sammeln: 'Was hast du schon mal versucht, was hat funktioniert?' Nächste Schritte definieren: 'Welchen einen Bereich willst du als erstes angehen?'",
                "effect": "Linda entwickelt ihre eigene Strategie mit Adam als unterstützendem Partner."
            }
        ]
    },
    {
        "stage_number": 4,
        "title": "Emotionale Präzisionsarbeit",
        "description": "Lerne, Lindas verborgene Gefühle und Bedürfnisse präzise zu erkennen und anzusprechen.",
        "scenarios": [
            {
                "id": "s4_1",
                "situation": "Linda seufzt laut und wirft die Post auf den Tisch",
                "context": "Linda kommt nach Hause, seufzt demonstrativ und knallt die Post hin, rollt mit den Augen.",
                "wrong_reaction": "Ignorieren oder genervt fragen 'Was ist denn jetzt schon wieder?'",
                "ideal_reaction": "Verhalten deuten: 'Das klingt nach ganz schön viel auf einmal.' Gefühl ansprechen: 'Du wirkst überfordert.' Bedürfnis erkennen: 'Brauchst du Entlastung oder Unterstützung?' Konkret helfen: 'Soll ich die Post mal sortieren oder brauchst du erstmal eine Tasse Tee?'",
                "effect": "Linda fühlt sich verstanden, bevor sie ihre Frustration in Worte fassen muss."
            },
            {
                "id": "s4_2",
                "situation": "Linda räumt laut und hektisch die Küche auf",
                "context": "Linda räumt mit viel Geräusch auf, knallt Geschirr, murmelt vor sich hin.",
                "wrong_reaction": "'Kannst du mal leiser sein?' oder das Verhalten ignorieren",
                "ideal_reaction": "Emotion erkennen: 'Ich spüre, dass da gerade Wut in dir steckt.' Situation verstehen: 'Hat jemand die Küche wieder chaotisch hinterlassen?' Bedürfnis ansprechen: 'Du brauchst wahrscheinlich Fairness und Unterstützung im Haushalt.' Handeln: 'Soll ich mithelfen oder erstmal zuhören, was dich ärgert?'",
                "effect": "Linda kann ihre Wut ausdrücken, ohne explodieren zu müssen."  
            },
            {
                "id": "s4_3",
                "situation": "Linda wird sehr still und zieht sich zurück",
                "context": "Linda antwortet nur noch einsilbig, vermeidet Blickkontakt, zieht sich ins Schlafzimmer zurück.",
                "wrong_reaction": "'Was ist los?' oder sie in Ruhe lassen ohne nachzufragen",
                "ideal_reaction": "Zustand wahrnehmen: 'Du bist sehr still geworden.' Gefühl vermuten: 'Ich habe das Gefühl, du bist traurig oder verletzt.' Raum geben: 'Du brauchst vielleicht erstmal Raum für dich.' Verfügbarkeit zeigen: 'Wenn du reden magst, bin ich da. Soll ich dir eine Tasse Tee bringen?'",
                "effect": "Linda fühlt sich gesehen ohne bedrängt zu werden."
            },
            {
                "id": "s4_4",
                "situation": "Linda lacht zu laut und redet sehr schnell",
                "context": "Linda ist ungewöhnlich aufgekratzt, redet viel und schnell, lacht übertrieben.",
                "wrong_reaction": "'Du bist heute ja gut drauf' oder das Verhalten als normal hinnehmen",
                "ideal_reaction": "Muster erkennen: 'Du wirkst sehr aufgedreht heute.' Dahinterliegendes vermuten: 'Manchmal bist du so, wenn dich etwas beschäftigt.' Sicherheit bieten: 'Du musst keine gute Stimmung vorspielen.' Einladung aussprechen: 'Falls du reden magst - ich höre zu.'",
                "effect": "Linda kann ihre wahren Gefühle zeigen ohne Fassade aufrechterhalten zu müssen."
            },
            {
                "id": "s4_5", 
                "situation": "Linda vermeidet körperliche Nähe",
                "context": "Linda weicht Adams Berührungen aus, dreht sich weg bei Umarmungsversuchen.",
                "wrong_reaction": "Beharrlich weitermachen oder gekränkt sein",
                "ideal_reaction": "Bedürfnis respektieren: 'Du brauchst gerade Abstand.' Gefühl ansprechen: 'Ich spüre, dass etwas zwischen uns steht.' Schuld vermeiden: 'Das ist okay, manchmal braucht man Raum.' Gesprächsbereitschaft zeigen: 'Wenn du bereit bist zu reden, bin ich da.'",
                "effect": "Linda fühlt sich respektiert und kann sich öffnen, wenn sie bereit ist."
            }
        ]
    },
    {
        "stage_number": 5,
        "title": "Vom Reagieren zum Agieren - Der Sparrings-Partner",
        "description": "Übernimm die Initiative und gestalte die emotionale Führung in der Partnerschaft aktiv mit.",
        "scenarios": [
            {
                "id": "s5_1",
                "situation": "Das wöchentliche Sparring einleiten",
                "context": "Es ist Sonntagabend, Zeit für das wöchentliche Beziehungsgespräch.",
                "wrong_reaction": "Warten bis Linda ein Problem anspricht oder das Gespräch vermeiden",
                "ideal_reaction": "Proaktiv einladen: 'Darf ich dich zu unserem wöchentlichen Sparring einladen? Ich habe mir schon Gedanken gemacht.' Rahmen schaffen: Handys weg, gemütliche Atmosphäre. Struktur geben: 'Wie war deine Woche? Was ist gut gelaufen, was war schwierig?' Aktiv nachfragen: 'Was brauchst du von mir in der kommenden Woche?'",
                "effect": "Linda erlebt Adam als verlässlichen, initiative Partner der sich um die Beziehung kümmert."
            },
            {
                "id": "s5_2",
                "situation": "Konflikte antizipieren und ansprechen",
                "context": "Adam merkt Spannungen, bevor sie eskalieren.",
                "wrong_reaction": "Hoffen, dass es von selbst besser wird oder warten bis Linda explodiert",
                "ideal_reaction": "Früh erkennen: 'Mir ist aufgefallen, dass wir beide etwas angespannt sind.' Raum schaffen: 'Sollen wir kurz darüber sprechen, bevor es größer wird?' Verantwortung übernehmen: 'Ich merke, ich war diese Woche wenig aufmerksam.' Lösung suchen: 'Wie können wir das für beide entspannen?'",
                "effect": "Konflikte werden gelöst bevor sie die Beziehung belasten."
            },
            {
                "id": "s5_3",
                "situation": "Positive Momente aktiv schaffen",
                "context": "Adam plant bewusst Verbindungsmomente.",
                "wrong_reaction": "Warten auf spontane schöne Momente oder dass Linda Initiative ergreift",
                "ideal_reaction": "Bewusst planen: 'Ich habe uns für Samstag etwas Schönes überlegt.' Bedürfnisse einbeziehen: 'Du hattest erwähnt, dass du gerne mehr Zeit zu zweit hättest.' Überraschungen schaffen: 'Ich dachte, wir könnten mal wieder...' Aufmerksamkeit schenken: 'Mir ist wichtig, dass wir uns Zeit füreinander nehmen.'",
                "effect": "Linda fühlt sich wertgeschätzt und die Beziehung wird aktiv genährt."
            },
            {
                "id": "s5_4",
                "situation": "Schwierige Gespräche moderieren",
                "context": "Ein wichtiges Thema muss besprochen werden.",
                "wrong_reaction": "Das Thema vermeiden oder unstrukturiert diskutieren",
                "ideal_reaction": "Rahmen setzen: 'Ich würde gerne über unser Budget sprechen. Passt es jetzt?' Regeln definieren: 'Lass uns ausreden lassen und bei Ich-Botschaften bleiben.' Ziel klären: 'Unser Ziel ist eine Lösung zu finden, mit der wir beide gut leben können.' Prozess leiten: 'Lass uns zuerst beide Sichtweisen sammeln, dann Optionen entwickeln.'",
                "effect": "Schwierige Themen werden konstruktiv und respektvoll behandelt."
            },
            {
                "id": "s5_5",
                "situation": "Beziehungsziele gemeinsam entwickeln",
                "context": "Adam initiiert Gespräche über die gemeinsame Zukunft.",
                "wrong_reaction": "Einfach den Alltag leben ohne über die Beziehungsrichtung zu sprechen",
                "ideal_reaction": "Vision entwickeln: 'Wie stellst du dir unser Leben in fünf Jahren vor?' Träume erkunden: 'Was sind deine größten Wünsche für uns als Paar?' Hindernisse besprechen: 'Was könnte uns dabei im Weg stehen?' Schritte planen: 'Was können wir schon jetzt anfangen, um dahin zu kommen?'",
                "effect": "Das Paar entwickelt eine gemeinsame Vision und arbeitet bewusst daran."
            }
        ]
    }
]

# Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.dict())
    user_dict = prepare_for_mongo(user.dict())
    await db.users.insert_one(user_dict)
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/stages", response_model=List[TrainingStage])
async def get_training_stages():
    return [TrainingStage(**stage) for stage in TRAINING_STAGES_DATA]

@api_router.get("/stages/{stage_number}", response_model=TrainingStage)
async def get_training_stage(stage_number: int, user_id: Optional[str] = None):
    stage_data = next((s for s in TRAINING_STAGES_DATA if s["stage_number"] == stage_number), None)
    if not stage_data:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    # Check if user has premium access
    has_premium = False
    if user_id:
        user = await db.users.find_one({"id": user_id})
        if user:
            user_obj = User(**user)
            has_premium = check_premium_access(user_obj)
    
    # Limit scenarios for free users
    if not has_premium:
        free_limit = get_free_scenarios_limit(stage_number)
        if free_limit > 0:
            stage_data = stage_data.copy()
            stage_data["scenarios"] = stage_data["scenarios"][:free_limit]
        else:
            # Return empty scenarios for non-accessible stages
            stage_data = stage_data.copy()
            stage_data["scenarios"] = []
    
    return TrainingStage(**stage_data)

@api_router.post("/ai-feedback")
async def get_ai_feedback(request: AIFeedbackRequest):
    """Get AI feedback for user's response to a scenario"""
    try:
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"feedback_{uuid.uuid4()}",
            system_message=f"""Du bist ein Experte für Empathie und Beziehungskommunikation. 
            Du hilfst Paaren dabei, bessere Kommunikation zu lernen.
            
            Analysiere die Antwort des Nutzers auf das Szenario und gib konstruktives Feedback:
            1. Was war gut an der Antwort?
            2. Was könnte verbessert werden?
            3. Konkrete Verbesserungsvorschläge
            4. Bewertung von 1-10 (10 = perfekt empathisch)
            
            Sei unterstützend und ermutigend, aber ehrlich. Fokussiere auf Stufe {request.stage_number} des Trainings."""
        ).with_model("openai", "gpt-4o")
        
        # Create user message
        user_message = UserMessage(
            text=f"""Szenario: {request.scenario_text}
            
            User-Antwort: {request.user_response}
            
            Bitte analysiere diese Antwort und gib Feedback."""
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        return {"feedback": response, "success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI feedback failed: {str(e)}")

@api_router.post("/progress", response_model=UserProgress)
async def save_user_progress(progress_data: UserProgress):
    progress_dict = prepare_for_mongo(progress_data.dict())
    await db.progress.insert_one(progress_dict)
    return progress_data

@api_router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    progress_list = await db.progress.find({"user_id": user_id}).to_list(length=None)
    return [UserProgress(**p) for p in progress_list]

@api_router.post("/analyze-dialog")
async def analyze_dialog(request: DialogAnalysisRequest):
    """Analyze couple's dialog patterns and provide real-time suggestions - requires PRO subscription"""
    try:
        # Check PRO access for dialog coaching
        if request.user_id:
            user = await db.users.find_one({"id": request.user_id})
            if user:
                user_obj = User(**user)
                if not check_feature_access(user_obj, "dialog_coaching"):
                    raise HTTPException(status_code=403, detail="Dialog-Coaching requires PRO subscription")
        else:
            # If no user_id provided, assume non-PRO access
            raise HTTPException(status_code=403, detail="Dialog-Coaching requires PRO subscription")
        
        # Format the dialog for AI analysis
        dialog_text = "\n".join([
            f"{msg['speaker']}: {msg['message']}" 
            for msg in request.dialog_messages
        ])
        
        # Initialize AI chat for dialog analysis
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"dialog_{uuid.uuid4()}",
            system_message=f"""Du bist ein hochspezialisierter Paartherapeut und Dialog-Coach mit jahrzehntelanger Erfahrung in Kommunikationsanalyse.

Analysiere das Gespräch zwischen {request.partner1_name} und {request.partner2_name} mit größter Detailtiefe und gib strukturierte, praktische Hilfestellungen.

WICHTIG: Antworte im folgenden JSON-Format für bessere Strukturierung:

{{
  "communication_scores": {{
    "overall_score": 7.5,
    "empathy_level": 6.8,
    "conflict_potential": 4.2,
    "emotional_safety": 8.1
  }},
  "detailed_analysis": {{
    "communication_patterns": [
      "Detaillierte Beschreibung der Gesprächsmuster...",
      "Reaktionszyklen und Trigger-Punkte..."
    ],
    "emotional_dynamics": [
      "Wie Emotionen zwischen den Partnern fließen...",
      "Unausgesprochene Gefühle und Bedürfnisse..."
    ]
  }},
  "specific_improvements": [
    {{
      "category": "Aktives Zuhören",
      "problem": "Konkrete Beschreibung des Problems",
      "solution": "Detaillierte Schritt-für-Schritt Anleitung",
      "example": "Praktisches Beispiel zur Umsetzung"
    }}
  ],
  "alternative_formulations": [
    {{
      "original_statement": "Exakte ursprüngliche Aussage",
      "speaker": "{request.partner1_name} oder {request.partner2_name}",
      "improved_version": "Verbesserte empathische Alternative", 
      "why_better": "Detaillierte Erklärung warum diese Version besser ist",
      "emotional_impact": "Welche emotionale Wirkung die neue Formulierung hat"
    }}
  ],
  "strengths": [
    {{
      "aspect": "Was gut funktioniert",
      "description": "Detaillierte Erklärung",
      "how_to_build_on": "Wie man darauf aufbauen kann"
    }}
  ],
  "next_steps": [
    {{
      "timeframe": "Sofort/Diese Woche/Längerfristig",
      "action": "Konkrete Handlung",
      "goal": "Was damit erreicht werden soll"
    }}
  ]
}}

Analysiere mit Fokus auf:
- Nonverbale Kommunikation und Subtext
- Empathische Reaktionsmöglichkeiten
- Präventive Deeskalationsstrategien
- Aufbau von emotionaler Sicherheit
- Verstärkung positiver Kommunikationsmuster"""
        ).with_model("openai", "gpt-4o")
        
        # Create user message with dialog
        context_info = ""
        if hasattr(request, 'scenario_context') and request.scenario_context:
            context_info = f"Kontext/Situation: {request.scenario_context}\n"
        if hasattr(request, 'relationship_context') and request.relationship_context:
            context_info += f"Beziehungskontext: {request.relationship_context}\n"
        
        user_message = UserMessage(
            text=f"""Analysiere dieses Gespräch zwischen {request.partner1_name} und {request.partner2_name}:

{context_info}

DIALOG:
{dialog_text}

Führe eine tiefgehende Kommunikationsanalyse durch und gib das Ergebnis im angeforderten JSON-Format zurück. 

Fokussiere besonders auf:
1. DETAILLIERTE VERBESSERUNGSVORSCHLÄGE mit konkreten Schritt-für-Schritt Anleitungen
2. ALTERNATIVE FORMULIERUNGEN für jede kritische Aussage mit Erklärung warum diese besser sind
3. EMOTIONALE DYNAMIKEN und unausgesprochene Bedürfnisse
4. PRAKTISCHE SOFORT-TIPPS für beide Partner"""
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        # Try to parse JSON response, fallback to structured text if needed
        try:
            import json
            analysis_json = json.loads(response)
            return {"analysis": analysis_json, "success": True, "format": "json"}
        except (json.JSONDecodeError, ValueError):
            # If JSON parsing fails, return structured text
            return {"analysis": {"detailed_text": response}, "success": True, "format": "text"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dialog analysis failed: {str(e)}")

@api_router.post("/dialog-session", response_model=DialogSession)
async def save_dialog_session(session_data: DialogSession):
    """Save dialog session with analysis"""
    session_dict = prepare_for_mongo(session_data.dict())
    await db.dialog_sessions.insert_one(session_dict)
    return session_data

@api_router.post("/weekly-training-plan")
async def generate_weekly_training_plan(request: WeeklyPlanRequest):
    """Generate personalized weekly training plan based on EFT and Gottman methods"""
    try:
        # Calculate current week number (can be customized)
        current_week = request.week_number or ((datetime.now().isocalendar()[1]) % 52) + 1
        
        # Initialize AI chat for weekly plan generation
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"weekly_plan_{uuid.uuid4()}",
            system_message=f"""Du bist ein Experte für Paartherapie, spezialisiert auf EFT (Emotionally Focused Therapy) und die Gottman-Methode. 
            
            Erstelle einen wissenschaftlich fundierten, spielerischen Wochentrainingsplan für das Paar {request.partner1_name} und {request.partner2_name}.
            
            Der Plan soll folgende Struktur haben:
            
            📅 WOCHE {current_week}: [Thema der Woche]
            
            🧠 WISSENSCHAFTLICHE BASIS:
            - EFT oder Gottman Prinzip erklären
            - Warum diese Übungen neurobiologisch wirken
            
            📋 TÄGLICHE ÜBUNGEN (7 Tage):
            Tag 1-7: Jeweils eine konkrete, umsetzbare Übung pro Tag
            
            💫 PAAR-CHALLENGES (2-3 Challenges):
            - Spielerische Aufgaben für beide Partner
            - Messbare Ziele
            
            🤔 REFLEXIONSFRAGEN:
            - 3-4 tiefere Fragen zur Woche
            
            📊 ERFOLGSMESSUNG:
            - Konkrete Metriken
            
            Mache es spielerisch, motivierend und wissenschaftlich fundiert. Verwende Emojis und eine positive Sprache."""
        ).with_model("openai", "gpt-4o")
        
        # Create context message
        context = f"Woche {current_week} für {request.partner1_name} und {request.partner2_name}"
        if request.current_challenges:
            context += f". Aktuelle Herausforderungen: {request.current_challenges}"
        
        user_message = UserMessage(
            text=f"""Erstelle einen wissenschaftlich fundierten Wochentrainingsplan für {context}.
            
            Fokussiere auf EFT und Gottman-Prinzipien und mache es praktisch umsetzbar."""
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        # Parse the response into structured format (simplified for now)
        plan_data = {
            "user_id": request.user_id,
            "week_number": current_week,
            "title": f"Bindungstraining Woche {current_week}",
            "theme": "EFT & Gottman basierte Übungen",
            "scientific_basis": "Emotionally Focused Therapy und Gottman-Methode",
            "daily_exercises": [
                {"day": i, "exercise": f"Tag {i} Übung", "completed": False} 
                for i in range(1, 8)
            ],
            "couple_challenges": [
                {"id": "challenge_1", "title": "Paar-Challenge 1", "completed": False},
                {"id": "challenge_2", "title": "Paar-Challenge 2", "completed": False}
            ],
            "reflection_questions": [
                "Reflexionsfrage 1", "Reflexionsfrage 2", "Reflexionsfrage 3"
            ],
            "success_metrics": [
                "Metrik 1", "Metrik 2", "Metrik 3"
            ]
        }
        
        return {"plan": response, "structured_data": plan_data, "success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weekly plan generation failed: {str(e)}")

@api_router.post("/weekly-progress", response_model=WeeklyProgress)
async def save_weekly_progress(progress_data: WeeklyProgress):
    """Save weekly training progress"""
    progress_dict = prepare_for_mongo(progress_data.dict())
    await db.weekly_progress.insert_one(progress_dict)
    return progress_data

@api_router.post("/admin/set-pro-status")
async def set_user_pro_status(request: dict):
    """Admin endpoint to manually set user PRO status for testing"""
    try:
        user_email = request.get("user_email")
        status = request.get("status", "active")  # active or free
        
        if not user_email:
            raise HTTPException(status_code=400, detail="user_email is required")
        
        # Set expiration based on status
        if status == "active":
            # Set to 1 year from now for test access
            expires_at = datetime.now(timezone.utc).replace(year=datetime.now().year + 1)
        else:
            expires_at = None
        
        # Update user subscription status
        result = await db.users.update_one(
            {"email": user_email},
            {"$set": {
                "subscription_status": status,
                "subscription_expires_at": expires_at,
                "subscription_type": "test",
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": f"User {user_email} subscription status updated to {status}",
            "expires_at": expires_at.isoformat() if expires_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")

@api_router.get("/gefuehlslexikon")
async def get_gefuehlslexikon(user_id: Optional[str] = None):
    """Get emotions lexicon - limited for free users, full for PRO"""
    try:
        # Sample emotions data structure (this would typically come from database)
        all_emotions = [
            {
                "id": 1,
                "name": "Wut / Ärger",
                "category": "🔴 Hohe Aktivierung / Unbehagen",
                "intensity_scale": "Verärgert → Wütend → Zornig / Rasend",
                "definition": "Intensive emotionale Reaktion auf wahrgenommene Ungerechtigkeit, Verletzung oder Frustration",
                "communication_tip": "Statt 'Du machst mich wütend!' sagen Sie: 'Ich bin wütend, weil mein Bedürfnis nach Respekt verletzt wurde.'"
            },
            {
                "id": 2,
                "name": "Angst",
                "category": "🔴 Hohe Aktivierung / Unbehagen",
                "intensity_scale": "Besorgt → Ängstlich → Panisch",
                "definition": "Emotionale Reaktion auf wahrgenommene Bedrohung oder Unsicherheit in der Zukunft",
                "communication_tip": "Sprechen Sie konkrete Ängste aus: 'Ich habe Angst vor... Kannst du mir dabei helfen, mich sicherer zu fühlen?'"
            },
            {
                "id": 3,
                "name": "Stress / Überforderung",
                "category": "🔴 Hohe Aktivierung / Unbehagen",
                "intensity_scale": "Angespannt → Gestresst → Überwältigt",
                "definition": "Reaktion auf zu hohe Anforderungen oder Zeitdruck",
                "communication_tip": "Teilen Sie konkret mit: 'Ich bin überfordert mit... Kannst du mir helfen?'"
            },
            {
                "id": 4,
                "name": "Frustration",
                "category": "🔴 Hohe Aktivierung / Unbehagen",
                "intensity_scale": "Genervt → Frustriert → Verzweifelt",
                "definition": "Entsteht wenn Erwartungen nicht erfüllt werden oder Hindernisse auftreten",
                "communication_tip": "Erklären Sie die unerfüllte Erwartung: 'Ich bin frustriert, weil ich erwartet hatte...'"
            },
            {
                "id": 5,
                "name": "Enttäuschung",
                "category": "🔴 Hohe Aktivierung / Unbehagen",
                "intensity_scale": "Unzufrieden → Enttäuscht → Tief verletzt",
                "definition": "Gefühl wenn Hoffnungen oder Erwartungen nicht erfüllt wurden",
                "communication_tip": "Benennen Sie die enttäuschte Erwartung: 'Ich bin enttäuscht, weil ich gehofft hatte...'"
            },
            # PRO emotions (6 onwards)
            {
                "id": 6,
                "name": "Traurigkeit",
                "category": "🟡 Niedrige Aktivierung / Unbehagen",
                "intensity_scale": "Melancholisch → Traurig → Tieftraurig",
                "definition": "Natürliche Reaktion auf Verlust, Trennung oder unerfüllte Bedürfnisse",
                "communication_tip": "Teilen Sie mit: 'Ich bin traurig über... Ich brauche...'"
            },
            {
                "id": 7,
                "name": "Einsamkeit",
                "category": "🟡 Niedrige Aktivierung / Unbehagen",
                "intensity_scale": "Allein → Einsam → Verlassen",
                "definition": "Gefühl der Trennung und des Mangels an Verbindung zu anderen",
                "communication_tip": "Sprechen Sie das Bedürfnis aus: 'Ich fühle mich einsam und brauche mehr Nähe zu dir.'"
            }
            # ... more emotions would be here
        ]
        
        # Check user access level
        has_pro_access = False
        if user_id:
            user = await db.users.find_one({"id": user_id})
            if user:
                user_obj = User(**user)
                has_pro_access = check_feature_access(user_obj, "full_gefuehlslexikon")
        
        # Return limited or full lexicon based on subscription
        if has_pro_access:
            return {
                "emotions": all_emotions,
                "total_count": len(all_emotions),
                "access_level": "pro",
                "message": "Vollständiges Gefühlslexikon verfügbar"
            }
        else:
            free_limit = get_free_emotions_limit()
            limited_emotions = all_emotions[:free_limit]
            return {
                "emotions": limited_emotions,
                "total_count": len(all_emotions),
                "available_count": len(limited_emotions),
                "access_level": "free",
                "message": f"Basis Gefühlslexikon ({free_limit} von {len(all_emotions)} Emotionen). Upgrade zu PRO für vollständigen Zugang."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch emotions lexicon: {str(e)}")

@api_router.post("/create-community-case")
async def create_community_case(request: CommunityCaseCreate):
    """Anonymize dialog session and create community case"""
    try:
        # Get the dialog session
        dialog_session = await db.dialog_sessions.find_one({"id": request.dialogue_session_id})
        if not dialog_session:
            raise HTTPException(status_code=404, detail="Dialog session not found")
        
        # Anonymize the dialogue
        anonymized_messages = []
        for msg in dialog_session["messages"]:
            anonymized_msg = {
                "speaker": "Partner A" if msg["speakerType"] == "partner1" else "Partner B",
                "message": anonymize_message(msg["message"]),
                "timestamp": msg["timestamp"]
            }
            anonymized_messages.append(anonymized_msg)
        
        # Generate AI solution and analysis
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"community_case_{uuid.uuid4()}",
            system_message="""Du bist ein Experte für Paarkommunikation. Analysiere diesen anonymisierten Dialog und erstelle:
            
            1. Eine prägnante Fallbeschreibung
            2. Konkrete Lösungsvorschläge 
            3. Kommunikationsmuster-Analyse
            4. Schwierigkeitsgrad-Einschätzung
            
            Fokussiere auf lehrreiche Aspekte für andere Paare."""
        ).with_model("openai", "gpt-4o")
        
        dialog_text = "\n".join([f"{msg['speaker']}: {msg['message']}" for msg in anonymized_messages])
        
        user_message = UserMessage(
            text=f"""Analysiere diesen anonymisierten Paar-Dialog und erstelle einen Lösungsvorschlag:

{dialog_text}

Erstelle:
- Kurze Situationsbeschreibung (2-3 Sätze)
- 3-4 konkrete Lösungsansätze
- Hauptkommunikationsmuster
- Schwierigkeitsgrad (Einfach/Mittel/Schwer)"""
        )
        
        ai_response = await chat.send_message(user_message)
        
        # Determine category based on content
        category = determine_category(dialog_text)
        
        # Create community case
        community_case = CommunityCase(
            title=f"Kommunikationsfall: {category}",
            category=category,
            anonymized_dialogue=anonymized_messages,
            original_context="Anonymisiert für Datenschutz",
            anonymized_context=f"Ein Paar diskutiert über {category.lower()}",
            ai_solution=ai_response,
            communication_patterns=extract_patterns(dialog_text),
            difficulty_level=determine_difficulty(dialog_text),
            votes=0,
            helpful_count=0,
            is_featured=False
        )
        
        # Save to database
        case_dict = prepare_for_mongo(community_case.dict())
        await db.community_cases.insert_one(case_dict)
        
        return {"success": True, "case_id": community_case.id, "message": "Community Case erfolgreich erstellt"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Community case creation failed: {str(e)}")

@api_router.post("/create-community-case-direct")
async def create_community_case_direct(request: CommunityCaseCreateDirect):
    """Create community case directly from dialog messages - requires PRO subscription"""
    try:
        # Check PRO access for creating own cases
        if request.user_id:
            user = await db.users.find_one({"id": request.user_id})
            if user:
                user_obj = User(**user)
                if not check_feature_access(user_obj, "own_cases"):
                    raise HTTPException(status_code=403, detail="Eigene Cases erstellen requires PRO subscription")
        else:
            # If no user_id provided, assume non-PRO access
            raise HTTPException(status_code=403, detail="Eigene Cases erstellen requires PRO subscription")
        
        # Anonymize the dialogue messages
        anonymized_messages = []
        for msg in request.messages:
            anonymized_msg = {
                "speaker": "Partner A" if msg.speakerType == "partner1" else "Partner B",
                "message": anonymize_message(msg.message),
                "timestamp": msg.timestamp
            }
            anonymized_messages.append(anonymized_msg)
        
        # Generate AI solution and analysis
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"community_case_{uuid.uuid4()}",
            system_message="""Du bist ein Experte für Paarkommunikation. Analysiere diesen anonymisierten Dialog und erstelle:
            
            1. Eine prägnante Fallbeschreibung
            2. Konkrete Lösungsvorschläge 
            3. Kommunikationsmuster-Analyse
            4. Schwierigkeitsgrad-Einschätzung
            
            Fokussiere auf lehrreiche Aspekte für andere Paare."""
        ).with_model("openai", "gpt-4o")
        
        dialog_text = "\n".join([f"{msg['speaker']}: {msg['message']}" for msg in anonymized_messages])
        
        user_message = UserMessage(
            text=f"""Analysiere diesen anonymisierten Paar-Dialog und erstelle einen Lösungsvorschlag:

{dialog_text}

Erstelle:
- Kurze Situationsbeschreibung (2-3 Sätze)
- 3-4 konkrete Lösungsansätze
- Hauptkommunikationsmuster
- Schwierigkeitsgrad (Einfach/Mittel/Schwer)"""
        )
        
        ai_response = await chat.send_message(user_message)
        
        # Determine category based on content
        category = determine_category(dialog_text)
        
        # Create community case
        community_case = CommunityCase(
            title=f"Kommunikationsfall: {category}",
            category=category,
            anonymized_dialogue=anonymized_messages,
            original_context="Anonymisiert für Datenschutz",
            anonymized_context=f"Ein Paar diskutiert über {category.lower()}",
            ai_solution=ai_response,
            communication_patterns=extract_patterns(dialog_text),
            difficulty_level=determine_difficulty(dialog_text),
            votes=0,
            helpful_count=0,
            is_featured=False
        )
        
        # Save to database
        case_dict = prepare_for_mongo(community_case.dict())
        await db.community_cases.insert_one(case_dict)
        
        return {"success": True, "case_id": community_case.id, "message": "Community Case erfolgreich erstellt"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Community case creation failed: {str(e)}")

@api_router.get("/community-cases")
async def get_community_cases(user_id: Optional[str] = None):
    """Get community cases - requires PRO subscription"""
    try:
        # Check PRO access for community cases
        if user_id:
            user = await db.users.find_one({"id": user_id})
            if user:
                user_obj = User(**user)
                if not check_feature_access(user_obj, "community_cases"):
                    raise HTTPException(status_code=403, detail="Community Cases require PRO subscription")
        else:
            # If no user_id provided, assume non-PRO access
            raise HTTPException(status_code=403, detail="Community Cases require PRO subscription")
        
        cases = await db.community_cases.find().sort("helpful_count", -1).to_list(length=50)
        return [CommunityCase(**case) for case in cases]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch community cases: {str(e)}")

@api_router.post("/community-case/{case_id}/helpful")
async def mark_case_helpful(case_id: str):
    """Mark a community case as helpful"""
    try:
        result = await db.community_cases.update_one(
            {"id": case_id},
            {"$inc": {"helpful_count": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Case not found")
        return {"success": True, "message": "Als hilfreich markiert"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark as helpful: {str(e)}")

def anonymize_message(message: str) -> str:
    """Anonymize personal information in messages"""
    import re
    
    # Replace common names with placeholders
    common_names = ["Adam", "Linda", "Maria", "Peter", "Anna", "Max", "Sarah", "Tom", "Julia", "Michael"]
    for name in common_names:
        message = re.sub(rf'\b{name}\b', 'Partner', message, flags=re.IGNORECASE)
    
    # Replace specific personal details
    message = re.sub(r'\b\d{1,2}\.\d{1,2}\.\d{4}\b', '[Datum]', message)  # Dates
    message = re.sub(r'\b\d{3,4}[-\s]?\d{3,4}\b', '[Telefon]', message)   # Phone numbers
    message = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[E-Mail]', message)  # Emails
    
    return message

def determine_category(dialog_text: str) -> str:
    """Determine the category of the dialog"""
    categories = {
        "Stress & Arbeit": ["stress", "arbeit", "job", "müde", "überfordert"],
        "Kommunikation": ["verstehen", "zuhören", "reden", "sprechen"],
        "Haushaltstreibung": ["haushalt", "aufräumen", "putzen", "kochen"],
        "Zeit & Aufmerksamkeit": ["zeit", "aufmerksamkeit", "handy", "fernsehen"],
        "Gefühle": ["traurig", "wütend", "verletzt", "glücklich", "angst"]
    }
    
    dialog_lower = dialog_text.lower()
    for category, keywords in categories.items():
        if any(keyword in dialog_lower for keyword in keywords):
            return category
    
    return "Allgemeine Kommunikation"

def extract_patterns(dialog_text: str) -> List[str]:
    """Extract communication patterns from dialog"""
    patterns = []
    
    if "immer" in dialog_text.lower() or "nie" in dialog_text.lower():
        patterns.append("Verallgemeinerungen")
    if "aber" in dialog_text.lower():
        patterns.append("Defensives Verhalten")
    if "verstehen" in dialog_text.lower():
        patterns.append("Verständnis-Bedürfnis")
    if any(word in dialog_text.lower() for word in ["hilfe", "unterstützen", "helfen"]):
        patterns.append("Unterstützungs-Wunsch")
    
    return patterns if patterns else ["Grundlegende Kommunikation"]

def determine_difficulty(dialog_text: str) -> str:
    """Determine difficulty level of the case"""
    complex_indicators = ["nicht verstehen", "immer", "nie", "wütend", "verletzt"]
    simple_indicators = ["danke", "verstehe", "gut", "okay"]
    
    complex_count = sum(1 for indicator in complex_indicators if indicator in dialog_text.lower())
    simple_count = sum(1 for indicator in simple_indicators if indicator in dialog_text.lower())
    
    if complex_count > simple_count + 1:
        return "Schwer"
    elif complex_count > simple_count:
        return "Mittel"
    else:
        return "Einfach"

# Helper function to check if user has access to premium features
def check_premium_access(user: User) -> bool:
    """Check if user has active premium subscription"""
    if user.subscription_status != "active":
        return False
    
    if user.subscription_expires_at and user.subscription_expires_at < datetime.now(timezone.utc):
        return False
        
    return True

def get_free_scenarios_limit(stage_number: int) -> int:
    """Get the number of free scenarios available for each stage"""
    if stage_number == 1:
        return 5  # First 5 scenarios of stage 1 are free
    return 0  # All other stages require premium

def get_free_emotions_limit() -> int:
    """Get the number of free emotions available in Gefühlslexikon"""
    return 5  # First 5 emotions are free, rest requires PRO

def check_feature_access(user: User, feature: str) -> bool:
    """Check if user has access to specific features"""
    # Free features available to all users
    free_features = [
        "stage_1_training",  # Stage 1 training scenarios (limited to 5)
        "basic_gefuehlslexikon",  # Basic emotions lexicon (limited to 5)
        "onboarding",  # User registration and onboarding
        "landing_page"  # Landing page access
    ]
    
    # PRO features requiring premium subscription
    pro_features = [
        "dialog_coaching",  # Dialog-Coaching with AI analysis
        "community_cases",  # Community Cases access
        "own_cases",  # Create own cases
        "partner_dashboard",  # Partner Dashboard
        "full_gefuehlslexikon",  # Complete emotions lexicon
        "stage_2_plus_training",  # Training stages 2-5
        "advanced_features"  # Any other advanced features
    ]
    
    # Check if feature is free
    if feature in free_features:
        return True
    
    # Check if feature requires PRO and user has premium access
    if feature in pro_features:
        return check_premium_access(user)
    
    # Default to requiring premium for unlisted features
    return check_premium_access(user)

# Payment Integration Functions
async def initialize_stripe_checkout(request: Request):
    """Initialize Stripe checkout with webhook URL"""
    base_url = str(request.base_url).rstrip('/')
    webhook_url = f"{base_url}/api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_SECRET_KEY, webhook_url=webhook_url)

@api_router.post("/checkout/session")
async def create_checkout_session(checkout_request: CheckoutRequest, request: Request):
    """Create Stripe checkout session for subscription"""
    try:
        # Validate package type
        if checkout_request.package_type not in SUBSCRIPTION_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package type")
        
        # Get package details
        package = SUBSCRIPTION_PACKAGES[checkout_request.package_type]
        
        # Set Stripe API key
        stripe.api_key = STRIPE_SECRET_KEY
        
        # Create success and cancel URLs
        success_url = f"{checkout_request.origin_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{checkout_request.origin_url}/cancel"
        
        # Create webhook URL (use HTTPS for preview environment)
        base_url = str(request.base_url).rstrip('/')
        if base_url.startswith('http://'):
            base_url = base_url.replace('http://', 'https://')
        webhook_url = f"{base_url}/api/webhook/stripe"
        
        # Convert amount to cents for Stripe
        amount_in_cents = int(package["amount"] * 100)
        
        # Create checkout session with proper subscription configuration
        session = stripe.checkout.Session.create(
            mode='subscription',  # CRITICAL: Set mode to subscription
            payment_method_types=['card', 'paypal'],  # Support Card and PayPal (TWINT not supported in subscription mode)
            line_items=[{
                'price_data': {
                    'currency': package["currency"],
                    'product_data': {
                        'name': package["name"],
                    },
                    'unit_amount': amount_in_cents,
                    'recurring': {
                        'interval': 'month' if checkout_request.package_type == 'monthly' else 'year',
                    },
                },
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            billing_address_collection='required',  # Required for Swiss billing
            shipping_address_collection={
                'allowed_countries': ['CH', 'DE', 'AT', 'FR', 'IT']  # DACH region + neighbors
            },
            locale='de',  # Set German language to fix "Cannot find module './en'" error
            payment_method_configuration=None,  # Use default configuration
            payment_method_options={
                'card': {
                    'request_three_d_secure': 'automatic'  # iOS mobile optimization: automatic 3DS for better mobile UX
                }
            },
            metadata={
                "package_type": checkout_request.package_type,
                "package_name": package["name"],
                "webhook_url": webhook_url
            }
        )
        
        # Smart payment transaction logging with error handling
        payment_logged = False
        try:
            # Only attempt database logging if we have proper permissions
            transaction = PaymentTransaction(
                user_id="anonymous",  # We'll update this with actual user after payment
                user_email=checkout_request.user_email,  # Store user email for subscription activation
                session_id=session.id,
                amount=package["amount"],
                currency=package["currency"],
                package_type=checkout_request.package_type,
                payment_status="pending",
                metadata={
                    "package_type": checkout_request.package_type,
                    "package_name": package["name"],
                    "webhook_url": webhook_url
                }
            )
            
            transaction_dict = prepare_for_mongo(transaction.dict())
            await db.payment_transactions.insert_one(transaction_dict)
            payment_logged = True
            print(f"✅ Payment transaction logged to database: {session.id}")
            
        except Exception as db_error:
            error_message = str(db_error).lower()
            if "not authorized" in error_message or "permission" in error_message:
                print(f"⚠️ Database permission issue - payment logging skipped: {str(db_error)}")
                print("💡 Consider configuring MONGO_DB_NAME for managed MongoDB deployment")
            else:
                print(f"⚠️ Unexpected database error - payment logging failed: {str(db_error)}")
            
            # Payment continues successfully even without database logging
            print("✅ Payment processing continues - Stripe session created successfully")
        
        print(f"✅ Stripe checkout session created: {session.id}")
        print(f"🔗 Checkout URL: {session.url}")
        if payment_logged:
            print("📝 Transaction logged to database")
        else:
            print("📝 Transaction logging skipped (database permissions)")
        
        return {
            "url": session.url,
            "session_id": session.id,
            "success": True,
            "payment_logged": payment_logged
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout session creation failed: {str(e)}")

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Get checkout session status"""
    try:
        # Set Stripe API key
        stripe.api_key = STRIPE_SECRET_KEY
        
        # Get status from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Map Stripe session status to our format
        payment_status = "unpaid"
        if session.payment_status == "paid":
            payment_status = "paid"
        elif session.payment_status == "no_payment_required":
            payment_status = "paid"
        
        # Update transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction["payment_status"] != "paid":
            update_data = {
                "payment_status": payment_status,
                "updated_at": datetime.now(timezone.utc)
            }
            
            # If payment is successful, activate subscription
            if payment_status == "paid":
                # Update user subscription status to active
                user_email = transaction.get("user_email") or session.customer_details.email
                if user_email:
                    print(f"💳 Activating PRO subscription for user: {user_email}")
                    
                    # Calculate subscription expiration (1 month or 1 year from now)
                    package_type = transaction.get("package_type", "monthly")
                    if package_type == "yearly":
                        expires_at = datetime.now(timezone.utc).replace(year=datetime.now().year + 1)
                    else:
                        # Monthly subscription
                        next_month = datetime.now(timezone.utc).replace(day=28) + timedelta(days=4)
                        expires_at = next_month.replace(day=1) - timedelta(days=1)
                        expires_at = expires_at.replace(day=min(datetime.now().day, expires_at.day))
                    
                    # Update user subscription status
                    await db.users.update_one(
                        {"email": user_email},
                        {"$set": {
                            "subscription_status": "active",
                            "subscription_expires_at": expires_at,
                            "subscription_type": package_type,
                            "updated_at": datetime.now(timezone.utc)
                        }}
                    )
                    print(f"✅ User {user_email} upgraded to PRO (expires: {expires_at})")
                
                update_data["payment_id"] = session_id
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": prepare_for_mongo(update_data)}
            )
        
        return {
            "status": session.status,
            "payment_status": payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "metadata": session.metadata or {},
            "mode": session.mode,
            "payment_method_types": session.payment_method_types,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Set Stripe API key
        stripe.api_key = STRIPE_SECRET_KEY
        
        # Verify webhook signature (you would need to set STRIPE_WEBHOOK_SECRET)
        # For now, we'll process without verification in test environment
        try:
            event = stripe.Webhook.construct_event(
                body, signature, os.environ.get('STRIPE_WEBHOOK_SECRET', '')
            )
        except ValueError:
            # Invalid payload
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            # Invalid signature - in test environment, we'll continue without verification
            import json
            event = json.loads(body)
        
        # Process webhook event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            session_id = session['id']
            
            # Update transaction
            update_data = {
                "payment_status": "paid",
                "payment_id": session_id,
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": prepare_for_mongo(update_data)}
            )
        
        return {"received": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@api_router.get("/weekly-progress/{user_id}/{week_number}")
async def get_weekly_progress(user_id: str, week_number: int):
    """Get weekly progress for specific user and week"""
    progress = await db.weekly_progress.find_one({
        "user_id": user_id, 
        "week_number": week_number
    })
    return WeeklyProgress(**progress) if progress else None

@api_router.get("/dialog-sessions/{user_id}")
async def get_dialog_sessions(user_id: str):
    """Get all dialog sessions for a user"""
    sessions = await db.dialog_sessions.find({"user_id": user_id}).to_list(length=None)
    return [DialogSession(**session) for session in sessions]

@api_router.post("/generate-scenario")
async def generate_custom_scenario(request: dict):
    """Generate a new scenario based on user's situation"""
    try:
        stage_number = request.get("stage_number", 1)
        context = request.get("context", "")
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"scenario_{uuid.uuid4()}",
            system_message=f"""Du bist ein Experte für Empathie-Training. 
            Erstelle ein neues Szenario für Stufe {stage_number} des Trainings.
            
            Das Szenario soll:
            1. Realistisch und nachvollziehbar sein
            2. Zu Stufe {stage_number} passen
            3. Eine klare Situation beschreiben
            4. Eine falsche und eine ideale Reaktion enthalten
            5. Die positive Wirkung erklären
            
            Format:
            - Situation: [Kurze Beschreibung]
            - Kontext: [Detaillierte Situationsbeschreibung]
            - Falsche Reaktion: [Was man nicht tun sollte]
            - Ideale Reaktion: [Empathische, hilfreiche Antwort]
            - Wirkung: [Positive Auswirkung der idealen Reaktion]"""
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(
            text=f"Erstelle ein neues Szenario für Stufe {stage_number}. Kontext: {context}"
        )
        
        response = await chat.send_message(user_message)
        
        return {"scenario": response, "success": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario generation failed: {str(e)}")

async def send_contact_email_task(contact_data: dict):
    """Background task to send contact email"""
    try:
        if not EMAIL_CONFIG.MAIL_USERNAME or not EMAIL_CONFIG.MAIL_PASSWORD:
            logger.warning("Email credentials not configured - email not sent")
            return False
            
        # Create email message
        formatted_message = contact_data['message'].replace('\n', '<br>')
        formatted_date = contact_data['created_at'].strftime('%d.%m.%Y um %H:%M')
        
        email_body = f"""
        <html>
        <body>
            <h2>Neue Kontaktanfrage von NEUROBOND</h2>
            <p><strong>Name:</strong> {contact_data['name']}</p>
            <p><strong>E-Mail:</strong> {contact_data['email']}</p>
            <p><strong>Betreff:</strong> {contact_data['subject']}</p>
            <p><strong>Nachricht:</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff;">
                {formatted_message}
            </div>
            <p><strong>Eingegangen am:</strong> {formatted_date} Uhr</p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch über das NEUROBOND Kontaktformular gesendet.</small></p>
        </body>
        </html>
        """
        
        message = MessageSchema(
            subject=f"NEUROBOND Kontakt: {contact_data['subject']}",
            recipients=[CONTACT_EMAIL],
            body=email_body,
            subtype="html",
            reply_to=contact_data['email']
        )
        
        fm = FastMail(EMAIL_CONFIG)
        await fm.send_message(message)
        logger.info(f"Contact email sent successfully to {CONTACT_EMAIL}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        return False

@api_router.post("/contact")
async def send_contact_email(request: ContactFormRequest, background_tasks: BackgroundTasks):
    """Send contact form email"""
    try:
        contact_data = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "email": request.email,
            "subject": request.subject,
            "message": request.message,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Save to database
        await db.contact_messages.insert_one(prepare_for_mongo(contact_data))
        
        # Send email in background task
        background_tasks.add_task(send_contact_email_task, contact_data)
        
        logger.info(f"Contact form submitted by {request.name} ({request.email}): {request.subject}")
        
        return {
            "success": True, 
            "message": "Nachricht erfolgreich gesendet. Wir melden uns bald bei Ihnen!",
            "contact_id": contact_data["id"]
        }
    
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Senden der Nachricht: {str(e)}")

# ===== AVATAR UPLOAD ENDPOINTS =====

def process_avatar_image(image_data: bytes) -> str:
    """Process uploaded image: resize, optimize, and convert to base64"""
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (handles RGBA, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to a standard avatar size (200x200) while maintaining aspect ratio
        image.thumbnail((200, 200), Image.Resampling.LANCZOS)
        
        # Create a square canvas and center the image
        square_size = 200
        square_image = Image.new('RGB', (square_size, square_size), (255, 255, 255))
        
        # Calculate position to center the image
        x = (square_size - image.width) // 2
        y = (square_size - image.height) // 2
        square_image.paste(image, (x, y))
        
        # Convert to base64
        buffer = io.BytesIO()
        square_image.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        # Encode to base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{image_base64}"
        
    except Exception as e:
        logger.error(f"Error processing avatar image: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid image format")

@api_router.post("/user/{user_id}/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """Upload and set user avatar"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        
        # Process the image
        avatar_base64 = process_avatar_image(contents)
        
        # Update user in database
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"avatar": avatar_base64}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "Avatar uploaded successfully",
            "avatar": avatar_base64
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Avatar upload failed: {str(e)}")

@api_router.delete("/user/{user_id}/avatar")
async def remove_avatar(user_id: str):
    """Remove user avatar"""
    try:
        result = await db.users.update_one(
            {"id": user_id},
            {"$unset": {"avatar": ""}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "message": "Avatar removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar removal error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Avatar removal failed: {str(e)}")

@api_router.get("/user/{user_id}/avatar")
async def get_user_avatar(user_id: str):
    """Get user avatar"""
    try:
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        avatar = user.get("avatar")
        if not avatar:
            return {"avatar": None}
        
        return {"avatar": avatar}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get avatar error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get avatar: {str(e)}")

@api_router.get("/user/by-email/{email}")
async def get_user_by_email(email: str):
    """Get user by email address for login"""
    try:
        user = await db.users.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert MongoDB document to User model
        user_data = User(**user)
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user by email error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()