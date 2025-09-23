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
  
  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('de-DE');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  
  // Load avatars from localStorage
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('user_avatar'));
  const [partnerAvatar, setPartnerAvatar] = useState(localStorage.getItem('partner_avatar'));

  const languageOptions = {
    'de-DE': 'Deutsch',
    'de-CH': 'Schweizerdeutsch', 
    'en-US': 'English',
    'fr-FR': 'Français',
    'es-ES': 'Español',
    'it-IT': 'Italiano'
  };

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
        setCurrentPhase('question');
      } else {
        throw new Error('Failed to start scenario');
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
    } finally {
      setLoading(false);
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
                {/* Partner Avatar and Scenario */}
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
                    <div className="text-lg font-semibold text-green-200 mb-3">{partnerName} sagt zu Ihnen:</div>
                    <div className="bg-gray-700/50 p-4 rounded-2xl border border-gray-600">
                      <p className="text-gray-100 leading-relaxed text-lg">
                        {sessionData?.partner_message}
                      </p>
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
                    Wie würden Sie empathisch antworten?
                  </h3>
                  <p className="text-gray-300">
                    Nehmen Sie sich Zeit und formulieren Sie eine einfühlsame Antwort, die die Gefühle Ihres Partners ernst nimmt.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Input Area */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
              <CardContent className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-300 font-medium mb-3">Ihre empathische Antwort:</label>
                  <div className="relative">
                    <textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Schreiben Sie Ihre empathische Antwort hier... Nehmen Sie sich Zeit und denken Sie daran: Gefühle erkennen, validieren, Unterstützung anbieten."
                      className="w-full min-h-32 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 p-4 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      rows={4}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && submitResponse()}
                    />
                    
                    {/* Speech Input Buttons */}
                    <div className="absolute right-2 top-2 flex items-center gap-1">
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
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    💡 Tipp: Nutzen Sie das Mikrofon-Icon für Spracheingabe in 6 Sprachen
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
                  <User className="w-6 h-6 text-blue-400" />
                  Ihre Antwort
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-blue-900/30 p-4 rounded-2xl border border-blue-700/50">
                  <p className="text-blue-100 italic leading-relaxed text-lg">
                    "{userResponse}"
                  </p>
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
                  <h4 className="font-semibold text-green-400 mb-3 text-lg">💬 So könnten Sie noch empathischer antworten:</h4>
                  <div className="bg-green-900/30 p-5 rounded-2xl border border-green-700/50">
                    <p className="text-green-100 leading-relaxed text-lg font-medium">
                      {evaluation.alternative_responses && evaluation.alternative_responses[0] 
                        ? `"${evaluation.alternative_responses[0]}"` 
                        : '"Ich verstehe, dass dich das wirklich beschäftigt und unsicher macht. Es ist völlig normal, dass man sich Sorgen über die Zukunft macht. Lass uns gemeinsam schauen, wie wir mit dieser Unsicherheit umgehen können. Du bist nicht allein mit diesen Gedanken."'}
                    </p>
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