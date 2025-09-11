from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Chat Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    partner_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    partner_name: Optional[str] = None

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
async def get_training_stage(stage_number: int):
    stage_data = next((s for s in TRAINING_STAGES_DATA if s["stage_number"] == stage_number), None)
    if not stage_data:
        raise HTTPException(status_code=404, detail="Stage not found")
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