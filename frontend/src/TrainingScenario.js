import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ArrowRight, Send, User, MessageCircle, Target, CheckCircle, Star, UserCircle, Home, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Simple Input Component (no speech recognition to avoid errors)
const SimpleInput = ({ value, onChange, placeholder, className, onKeyPress }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${className} bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 p-3 resize-none`}
      onKeyPress={onKeyPress}
      rows={3}
    />
  );
};

const TrainingScenario = ({ scenarioId, userId, userName, partnerName, onComplete, onBack, onHome }) => {
  const [sessionData, setSessionData] = useState(null);
  const [partnerMessage, setPartnerMessage] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('question'); // question, feedback, completed
  const [evaluation, setEvaluation] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // Load avatars from localStorage
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar'));
  const [partnerAvatar, setPartnerAvatar] = useState(localStorage.getItem('partner_avatar'));

  // Proper notification function
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  useEffect(() => {
    startScenario();
  }, []);

  // Get detailed scenario context based on scenario ID
  const getDetailedScenarioContext = (scenarioId) => {
    const scenarios = {
      // Stufe 1: Grundlagen der Empathie
      1: `Es ist Sonntagabend, und Sie beide sitzen gemütlich auf der Couch. Eigentlich war es ein schöner Tag - Sie haben zusammen gefrühstückt, waren spazieren und haben einen Film geschaut. Doch plötzlich merken Sie, dass ${partnerName} immer stiller wird. Die Stirn ist leicht gerunzelt, der Blick wird nachdenklich. Sie spüren, wie sich die Stimmung verändert. ${partnerName} scheint mit etwas zu ringen, was schon länger beschäftigt. Die Arbeitsbelastung war in letzter Zeit sehr hoch, und Sie haben bemerkt, wie erschöpft ${partnerName} in den letzten Wochen nach Hause kam. Jetzt, in diesem ruhigen Moment, sucht ${partnerName} das Gespräch mit Ihnen...`,
      
      2: `Sie kommen nach einem anstrengenden Tag nach Hause und freuen sich auf einen entspannten Abend mit ${partnerName}. Doch kaum haben Sie die Tür aufgeschlossen, spüren Sie sofort: Etwas ist anders. ${partnerName} sitzt am Küchentisch, umgeben von Papieren und dem Laptop. Die Schultern sind angespannt, die Bewegungen fahrig. Sie kennen diesen Blick - eine Mischung aus Frustration, Enttäuschung und tiefer Verletzung. Offensichtlich ist heute bei der Arbeit etwas vorgefallen. Ein wichtiges Projekt, an dem ${partnerName} wochenlang gearbeitet hat, scheint nicht wie erhofft gelaufen zu sein. Sie sehen die Tränen, die ${partnerName} zurückzuhalten versucht...`,
      
      3: `Es ist Samstag früh am Morgen. Eigentlich wollten Sie beide heute gemeinsam Zeit verbringen - vielleicht einen Ausflug machen oder einfach zusammen relaxen. Doch ${partnerName} wirkt unruhig und abwesend. Beim Frühstück starrt ${partnerName} immer wieder auf das Handy, tippt Nachrichten und scheint völlig in Gedanken versunken. Sie merken, dass etwas ${partnerName} innerlich sehr beschäftigt. Die Freundin Sarah hat gestern angerufen und von Problemen in ihrer Ehe erzählt. Das hat bei ${partnerName} offensichtlich etwas ausgelöst - Ängste und Zweifel über Ihre eigene Beziehung. Die Unsicherheit nagt an ${partnerName}, und diese Gedanken lassen sich einfach nicht abstellen...`,
      
      4: `Sie beide haben eigentlich einen wunderschönen Abend geplant. Reservierung im Lieblingsrestaurant, schicke Kleidung, Zeit nur für Sie beide. Doch schon auf dem Weg dorthin bemerken Sie, dass ${partnerName} angespannt wirkt. Im Restaurant dann die Katastrophe: Der Service ist schlecht, das Essen kommt viel zu spät und ist auch noch kalt. Was als romantischer Abend gedacht war, wird zur Enttäuschung. Doch das eigentliche Problem liegt tiefer. ${partnerName} hatte sich so sehr auf diesen Abend gefreut, hatte gehofft, dass nach den stressigen Wochen endlich wieder Normalität und Nähe in Ihre Beziehung kommt. Jetzt fühlt sich ${partnerName}, als würde selbst das nicht klappen...`,
      
      5: `Heute war ein Tag wie viele andere - oder sollte es zumindest sein. Doch während Sie im Büro waren, hat ${partnerName} zu Hause einen Anruf von der eigenen Mutter bekommen. Ein Gespräch, das alte Wunden aufgerissen hat. Familiäre Konflikte, die ${partnerName} schon seit Jahren beschäftigen, sind wieder hochgekocht. Vorwürfe, Schuldzuweisungen, das Gefühl, nie genug zu sein. Als Sie nach Hause kommen, finden Sie ${partnerName} völlig aufgelöst vor. Die Augen sind rot geweint, die Hände zittern noch leicht. ${partnerName} fühlt sich emotional völlig erschöpft und weiß nicht, wie mit diesen alten, schmerzhaften Gefühlen umgegangen werden soll...`,

      // Stufe 2: Konfliktlösung  
      6: `Sie beide sitzen am Esstisch und planen eigentlich Ihren gemeinsamen Urlaub. Die Broschüren sind ausgebreitet, das Laptop geöffnet. Doch was als freudige Vorfreude beginnen sollte, wird schnell zur Diskussion. ${partnerName} möchte unbedingt in die Berge, Wandern, Ruhe und Natur. Sie hingegen träumen von Sonne, Strand und dem Meer. Mit jedem Argument wird die Stimmung angespannter. ${partnerName}s Stimme wird lauter, die Gesichtszüge härter. "Du verstehst einfach nicht, was ich brauche!", platzt es aus ${partnerName} heraus. Die Enttäuschung darüber, dass Sie beide so unterschiedliche Vorstellungen haben, wiegt schwer. ${partnerName} fühlt sich nicht gehört und unverstanden...`,
      
      7: `Gestern Abend hatten Sie beide einen Streit über die Haushaltsaufteilung. Heute Morgen herrscht eisiges Schweigen beim Frühstück. ${partnerName} vermeidet Blickkontakt, die Bewegungen sind steif und kontrolliert. Sie spüren die Kälte zwischen Ihnen. Als ${partnerName} schließlich zur Arbeit aufbricht, fällt leise aber bestimmt: "Wir müssen reden." Der ganze Tag über kreisen Ihre Gedanken. Am Abend sitzen Sie sich gegenüber. ${partnerName} hat sich offensichtlich Gedanken gemacht, wirkt aber verletzt und aufgebracht. "Ich fühle mich, als würde ich alles alleine machen. Deine Kritik von gestern hat mich richtig getroffen...", beginnt ${partnerName} mit zittriger Stimme...`,
      
      8: `Es ist ein normaler Dienstagabend. Sie beide sind müde von der Arbeit, eigentlich wollten Sie nur entspannen. Doch dann klingelt das Telefon - ${partnerName}s Schwester ruft an und bittet um Hilfe beim Umzug am Wochenende. ${partnerName} sagt spontan zu, ohne Sie zu fragen. Als das Gespräch beendet ist, merken Sie Ihre Verärgerung. Sie hatten andere Pläne für das Wochenende, wollten endlich mal Zeit für sich beide. ${partnerName} bemerkt Ihre Reaktion und wird sofort defensiv: "Das ist meine Familie! Ich kann doch nicht nein sagen!" Die Situation eskaliert schnell. ${partnerName} fühlt sich zwischen Familie und Partnerschaft zerrissen und versteht nicht, warum Sie nicht automatisch mithelfen wollen...`,

      // Stufe 3: Emotionale Intelligenz
      9: `Sie sind gerade dabei, den Abend zu planen, als ${partnerName} vom Bad herüberruft. Die Stimme klingt anders - angespannt, fast panisch. Als Sie nachschauen, steht ${partnerName} vor dem Spiegel, die Hände leicht zitternd. "Ich kann das einfach nicht mehr", flüstert ${partnerName} und deutet auf ihr Spiegelbild. Die letzten Monate waren stressig, die Arbeitsbelastung hoch, und Sie beide hatten kaum Zeit füreinander. ${partnerName} hat zugenommen, fühlt sich unwohl im eigenen Körper. Die Selbstzweifel, die schon lange brodeln, brechen jetzt aus ${partnerName} hervor. "Du findest mich bestimmt nicht mehr attraktiv... ich erkenne mich selbst nicht mehr...", die Tränen fließen frei...`,
      
      10: `Nach einem Familienessen bei ${partnerName}s Eltern fahren Sie beide schweigend nach Hause. Die Stimmung im Auto ist gedrückt. ${partnerName} starrt aus dem Fenster, die Kiefer angespannt. Der Abend war schwierig - wie so oft, wenn die Familie zusammenkommt. Kritische Bemerkungen der Mutter, abfällige Kommentare über ${partnerName}s Berufswahl, unterschwellige Vorwürfe. Sie haben gesehen, wie ${partnerName} immer kleiner wurde, wie die selbstbewusste Person neben Ihnen zu dem verunsicherten Kind von früher schrumpfte. Zu Hause angekommen bricht es aus ${partnerName} heraus: "Ich werde niemals gut genug für sie sein... egal was ich mache, es ist immer falsch...", die Stimme bricht vor Schmerz und jahrelanger Enttäuschung...`,
      
      11: `Es ist Freitagabend und Sie beide sitzen zusammen auf der Terrasse. Ein schöner, warmer Sommerabend. ${partnerName} hat eine Gehaltserhöhung bekommen - eigentlich ein Grund zu feiern. Doch statt Freude sehen Sie Zweifel in ${partnerName}s Gesicht. "Ich verdiene das gar nicht", murmelt ${partnerName} und spielt nervös mit dem Weinglas. "Die anderen in der Abteilung arbeiten auch hart. Warum ausgerechnet ich?" Das Impostor-Syndrom, das ${partnerName} schon lange begleitet, meldet sich wieder. Die Angst, ein Betrüger zu sein, nicht wirklich qualifiziert für den Erfolg. ${partnerName} kann den Moment nicht genießen, ist gefangen in Selbstzweifeln und der Angst, enttarnt zu werden...`,

      // Stufe 4: Beziehungsdynamiken
      12: `Sie beide sitzen am Sonntagmorgen beim Frühstück. Eigentlich sollte es ein entspannter Start in den Tag werden, doch ${partnerName} wirkt nachdenklich und angespannt. Plötzlich durchbricht ${partnerName} die Stille: "Merkst du auch, dass wir immer die gleichen Diskussionen haben?" Die Erkenntnis liegt schwer im Raum. Egal ob es um Hausarbeit, Geld oder Zukunftspläne geht - Sie beide scheinen immer wieder in dieselben Muster zu fallen. ${partnerName} spricht aus, was Sie beide schon längst spüren: dass sich Ihre Gespräche im Kreis drehen, dass dieselben Auslöser zu denselben Reaktionen führen. "Ich fühle mich, als wären wir in einer Schleife gefangen", sagt ${partnerName} mit Tränen in den Augen, "und ich weiß nicht, wie wir da rauskommen sollen..."`,
      
      13: `Es ist ein ganz normaler Mittwochabend. Sie beide schauen zusammen einen Film, als ${partnerName} plötzlich das Bild pausiert. "Wir müssen über etwas reden", sagt ${partnerName} mit ernster Miene. Die letzten Wochen haben sich angefühlt, als würden Sie beide aneinander vorbeileben. ${partnerName} hat das Gefühl, ständig zurückzustecken, eigene Bedürfnisse zu ignorieren, um Konflikte zu vermeiden. "Ich sage nie nein zu dir", beginnt ${partnerName} zögerlich, "aber dabei verliere ich mich selbst. Ich weiß gar nicht mehr, was ich wirklich will." Die Erkenntnis schmerzt - aus lauter Liebe und dem Wunsch nach Harmonie hat ${partnerName} die eigenen Grenzen verwischt und fühlt sich jetzt orientierungslos und unglücklich...`,
      
      14: `Nach einem schönen gemeinsamen Tag im Park kommen Sie beide nach Hause. Es war ein perfekter Tag - Sonnenschein, Lachen, tiefe Gespräche. Doch als Sie die Wohnung betreten, verändert sich ${partnerName}s Stimmung merklich. Die Schultern sinken herab, der Blick wird schwermütig. "Kann ich dir vertrauen?", fragt ${partnerName} plötzlich und überrascht Sie mit der Direktheit. Die Frage kommt aus dem Nichts, doch ${partnerName} erklärt: "Ich habe solche Angst, dass du mich irgendwann verlässt. Dass du merkst, dass ich nicht gut genug bin." Frühere Beziehungen haben Narben hinterlassen, Vertrauensbrüche, die ${partnerName} bis heute verfolgen. Die Angst vor Verlust und Verletzung überschattet selbst die schönsten Momente...`,

      // Stufe 5: Meisterschaft
      15: `Es ist 3 Uhr nachts, als Sie von einem Anruf geweckt werden. ${partnerName}s beste Freundin ist am Telefon, völlig aufgelöst. Ihr Partner hat sie verlassen, sie weiß nicht wohin. ${partnerName} ist sofort hellwach und springt aus dem Bett. "Ich muss zu ihr", sagt ${partnerName} mit fester Stimme. Sie sehen die Entschlossenheit, aber auch die tiefe Sorge um die Freundin. Als ${partnerName} zurückkommt, ist es bereits Morgen. Erschöpft und emotional mitgenommen lässt ${partnerName} sich auf die Couch fallen. "Sie ist völlig am Boden zerstört. Ich fühle mich so hilflos - wie kann ich ihr helfen, wenn ihre Welt gerade zusammenbricht?" ${partnerName} trägt die Schmerzen anderer mit und weiß nicht, wie mit dieser emotionalen Last umgegangen werden soll...`,
      
      16: `Sie beide sitzen auf der Bank im Park, wo Sie sich vor 5 Jahren zum ersten Mal begegnet sind. ${partnerName} hat vorgeschlagen, hierher zu kommen, um über die Zukunft zu sprechen. Die letzten Monate waren turbulent - berufliche Veränderungen, familiäre Herausforderungen, Entscheidungen über Wohnort und Lebensstil. ${partnerName} schaut nachdenklich in die Ferne: "Manchmal frage ich mich, ob wir in dieselbe Richtung gehen." Die Unsicherheit über die gemeinsame Zukunft nagt an ${partnerName}. "Ich liebe dich so sehr, aber ich habe Angst, dass wir verschiedene Träume haben. Was, wenn wir uns auseinanderentwickeln?" Die Tiefe der Gefühle steht der Angst vor Ungewissheit gegenüber...`,
      
      17: `Sie beide haben gerade ein intensives Gespräch mit einem befreundeten Paar geführt, das vor der Scheidung steht. Auf dem Heimweg ist ${partnerName} ungewöhnlich still. Zu Hause angekommen setzt ${partnerName} sich zu Ihnen und nimmt Ihre Hand. "Heute ist mir klar geworden, wie zerbrechlich Beziehungen sind", beginnt ${partnerName} leise. "Ich sehe so viele Paare um uns herum, die sich verlieren, die aufgeben. Und ich denke daran, was wir anderen Paaren raten könnten." ${partnerName} zeigt eine neue Reife, eine Weisheit aus den eigenen Erfahrungen. "Vielleicht könnten wir anderen helfen, das zu bewahren, was wir fast verloren hätten. Aber dafür müssten wir erst selbst sicher sein, dass wir es geschafft haben..."`,
    };
    
    return scenarios[scenarioId] || `Sie und ${partnerName} befinden sich in einer emotionalen Situation, die Ihre empathischen Fähigkeiten herausfordert...`;
  };

  // Get emotional indicators for the scenario
  const getEmotionalIndicators = (scenarioId) => {
    const indicators = {
      // Stufe 1: Grundlagen der Empathie
      1: `die Anspannung in ${partnerName}s Gesicht, die müden Augen und die leicht gesunkenen Schultern`,
      2: `die Tränen in ${partnerName}s Augen, die verkrampften Hände und die enttäuschte Körperhaltung`,  
      3: `die Unruhe und Nervosität von ${partnerName}, das ständige Grübeln und die angespannte Mimik`,
      4: `die Frustration und Enttäuschung von ${partnerName}, die sich in der ganzen Körperhaltung widerspiegelt`,
      5: `die emotionale Erschöpfung von ${partnerName}, die verweinten Augen und das leichte Zittern`,
      
      // Stufe 2: Konfliktlösung
      6: `die steigende Lautstärke in ${partnerName}s Stimme, die verkrampften Kiefer und die abwehrende Gestik`,
      7: `die Verletzung in ${partnerName}s Blick, die kontrollierte aber zittrige Stimme und die aufrechte, defensive Haltung`,
      8: `die Zerrissenheit in ${partnerName}s Gesichtszügen, das nervöse Gestikulieren und die flehende Tonlage`,
      
      // Stufe 3: Emotionale Intelligenz
      9: `die Panik in ${partnerName}s Augen, die zittrigen Hände und die zusammengesunkene Körperhaltung`,
      10: `die tiefen Furchen der Enttäuschung in ${partnerName}s Gesicht, die angespannte Kiefermuskulatur und die nach innen gekehrte Haltung`,
      11: `die Selbstzweifel in ${partnerName}s unsicheren Blick, das nervöse Spielen mit den Händen und die kleinlaute Stimme`,
      
      // Stufe 4: Beziehungsdynamiken  
      12: `die Resignation in ${partnerName}s Augen, die schweren Seufzer und die hilflose Gestik`,
      13: `die innere Zerrissenheit in ${partnerName}s zögerlicher Sprache, die unsichere Körperhaltung und den suchenden Blick`,
      14: `die Angst vor Verlust in ${partnerName}s Stimme, die schutzsuchende Körperhaltung und die vulnerable Offenheit`,
      
      // Stufe 5: Meisterschaft
      15: `die emotionale Erschöpfung vom Tragen fremder Lasten, die schweren Augenlider und die belastete Ausstrahlung`,
      16: `die nachdenkliche Melancholie in ${partnerName}s Blick in die Ferne, die nachdenklichen Pausen und die sehnsüchtige Körpersprache`,
      17: `die neue Reife und Weisheit in ${partnerName}s Worten, die ruhige aber bestimmte Ausstrahlung und die verantwortungsvolle Haltung`
    };
    
    return indicators[scenarioId] || `dass ${partnerName} emotional belastet ist`;
  };

  const startScenario = async () => {
    try {
      console.log('🚀 Starting training scenario:', { scenarioId, userId, userName, partnerName });
      console.log('🌐 Backend URL:', BACKEND_URL);
      
      const response = await fetch(`${BACKEND_URL}/api/training/start-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          user_id: userId,
          user_name: userName,
          partner_name: partnerName
        })
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Training scenario data received:', data);
        console.log('💬 Partner message received:', data.partner_message);
        console.log('📝 Data keys:', Object.keys(data));
        
        // Validate partner_message exists and is not empty
        const partnerMessageContent = data.partner_message || data.partnerMessage || '';
        console.log('🎯 Final partner message content:', partnerMessageContent);
        
        if (!partnerMessageContent || partnerMessageContent.trim() === '') {
          console.warn('⚠️ Partner message is empty, using fallback');
          const fallbackMessage = `Liebe/r ${userName}, ich brauche deine Unterstützung. Heute war ein schwieriger Tag und ich fühle mich wirklich überfordert.`;
          setPartnerMessage(fallbackMessage);
        } else {
          setPartnerMessage(partnerMessageContent);
        }
        
        // Set sessionData with the response
        setSessionData(data);
        setCurrentPhase('question');
        console.log('✅ Scenario started successfully');
      } else {
        console.error('❌ Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Failed to start scenario: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Error starting scenario:', error);
      console.error('💥 Error details:', error.message);
      
      // Set fallback message on error
      const fallbackMessage = `Liebe/r ${userName}, ich brauche deine Unterstützung. Heute war ein schwieriger Tag und ich fühle mich wirklich überfordert.`;
      setPartnerMessage(fallbackMessage);
      setSessionData({
        scenario: {
          title: 'Training Szenario',
          context: 'Empathie-Training',
          learning_goals: ['Aktives Zuhören', 'Empathie zeigen']
        }
      });
      setCurrentPhase('question');
    } finally {
      setLoading(false);
      console.log('🏁 StartScenario function completed');
    }
  };

  const submitResponse = async () => {
    if (!userResponse.trim() || submitting) return;

    setSubmitting(true);
    
    try {
      // Get AI evaluation of the user's response
      const evaluationResponse = await fetch(`${BACKEND_URL}/api/training/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_response: userResponse,
          scenario_id: scenarioId,
          user_id: userId
        })
      });

      if (evaluationResponse.ok) {
        const evaluationData = await evaluationResponse.json();
        setEvaluation(evaluationData);
        setCurrentPhase('feedback');
      } else {
        throw new Error('Failed to get evaluation');
      }
    } catch (error) {
      console.error('Error getting evaluation:', error);
      showNotification('Fehler beim Bewerten der Antwort. Bitte versuchen Sie es erneut.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const restartScenario = () => {
    setUserResponse('');
    setEvaluation(null);
    setCurrentPhase('question');
    showNotification('Szenario wurde zurückgesetzt. Versuchen Sie es erneut!', 'info');
  };

  const completeScenario = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/training/end-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id
        })
      });

      setCurrentPhase('completed');
      setTimeout(() => onComplete && onComplete(), 2000);
    } catch (error) {
      console.error('Error completing scenario:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Training wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">{sessionData?.scenario?.title}</h1>
          </div>
          <p className="text-gray-300 mb-6">{sessionData?.scenario?.context}</p>
          
          {/* Training Participants */}
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* User Profile */}
            <div className="flex items-center gap-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 border-3 border-blue-400">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    <UserCircle className="w-10 h-10 text-white/80" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-white">{userName}</div>
                <div className="text-sm text-blue-200">Sie</div>
              </div>
            </div>
            
            <div className="text-3xl text-gray-500">↔</div>
            
            {/* Partner Profile */}
            <div className="flex items-center gap-4 bg-gray-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 border-3 border-green-400">
                {partnerAvatar ? (
                  <img 
                    src={partnerAvatar}
                    alt={partnerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                    <UserCircle className="w-10 h-10 text-white/80" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-white">{partnerName}</div>
                <div className="text-sm text-green-200">KI-Partner</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            {sessionData?.scenario?.learning_goals?.map((goal, index) => (
              <span key={index} className="bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm">
                {goal}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onBack ? onBack() : (onComplete && onComplete())}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onHome ? onHome() : (onComplete && onComplete())}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Szenario {scenarioId}</span>
            <span>•</span>
            <span>{sessionData?.scenario?.title}</span>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              if (onNext) {
                onNext();
              } else if (scenarioId < 17) {
                showNotification('Nächstes Szenario wird geladen...', 'info');
                setTimeout(() => {
                  onComplete && onComplete();
                }, 1500);
              } else {
                showNotification('Das war das letzte Szenario! Herzlichen Glückwunsch!', 'success');
              }
            }}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Weiter
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {currentPhase === 'question' && (
          <>
            {/* Scenario Question */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl mb-6">
              <CardHeader>
                <CardTitle className="text-white text-center text-2xl">
                  Trainings-Szenario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Scenario Context */}
                <div className="mb-6">
                  <h4 className="text-blue-200 font-semibold mb-3 text-lg">📖 Ausgangssituation</h4>
                  <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/50">
                    <p className="text-gray-200 leading-relaxed text-base">
                      {getDetailedScenarioContext(scenarioId)}
                    </p>
                  </div>
                </div>

                {/* Partner Avatar and Direct Message */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-600 border-4 border-green-400 flex-shrink-0">
                    {partnerAvatar ? (
                      <img 
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                        <UserCircle className="w-12 h-12 text-white/80" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-green-200 mb-3">{partnerName} wendet sich an Sie:</div>
                    <div className="bg-green-900/20 p-5 rounded-2xl border border-green-700/50 relative">
                      <div className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-green-700/50"></div>
                      <p className="text-green-100 leading-relaxed text-lg font-medium italic">
                        "{partnerMessage || sessionData?.partner_message || sessionData?.partnerMessage || 'Dialog wird geladen...'}"
                      </p>
                    </div>
                    
                    {/* Emotional indicators */}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-yellow-400">😟</span>
                      <span className="text-gray-400">Sie bemerken {getEmotionalIndicators(scenarioId)}</span>
                    </div>
                  </div>
                </div>

                {/* Learning Goals */}
                <div className="bg-blue-900/30 rounded-2xl border border-blue-700/50 p-4 mb-6">
                  <h4 className="text-blue-200 font-semibold mb-3">🎯 Lernziele in diesem Szenario:</h4>
                  <div className="flex flex-wrap gap-2">
                    {sessionData?.scenario?.learning_goals?.map((goal, index) => (
                      <span key={index} className="bg-blue-700/30 text-blue-200 px-3 py-1 rounded-full text-sm">
                        {goal}
                      </span>
                    )) || [
                      <span key="default1" className="bg-blue-700/30 text-blue-200 px-3 py-1 rounded-full text-sm">Gefühle erkennen</span>,
                      <span key="default2" className="bg-blue-700/30 text-blue-200 px-3 py-1 rounded-full text-sm">Empathisch spiegeln</span>,
                      <span key="default3" className="bg-blue-700/30 text-blue-200 px-3 py-1 rounded-full text-sm">Beruhigung geben</span>
                    ]}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Wie antworten Sie als {userName} empathisch?
                  </h3>
                  <p className="text-gray-300">
                    {partnerName} hat Ihnen ein Problem anvertraut. Nehmen Sie sich Zeit und formulieren Sie eine einfühlsame Antwort als {userName}, die {partnerName}s Gefühle ernst nimmt und Unterstützung bietet.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Input Area */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
              <CardContent className="p-6">
                {/* User Avatar and Input Label */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 border-3 border-blue-400 flex-shrink-0">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-blue-200 font-semibold">Ihre empathische Antwort an {partnerName}</h4>
                    <p className="text-gray-400 text-sm">Wie antworten Sie als {userName} empathisch auf {partnerName}s Problem?</p>
                  </div>
                </div>

                <div className="mb-4">
                  <SimpleInput
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder={`Wie antworten Sie als ${userName} empathisch auf ${partnerName}? Zum Beispiel: "Liebe/r ${partnerName}, ich sehe dass du..." Denken Sie daran: Gefühle erkennen, validieren, Unterstützung anbieten.`}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    💡 Tipp: Nehmen Sie sich Zeit für eine durchdachte, empathische Antwort
                  </p>
                  <Button
                    onClick={submitResponse}
                    disabled={submitting || !userResponse.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 text-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Wird bewertet...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Antwort bewerten
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {currentPhase === 'feedback' && evaluation && (
          <div className="space-y-6">
            {/* Your Response */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 border-2 border-blue-400">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-white/80" />
                      </div>
                    )}
                  </div>
                  Ihre Antwort, {userName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 border-4 border-blue-400 flex-shrink-0">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <UserCircle className="w-10 h-10 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-blue-300 mb-2 font-medium">{userName} antwortet {partnerName}:</div>
                    <div className="bg-blue-900/30 p-4 rounded-2xl border border-blue-700/50 relative">
                      <div className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-blue-700/50"></div>
                      <p className="text-blue-100 leading-relaxed text-lg">
                        "{userResponse}"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimal Response */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Optimale empathische Antwort
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Optimal Response */}
                <div>
                  <h4 className="font-semibold text-green-400 mb-3 text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    So könnten Sie noch empathischer antworten:
                  </h4>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 border-4 border-green-400 flex-shrink-0">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={`${userName} (optimiert)`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                          <UserCircle className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-green-300 mb-2 font-medium">{userName} antwortet {partnerName} (Empathisch optimiert):</div>
                      <div className="bg-green-900/30 p-5 rounded-2xl border border-green-700/50 relative">
                        <div className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-green-700/50"></div>
                        <p className="text-green-100 leading-relaxed text-lg font-medium">
                          "{evaluation.alternative_responses && evaluation.alternative_responses[0] 
                            ? evaluation.alternative_responses[0] 
                            : `Liebe/r ${partnerName}, ich verstehe, dass dich das wirklich beschäftigt und unsicher macht. Es ist völlig normal, dass man sich Sorgen über die Zukunft macht. Lass uns gemeinsam schauen, wie wir mit dieser Unsicherheit umgehen können. Du bist nicht allein mit diesen Gedanken.`}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <h4 className="font-semibold text-blue-400 mb-3 text-lg">🧠 Warum ist diese Antwort empathisch?</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-700/50 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-blue-200 mb-1">Gefühle erkennen & validieren</h5>
                          <p className="text-gray-300 text-sm">Die Antwort zeigt, dass Sie die Gefühle Ihres Partners wahrnehmen und ernst nehmen.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">2</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-green-200 mb-1">Normalisierung</h5>
                          <p className="text-gray-300 text-sm">Sie zeigen auf, dass diese Gefühle völlig normal und verständlich sind.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">3</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-purple-200 mb-1">Unterstützung anbieten</h5>
                          <p className="text-gray-300 text-sm">Sie signalisieren Bereitschaft zur gemeinsamen Lösungssuche und Solidarität.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score and Feedback */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-yellow-900/30 p-4 rounded-2xl border border-yellow-700/50 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {evaluation.empathy_score}/10
                    </div>
                    <p className="text-yellow-200 text-sm">Ihr Empathie-Score</p>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded-2xl border border-purple-700/50">
                    <h5 className="font-semibold text-purple-200 mb-2">💡 Tipp für das nächste Mal:</h5>
                    <p className="text-purple-100 text-sm">{evaluation.next_level_tip || evaluation.feedback}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={restartScenario}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white flex-1"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Nochmal versuchen
                  </Button>
                  
                  <Button
                    onClick={completeScenario}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex-1"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Training abschließen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPhase === 'completed' && (
          <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Training abgeschlossen!</h3>
              <p className="text-gray-300 mb-6">
                Großartig! Sie haben das Szenario "{sessionData?.scenario?.title}" erfolgreich gemeistert.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => onHome ? onHome() : (onComplete && onComplete())}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Zum Dashboard
                </Button>
                <Button
                  onClick={() => onComplete && onComplete()}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Weitere Trainings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Display */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className={`p-4 rounded-lg shadow-lg backdrop-blur-sm ${
              notification.type === 'error' 
                ? 'bg-red-900/80 border border-red-700 text-red-100' 
                : notification.type === 'success'
                ? 'bg-green-900/80 border border-green-700 text-green-100'
                : 'bg-blue-900/80 border border-blue-700 text-blue-100'
            }`}>
              <p className="text-sm">{notification.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingScenario;