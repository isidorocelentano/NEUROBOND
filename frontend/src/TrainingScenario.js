import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ArrowRight, Send, User, MessageCircle, Target, CheckCircle, Star, Mic, Globe, UserCircle, Home, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Enhanced SpeechInput Component for Training with Better Error Handling
const SpeechInput = ({ value, onChange, placeholder, className, onKeyPress, languages = ['de-DE', 'de-CH', 'en-US', 'fr-FR', 'es-ES', 'it-IT'] }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('de-DE');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const languageOptions = {
    'de-DE': 'Deutsch',
    'de-CH': 'Schweizerdeutsch', 
    'en-US': 'English',
    'fr-FR': 'Français',
    'es-ES': 'Español',
    'it-IT': 'Italiano'
  };

  useEffect(() => {
    // Check for Speech Recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = currentLanguage;

          recognitionRef.current.onstart = () => {
            console.log('Speech recognition started');
            setError('');
          };

          recognitionRef.current.onresult = (event) => {
            console.log('Speech recognition result:', event.results);
            const transcript = event.results[0][0].transcript;
            const currentValue = value || '';
            const newValue = currentValue + (currentValue ? ' ' : '') + transcript;
            onChange({ target: { value: newValue } });
            setIsListening(false);
            setError('');
          };

          recognitionRef.current.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          };

          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event);
            setIsListening(false);
            
            switch (event.error) {
              case 'not-allowed':
                setError('Mikrofon-Berechtigung verweigert. Bitte erlauben Sie den Mikrofon-Zugriff.');
                break;
              case 'no-speech':
                setError('Keine Sprache erkannt. Bitte sprechen Sie deutlicher.');
                break;
              case 'audio-capture':
                setError('Kein Mikrofon gefunden. Bitte überprüfen Sie Ihr Mikrofon.');
                break;
              case 'network':
                setError('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
                break;
              default:
                setError(`Spracherkennung Fehler: ${event.error}`);
            }
          };

          setSpeechSupported(true);
        } catch (err) {
          console.error('Error initializing speech recognition:', err);
          setSpeechSupported(false);
          setError('Spracherkennung nicht verfügbar');
        }
      } else {
        console.warn('Speech Recognition not supported');
        setSpeechSupported(false);
        setError('Spracherkennung wird von diesem Browser nicht unterstützt');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentLanguage]);

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Mikrofon-Berechtigung erforderlich. Bitte erlauben Sie den Zugriff.');
      return false;
    }
  };

  const startListening = async () => {
    if (!speechSupported) {
      setError('Spracherkennung nicht verfügbar');
      return;
    }

    if (!recognitionRef.current || isListening) return;

    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      setIsListening(true);
      setError('');
      recognitionRef.current.lang = currentLanguage;
      recognitionRef.current.start();
      console.log('Starting speech recognition with language:', currentLanguage);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setError('Fehler beim Starten der Spracherkennung');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Stopping speech recognition');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${className} pr-16`}
          onKeyPress={onKeyPress}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="h-8 w-8 p-0 hover:bg-gray-600 text-gray-300 hover:text-white"
              title={`Sprache: ${languageOptions[currentLanguage]}`}
            >
              <Globe className="w-4 h-4" />
            </Button>
            {showLanguageMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 min-w-32">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setCurrentLanguage(lang);
                      setShowLanguageMenu(false);
                      setError(''); // Clear error when language changes
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-600 ${
                      currentLanguage === lang ? 'bg-blue-600 text-white' : 'text-gray-200'
                    }`}
                  >
                    {languageOptions[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={!speechSupported}
            title={
              !speechSupported 
                ? 'Spracherkennung nicht verfügbar' 
                : isListening 
                ? 'Aufnahme stoppen' 
                : 'Spracheingabe starten'
            }
            className={`h-8 w-8 p-0 hover:bg-gray-600 ${
              !speechSupported 
                ? 'text-gray-500 cursor-not-allowed'
                : isListening 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-900/90 border border-red-700 rounded text-red-200 text-xs z-50">
          {error}
          {error.includes('Berechtigung') && (
            <div className="mt-1 text-xs">
              💡 Tipp: Klicken Sie auf das Schloss-Symbol in der Adressleiste und erlauben Sie den Mikrofon-Zugriff.
            </div>
          )}
        </div>
      )}
      
      {/* Listening Indicator */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-green-900/90 border border-green-700 rounded text-green-200 text-xs z-50">
          🎤 Sprechen Sie jetzt... (Sprache: {languageOptions[currentLanguage]})
        </div>
      )}
    </div>
  );
};

const TrainingScenario = ({ scenarioId, userId, userName, partnerName, onComplete, onHome, onBack, onNext }) => {
  const [sessionData, setSessionData] = useState(null);
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

  const startScenario = async () => {
    try {
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

      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
        setMessages([{
          speaker: partnerName,
          message: data.partner_message,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error('Failed to start scenario');
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!userInput.trim() || responding) return;

    setResponding(true);
    const newUserMessage = {
      speaker: userName,
      message: userInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = userInput;
    setUserInput('');

    try {
      // Send response to get partner's reply
      const response = await fetch(`${BACKEND_URL}/api/training/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          user_response: currentInput
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          speaker: partnerName,
          message: data.partner_response,
          timestamp: new Date().toISOString()
        }]);

        // After 3-4 exchanges, move to evaluation
        if (messages.length >= 6) {
          setTimeout(() => evaluateResponse(currentInput), 1000);
        }
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setResponding(false);
    }
  };

  const evaluateResponse = async (lastResponse) => {
    try {
      setCurrentPhase('evaluation');
      
      const response = await fetch(`${BACKEND_URL}/api/training/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_response: lastResponse,
          scenario_id: scenarioId,
          user_id: userId
        })
      });

      if (response.ok) {
        const evaluationData = await response.json();
        setEvaluation(evaluationData);
      }
    } catch (error) {
      console.error('Error getting evaluation:', error);
    }
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

        {currentPhase === 'conversation' && (
          <>

            {/* Conversation Area */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl mb-6">
              <CardContent className="p-6">
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.speaker === userName ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-600 border-3 border-gray-500 flex-shrink-0">
                        {msg.speaker === userName ? (
                          userAvatar ? (
                            <img 
                              src={userAvatar} 
                              alt={userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                              <UserCircle className="w-8 h-8 text-white/80" />
                            </div>
                          )
                        ) : (
                          partnerAvatar ? (
                            <img 
                              src={partnerAvatar}
                              alt={partnerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                              <UserCircle className="w-8 h-8 text-white/80" />
                            </div>
                          )
                        )}
                      </div>
                      
                      {/* Message */}
                      <div className={`max-w-xs lg:max-w-md ${msg.speaker === userName ? 'text-right' : 'text-left'}`}>
                        <div className="text-sm text-gray-400 mb-2 px-2 font-medium">
                          {msg.speaker}
                        </div>
                        <div className={`px-5 py-4 rounded-2xl shadow-lg ${
                          msg.speaker === userName 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-100'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {responding && (
                    <div className="flex items-start gap-4">
                      {/* Partner Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-600 border-3 border-gray-500 flex-shrink-0">
                        {partnerAvatar ? (
                          <img 
                            src={partnerAvatar}
                            alt={partnerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                            <UserCircle className="w-8 h-8 text-white/80" />
                          </div>
                        )}
                      </div>
                      
                      {/* Typing Indicator */}
                      <div className="bg-gray-700 text-gray-100 px-5 py-4 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Area */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <SpeechInput
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Wie antworten Sie empathisch?"
                    className="flex-1 bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && sendResponse()}
                  />
                  <Button
                    onClick={sendResponse}
                    disabled={responding || !userInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  💡 Tipp: Nutzen Sie das Mikrofon-Icon für Spracheingabe in 6 Sprachen
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {currentPhase === 'evaluation' && evaluation && (
          <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-3">
                <Star className="w-8 h-8 text-yellow-400" />
                Ihre Empathie-Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {evaluation.empathy_score}/10
                </div>
                <p className="text-gray-300">Empathie-Score</p>
              </div>

              {/* Feedback */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-3">Feedback</h4>
                <p className="text-gray-300">{evaluation.feedback}</p>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="font-semibold text-yellow-400 mb-3">Verbesserungsvorschläge</h4>
                <ul className="space-y-2">
                  {evaluation.improvements.map((improvement, index) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Alternative Responses */}
              <div>
                <h4 className="font-semibold text-green-400 mb-3">Alternative Antworten</h4>
                <div className="space-y-2">
                  {evaluation.alternative_responses.map((response, index) => (
                    <div key={index} className="bg-green-900/20 p-3 rounded-lg">
                      <p className="text-green-200 italic">"{response}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Level Tip */}
              <div className="p-4 bg-purple-900/30 rounded-2xl border border-purple-700/50">
                <h4 className="font-semibold text-purple-200 mb-2">💡 Nächster Level-Tipp</h4>
                <p className="text-purple-100">{evaluation.next_level_tip}</p>
              </div>

              <Button
                onClick={completeScenario}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-2xl font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Training abschließen
              </Button>
            </CardContent>
          </Card>
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