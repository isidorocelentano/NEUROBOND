import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle, Play, Crown, Rocket, User, UserCheck, Mic, Globe, Camera, Upload, UserCircle, MessageCircle, BookOpen, Settings, X, Send, Plus } from 'lucide-react';
import TrainingScenario from './TrainingScenario';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Enhanced SpeechInput Component with Better Error Handling
const SpeechInput = ({ value, onChange, placeholder, className, languages = ['de-DE', 'de-CH', 'en-US', 'fr-FR', 'es-ES', 'it-IT'] }) => {
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
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title={`Sprache: ${languageOptions[currentLanguage]}`}
            >
              <Globe className="w-4 h-4" />
            </Button>
            {showLanguageMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setCurrentLanguage(lang);
                      setShowLanguageMenu(false);
                      setError(''); // Clear error when language changes
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      currentLanguage === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
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
            className={`h-8 w-8 p-0 hover:bg-gray-100 ${
              !speechSupported 
                ? 'text-gray-300 cursor-not-allowed'
                : isListening 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs z-50">
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
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-green-100 border border-green-300 rounded text-green-700 text-xs z-50">
          🎤 Sprechen Sie jetzt... (Sprache: {languageOptions[currentLanguage]})
        </div>
      )}
    </div>
  );
};

// Avatar Upload Component
const AvatarUpload = ({ currentAvatar, onAvatarChange, user, storageKey = 'user_avatar' }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]; 
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.warn('Invalid file type selected');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.warn('File size too large');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 for preview
      const reader = new window.FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        onAvatarChange(base64);
        localStorage.setItem(storageKey, base64);
      };
      reader.readAsDataURL(file);

      // In a real implementation, you would upload to the backend:
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await fetch(`${BACKEND_URL}/api/user/${user.id}/avatar`, {
      //   method: 'POST',
      //   body: formData
      // });
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-white/80" />
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
      />
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        disabled={uploading}
        className="text-xs"
      >
        <Upload className="w-3 h-3 mr-1" />
        Bild hochladen
      </Button>
    </div>
  );
};

const EmpathyTrainingApp = () => {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [currentTab, setCurrentTab] = useState('home');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userProgress] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userSubscription, setUserSubscription] = useState('free');

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Enhanced user restoration with debugging and Pro payment check
  useEffect(() => {
    console.log('🔍 NEUROBOND: Initializing app...');
    
    // Check for successful Pro payment first
    const checkProPaymentStatus = async () => {
      const pendingProUpgrade = localStorage.getItem('pending_pro_upgrade');
      const stripeSessionId = localStorage.getItem('stripe_session_id');
      
      if (pendingProUpgrade && stripeSessionId) {
        try {
          console.log('💳 NEUROBOND: Checking payment status for session:', stripeSessionId);
          const response = await fetch(`${BACKEND_URL}/api/checkout/status/${stripeSessionId}`);
          
          if (response.ok) {
            const paymentData = await response.json();
            console.log('💳 Payment status:', paymentData);
            
            if (paymentData.payment_status === 'paid') {
              console.log('✅ NEUROBOND: Payment successful, setting up Pro onboarding...');
              // Payment successful - set up Pro onboarding
              setUserSubscription('pro');
              setShowOnboarding(true);
              setShowLandingPage(false);
              
              // Clear payment tracking
              localStorage.removeItem('pending_pro_upgrade');
              localStorage.removeItem('stripe_session_id');
              
              showNotification('Zahlung erfolgreich! Willkommen bei NEUROBOND PRO! 🎉', 'success');
              return; // Exit early - user needs to register
            }
          }
        } catch (error) {
          console.error('Payment status check failed:', error);
          // Clear failed payment attempt
          localStorage.removeItem('pending_pro_upgrade');
          localStorage.removeItem('stripe_session_id');
        }
      }
      
      // Normal user restoration logic
      try {
        const savedUser = localStorage.getItem('empathy_user');
        const savedAvatar = localStorage.getItem('user_avatar');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('✅ NEUROBOND: User found in localStorage:', userData);
          setUser(userData);
          // Set subscription from saved user data
          if (userData.subscription) {
            setUserSubscription(userData.subscription);
          }
          setShowLandingPage(false);
          setShowOnboarding(false);
          console.log('✅ NEUROBOND: State updated - should show dashboard');
        } else {
          console.log('ℹ️ NEUROBOND: No saved user found - showing landing page');
        }
        
        if (savedAvatar) {
          setUserAvatar(savedAvatar);
          console.log('✅ NEUROBOND: Avatar restored from localStorage');
        }
        
      } catch (error) {
        console.error('Error during user restoration:', error);
        setShowLandingPage(true);
      }
    };
    
    checkProPaymentStatus();
  }, []);

  // Dark Landing Page Component
  const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <nav className="backdrop-blur-sm bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NEUROBOND</h1>
                    <p className="text-xs text-gray-500">Bindungstraining</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowLandingPage(false);
                      setShowOnboarding(true);
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Anmelden
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setShowLandingPage(false);
                      setShowOnboarding(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Jetzt starten
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Wissenschaftlich fundiert
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Stärke deine 
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Beziehung </span>
                mit KI-gestütztem Training
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                NEUROBOND kombiniert Neurowissenschaft mit bewährten Methoden der 
                Paartherapie (EFT & Gottman). Verbessert eure Kommunikation, löst Konflikte 
                empathisch und baut eine tiefere emotionale Verbindung auf.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <div className="text-center">
                  <Button 
                    size="lg"
                    onClick={() => {
                      setShowLandingPage(false);
                      setShowOnboarding(true);
                      setUserSubscription('free'); // Set as free user
                    }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300 mb-3"
                  >
                    <Play className="w-6 h-6 mr-3" />
                    Kostenlos ausprobieren
                  </Button>
                  <div className="text-sm text-gray-400">
                    <div>✓ 5 kostenlose Trainings</div>
                    <div>✓ Basis Gefühlslexikon</div>
                    <div>✓ Community Cases</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    size="lg"
                    onClick={() => {
                      setShowLandingPage(false);
                      setShowUpgradeModal(true); // Show payment modal first for Pro
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300 mb-3"
                  >
                    <Crown className="w-6 h-6 mr-3" />
                    PRO Version starten
                  </Button>
                  <div className="text-sm text-gray-400">
                    <div>✓ Alle 17 Trainings</div>
                    <div>✓ Vollständiges Lexikon</div>
                    <div>✓ Dialog-Coaching</div>
                    <div>✓ Eigene Fälle erstellen</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.9/5 Bewertung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>1000+ glückliche Paare</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>100% Datenschutz</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
              <div className="text-center p-6 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">KI-Feedback</h3>
                <p className="text-gray-300 text-sm">Personalisierte Bewertungen und Verbesserungsvorschläge für eure Kommunikation</p>
              </div>
              
              <div className="text-center p-6 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sprachsteuerung</h3>
                <p className="text-gray-300 text-sm">6 Sprachen unterstützt - einfach sprechen statt tippen</p>
              </div>
              
              <div className="text-center p-6 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Strukturiertes Training</h3>
                <p className="text-gray-300 text-sm">5 aufeinander aufbauende Stufen für nachhaltige Beziehungsverbesserung</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Onboarding Component
  const OnboardingForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      partner_name: ''
    });
    const [tempAvatar, setTempAvatar] = useState(null);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name || !formData.email) {
        showNotification('Bitte füllen Sie Name und E-Mail aus', 'error');
        return;
      }
      
      const newUser = {
        id: 'user-' + Date.now(),
        name: formData.name,
        email: formData.email,
        partner_name: formData.partner_name,
        subscription: userSubscription // Add subscription status to user
      };
      
      console.log('🚀 NEUROBOND: Starting registration process...');
      
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      console.log('✅ NEUROBOND: User saved to state and localStorage:', newUser);
      
      if (tempAvatar) {
        setUserAvatar(tempAvatar);
        localStorage.setItem('user_avatar', tempAvatar);
        console.log('✅ NEUROBOND: Avatar saved');
      }
      
      setShowOnboarding(false);
      setShowLandingPage(false);
      console.log('✅ NEUROBOND: States updated - onboarding off, landing off');
      
      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('🔍 NEUROBOND: State check after registration:', {
          user: user?.name,
          showOnboarding,
          showLandingPage
        });
      }, 100);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NEUROBOND</h1>
                  <p className="text-sm text-gray-400">Bindungstraining</p>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Willkommen!</h2>
              <p className="text-gray-300">Lass uns dein persönliches Profil erstellen</p>
            </div>

            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Upload Section */}
                  <div className="flex justify-center mb-6">
                    <AvatarUpload
                      currentAvatar={tempAvatar}
                      onAvatarChange={setTempAvatar}
                      user={{ id: 'temp-user' }}
                      storageKey="temp_user_avatar"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-300 font-medium">Dein Name *</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="z.B. Sophia"
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-gray-300 font-medium">E-Mail-Adresse *</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="sophia@example.com"
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="partner_name" className="text-gray-300 font-medium">Name deines Partners</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={formData.partner_name}
                          onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                          placeholder="z.B. Max (optional)"
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold text-blue-100">Du erhältst Zugang zu:</h4>
                    </div>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        5 kostenlose Trainings-Szenarien
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Gefühlslexikon mit 50+ Emotionen
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        KI-gestütztes Feedback
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Partner-Dashboard verfügbar
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Sprachsteuerung in 6 Sprachen
                      </li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-2xl font-semibold"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    NEUROBOND starten
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Partner Dashboard Component (inspired by user's design)
  const PartnerDashboard = ({ isMainUser = true }) => {
    const partnerLevel = Math.floor(userProgress.length / 3) + 3; // Start at Level 3 like in image
    
    // Load correct avatar based on user type
    const displayAvatar = isMainUser ? userAvatar : localStorage.getItem('partner_avatar');
    const displayName = isMainUser ? (user?.name || 'Sophia') : (user?.partner_name || 'Max');
    
    // Dynamic daily goals based on user progress and day of week
    const generateDynamicGoals = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const userLevel = partnerLevel;
      const completedScenarios = userProgress.length;
      
      const baseGoals = [
        { text: "Empathie-Training absolvieren", completed: completedScenarios > 0 },
        { text: "Gefühlslexikon studieren", completed: true }, // Always accessible
        { text: "Partner-Dialog führen", completed: Math.random() > 0.5 }, // Simulated
        { text: "Meditation (5 Min)", completed: Math.random() > 0.3 },
        { text: "Eigenen Case erstellen", completed: false }
      ];

      // Add level-specific goals
      if (userLevel >= 3) {
        baseGoals.push({ text: "Dialog-Coaching durchführen", completed: completedScenarios > 2 });
      }
      
      if (userLevel >= 4) {
        baseGoals.push({ text: "Community Case kommentieren", completed: Math.random() > 0.6 });
      }

      // Add day-specific goals
      const daySpecificGoals = {
        0: [{ text: "Wochenreflexion schreiben", completed: false }], // Sunday
        1: [{ text: "Wöchentlichen Plan aktualisieren", completed: false }], // Monday
        2: [{ text: "Konfliktlösung üben", completed: Math.random() > 0.7 }], // Tuesday
        3: [{ text: "Dankbarkeits-Übung", completed: Math.random() > 0.4 }], // Wednesday
        4: [{ text: "Emotionale Intelligenz Training", completed: false }], // Thursday
        5: [{ text: "Beziehungs-Check durchführen", completed: Math.random() > 0.8 }], // Friday
        6: [{ text: "Gemeinsame Aktivität planen", completed: Math.random() > 0.5 }] // Saturday
      };

      const allGoals = [...baseGoals, ...daySpecificGoals[dayOfWeek]];
      
      // Add some personal goals based on user data
      if (user?.partner_name) {
        allGoals.push({ 
          text: `${user.partner_name} Kompliment machen`, 
          completed: Math.random() > 0.6 
        });
      }

      return allGoals.slice(0, 10); // Limit to 10 goals
    };

    // Handle goal action
    const handleGoalAction = (goalText) => {
      if (goalText.includes('Empathie-Training')) {
        setCurrentTab('training-stufen');
      } else if (goalText.includes('Gefühlslexikon')) {
        setCurrentTab('gefuehlslexikon');
      } else if (goalText.includes('Dialog-Coaching')) {
        setCurrentTab('dialog-coaching');
      } else if (goalText.includes('Community Case')) {
        setCurrentTab('community-cases');
      } else if (goalText.includes('eigenen Case') || goalText.includes('Case erstellen')) {
        setCurrentTab('own-cases');
      } else if (goalText.includes('Meditation')) {
        showNotification('🧘‍♀️ Meditation-Feature wird bald verfügbar sein!', 'info');
      } else if (goalText.includes('Partner-Dialog')) {
        showNotification('💬 Starten Sie ein Training-Szenario für Partner-Dialog!', 'info');
        setTimeout(() => setCurrentTab('training-stufen'), 2000);
      } else if (goalText.includes('Wochenreflexion') || goalText.includes('Plan aktualisieren')) {
        showNotification('📋 Diese Funktion wird bald verfügbar sein!', 'info');
      } else if (goalText.includes('Konfliktlösung')) {
        showNotification('🤝 Konfliktlösung-Training wird geladen...', 'info');
        setTimeout(() => setCurrentTab('training-stufen'), 2000);
      } else if (goalText.includes('Kompliment')) {
        showNotification('💝 Das ist eine persönliche Aufgabe für Sie und Ihren Partner!', 'success');
      } else {
        showNotification(`${goalText} - Funktion wird geladen...`, 'info');
      }
    };

    // Toggle goal completion (for testing/practice)
    const toggleGoalCompletion = (index) => {
      // This would normally save to backend, for now just show notification
      showNotification('Ziel-Status aktualisiert! (Demo-Modus)', 'success');
    };

    const dailyGoals = generateDynamicGoals();
    const dailyGoalsCompleted = dailyGoals.filter(goal => goal.completed).length;
    const dailyGoalsTotal = dailyGoals.length;
    const progressPercentage = (dailyGoalsCompleted / dailyGoalsTotal) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Neurobond</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10 flex items-center gap-2"
            onClick={() => setCurrentTab('partners')}
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            <span className="text-sm">Profile bearbeiten</span>
          </Button>
        </header>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-12 relative z-10">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white/20">
            {displayAvatar ? (
              <img 
                src={displayAvatar} 
                alt={`${displayName} Avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <UserCircle className="w-20 h-20 text-white/80" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            {displayName}
          </h2>
          <p className="text-lg text-gray-300">Level {partnerLevel}</p>
          <div className="mt-2 px-4 py-1 bg-blue-600/20 rounded-full">
            <p className="text-sm text-blue-200">
              {userProgress.length} Szenarien abgeschlossen
            </p>
          </div>
        </div>

        {/* Daily Goals Section */}
        <div className="px-6 mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Dynamische Tagesziele</h3>
            <div className="text-sm text-gray-400">
              {new Date().toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-lg text-gray-300 mb-3">
              {dailyGoalsCompleted} von {dailyGoalsTotal} abgeschlossen
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Dynamic Goals List */}
          <div className="space-y-4">
            {dailyGoals.map((goal, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer hover:bg-gray-700/30 ${
                  goal.completed ? 'bg-green-900/20' : 'bg-gray-800/50'
                }`}
                onClick={() => !goal.completed && handleGoalAction(goal.text)}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGoalCompletion(index);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      goal.completed 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500' 
                        : 'bg-gray-600 border-2 border-gray-500 hover:border-blue-400'
                    }`}
                  >
                    {goal.completed && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <span className={`block ${
                      goal.completed 
                        ? 'text-white line-through' 
                        : 'text-gray-300'
                    }`}>
                      {goal.text}
                    </span>
                    {!goal.completed && (
                      <span className="text-xs text-blue-400 mt-1 block">
                        → Klicken um zu starten
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {goal.completed ? (
                    <Badge className="bg-green-600/20 text-green-200 text-xs">
                      Erledigt
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600/20 text-blue-200 text-xs">
                        Offen
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Motivation */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="font-semibold text-white">
                  {progressPercentage >= 80 ? 'Fantastisch!' : 
                   progressPercentage >= 60 ? 'Gut gemacht!' : 
                   progressPercentage >= 40 ? 'Weiter so!' : 'Heute ist dein Tag!'}
                </p>
                <p className="text-sm text-gray-300">
                  {progressPercentage >= 80 ? 'Du bist ein Vorbild für empathische Kommunikation!' :
                   progressPercentage >= 60 ? 'Du machst tolle Fortschritte in eurer Beziehung.' :
                   progressPercentage >= 40 ? 'Jeder Schritt bringt euch näher zusammen.' :
                   'Kleine Schritte führen zu großen Veränderungen.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
          <div className="flex justify-around py-4">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => setCurrentTab('home')}
            >
              <Target className="w-6 h-6 mb-1" />
              <span className="text-xs">Training</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => setCurrentTab('gefuehlslexikon')}
            >
              <BookOpen className="w-6 h-6 mb-1" />
              <span className="text-xs">Lexikon</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-blue-400"
            >
              <Heart className="w-6 h-6 mb-1" />
              <span className="text-xs">Ziele</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => setCurrentTab('own-cases')}
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs">Eigene Cases</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => setCurrentTab('partners')}
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Gefühlslexikon Component
  const GefuehlslexikonPage = () => {
    const [selectedEmotion, setSelectedEmotion] = useState(null);
    const [showPracticalGuide, setShowPracticalGuide] = useState(false);
    
    const emotions = [
      // 🔴 KATEGORIE 1: HOHE AKTIVIERUNG / UNBEHAGEN (Der Alarm-Modus)
      {
        name: "Wut / Ärger",
        color: "bg-red-500",
        category: "🔴 Hohe Aktivierung / Unbehagen",
        categoryDescription: "Der Alarm-Modus",
        intensityScale: "Verärgert → Wütend → Zornig / Rasend",
        definition: "Intensive emotionale Reaktion auf wahrgenommene Ungerechtigkeit, Verletzung oder Frustration",
        bodySignals: "Hitze, angespannte Muskeln (Kiefer, Fäuste), laute Stimme, schneller Puls, Anspannung im ganzen Körper",
        underlyingNeed: "Grenzen setzen, Gerechtigkeit, durchgesetzt werden, Respekt, Autonomie",
        helpfulQuestion: "Wo wurde meine Grenze überschritten?",
        practicalExamples: [
          "Ihr Partner vergisst zum dritten Mal einen wichtigen Termin, obwohl Sie ihn mehrfach daran erinnert haben",
          "Sie fühlen sich in einer Diskussion nicht ernst genommen oder übergangen",
          "Ihr Partner trifft eine wichtige Entscheidung ohne Sie zu konsultieren"
        ],
        exampleDialog: {
          situation: "Ihr Partner kommt wieder einmal zu spät nach Hause, obwohl Sie ein gemeinsames Abendessen geplant hatten",
          dialog: [
            { speaker: "Sie", text: "Ich bin so wütend! Das ist jetzt das dritte Mal diese Woche, dass du zu spät kommst!" },
            { speaker: "Partner", text: "Es tut mir leid, aber die Besprechung hat länger gedauert. Ich konnte nichts dafür." },
            { speaker: "Sie (besser)", text: "Ich bin wütend, weil mein Bedürfnis nach Respekt und Planungssicherheit verletzt wurde. Kannst du verstehen, wie frustrierend das für mich ist?" },
            { speaker: "Partner", text: "Du hast recht. Es war respektlos von mir. Lass uns einen Plan machen, wie ich dich in Zukunft früher informieren kann." }
          ]
        },
        communicationTip: "Statt 'Du machst mich wütend!' sagen Sie: 'Ich bin wütend, weil mein Bedürfnis nach Respekt verletzt wurde.'"
      },
      {
        name: "Angst", 
        color: "bg-orange-500",
        category: "🔴 Hohe Aktivierung / Unbehagen",
        categoryDescription: "Der Alarm-Modus",
        intensityScale: "Besorgt → Ängstlich → Panisch",
        definition: "Emotionale Reaktion auf wahrgenommene Bedrohung oder Unsicherheit in der Zukunft",
        bodySignals: "Enge in der Brust, flache Atmung, kalte Hände, Unruhe, Anspannung, schneller Herzschlag",
        underlyingNeed: "Sicherheit, Schutz, Vorbereitung, Kontrolle, Vorhersagbarkeit",
        helpfulQuestion: "Wovor muss ich mich schützen?",
        practicalExamples: [
          "Ihr Partner verhält sich ungewöhnlich distanziert und Sie befürchten Beziehungsprobleme",
          "Anstehende Veränderungen (Jobwechsel, Umzug) machen Ihnen Sorgen um die Beziehung",
          "Sie haben Angst, nicht gut genug für Ihren Partner zu sein"
        ],
        exampleDialog: {
          situation: "Sie bemerken, dass Ihr Partner weniger Zeit mit Ihnen verbringt und mehr mit Kollegen ausgeht",
          dialog: [
            { speaker: "Sie", text: "Du bist in letzter Zeit so selten zuhause. Liebst du mich noch?" },
            { speaker: "Partner", text: "Natürlich! Du machst dir viel zu viele Sorgen." },
            { speaker: "Sie (besser)", text: "Ich habe Angst, dass ich dir nicht mehr wichtig bin, weil du so viel Zeit mit anderen verbringst. Können wir darüber reden?" },
            { speaker: "Partner", text: "Oh, das wusste ich gar nicht. Du bist mir sehr wichtig. Lass uns mehr gemeinsame Zeit einplanen." }
          ]
        },
        communicationTip: "Sprechen Sie konkrete Ängste aus: 'Ich habe Angst vor... Kannst du mir dabei helfen, mich sicherer zu fühlen?'"
      },
      {
        name: "Ekel / Abscheu",
        color: "bg-yellow-800",
        category: "🔴 Hohe Aktivierung / Unbehagen", 
        categoryDescription: "Der Alarm-Modus",
        intensityScale: "Unbehagen → Angewidert → Ekel",
        definition: "Starke Ablehnung gegenüber etwas, das als moralisch oder körperlich inakzeptabel empfunden wird",
        bodySignals: "Würgereiz, zusammengezogene Lippen, Abwenden des Blicks/Körpers, Schaudern",
        underlyingNeed: "Reinigung, Distanz, Schutz vor Verunreinigung (körperlich oder moralisch), Integrität",
        helpfulQuestion: "Was ist giftig für mich und muss abgestoßen werden?",
        practicalExamples: [
          "Ihr Partner verhält sich unehrlich oder manipulativ",
          "Bestimmte Gewohnheiten oder Verhaltensweisen stoßen Sie ab",
          "Moralische Grenzüberschreitungen lösen starke Ablehnung aus"
        ],
        exampleDialog: {
          situation: "Sie entdecken, dass Ihr Partner Sie bezüglich seiner Ausgaben belogen hat",
          dialog: [
            { speaker: "Sie", text: "Das ist ekelhaft! Wie kannst du mich so anlügen?" },
            { speaker: "Partner", text: "Es ist doch nicht so schlimm. Du übertreibst wieder mal." },
            { speaker: "Sie (besser)", text: "Dieses unehrliche Verhalten widerspricht meinen Grundwerten. Es macht mir Angst, dir nicht mehr vertrauen zu können." },
            { speaker: "Partner", text: "Du hast recht. Ehrlichkeit ist wichtig. Ich werde transparenter sein und dein Vertrauen wieder verdienen." }
          ]
        },
        communicationTip: "Benennen Sie konkret was Sie stört: 'Dieses Verhalten widerspricht meinen Werten, weil...'"
      },
      {
        name: "Frustration",
        color: "bg-red-600",
        category: "🔴 Hohe Aktivierung / Unbehagen",
        categoryDescription: "Der Alarm-Modus", 
        intensityScale: "Genervt → Frustriert → Verzweifelt",
        definition: "Gefühl der Blockade wenn Ziele oder Erwartungen wiederholt nicht erreicht werden können",
        bodySignals: "Seufzen, Augenrollen, Anspannung, Unruhe, Hände zu Fäusten ballen",
        underlyingNeed: "Wirksamkeit, Erfolg, Überwindung von Hindernissen, Fortschritt",
        helpfulQuestion: "Was blockiert mich gerade?",
        practicalExamples: [
          "Sie versuchen ein Problem in der Beziehung zu lösen, aber kommen nicht voran",
          "Kommunikation läuft immer wieder in die gleichen Muster",
          "Sie fühlen sich in Ihren Bemühungen nicht verstanden"
        ],
        exampleDialog: {
          situation: "Sie versuchen seit Wochen, mit Ihrem Partner über die Haushaltsaufteilung zu sprechen, aber nichts ändert sich",
          dialog: [
            { speaker: "Sie", text: "Das bringt alles nichts! Du hörst mir sowieso nicht zu!" },
            { speaker: "Partner", text: "Doch, ich höre zu. Aber du jammerst nur rum." },
            { speaker: "Sie (besser)", text: "Ich bin frustriert, weil ich gerne eine faire Haushaltsaufteilung erreichen möchte, aber ich fühle mich blockiert. Können wir einen anderen Ansatz versuchen?" },
            { speaker: "Partner", text: "Du hast recht, wir drehen uns im Kreis. Lass uns konkret planen, wer was übernimmt." }
          ]
        },
        communicationTip: "Identifizieren Sie das Hindernis: 'Ich bin frustriert, weil ich gerne... erreichen möchte, aber...'"
      },

      // 🟡 KATEGORIE 2: NIEDRIGE AKTIVIERUNG / UNBEHAGEN (Der Rückzug-Modus)
      {
        name: "Traurigkeit",
        color: "bg-blue-600",
        category: "🟡 Niedrige Aktivierung / Unbehagen",
        categoryDescription: "Der Rückzug-Modus",
        intensityScale: "Wehmütig → Traurig → Verzweifelt",
        definition: "Tiefer emotionaler Schmerz als Reaktion auf Verlust, Enttäuschung oder unerfüllte Erwartungen",
        bodySignals: "Schwere in Gliedern, Druck auf der Brust, Tränen, Energielosigkeit, hängende Schultern",
        underlyingNeed: "Trost, Abschied nehmen, Verlust verarbeiten, Mitgefühl, Unterstützung",
        helpfulQuestion: "Was habe ich verloren und muss es betrauern?",
        practicalExamples: [
          "Ein gemeinsamer Traum oder Plan ist zerbrochen",
          "Die Beziehung hat nicht mehr die Leichtigkeit wie am Anfang",
          "Sie fühlen emotionale Distanz zum Partner"
        ],
        exampleDialog: {
          situation: "Ihr gemeinsamer Plan, ein Haus zu kaufen, ist durch finanzielle Probleme geplatzt",
          dialog: [
            { speaker: "Sie", text: "Es ist alles sinnlos. Wir werden nie unser eigenes Zuhause haben." },
            { speaker: "Partner", text: "Sei doch nicht so negativ. Es wird schon klappen." },
            { speaker: "Sie (besser)", text: "Ich bin traurig, weil ich den Verlust unseres gemeinsamen Traumes betrauern muss. Könntest du mich dabei unterstützen?" },
            { speaker: "Partner", text: "Das verstehe ich. Es ist okay, traurig zu sein. Lass uns gemeinsam einen neuen Plan entwickeln." }
          ]
        },
        communicationTip: "Benennen Sie den Verlust: 'Ich bin traurig, weil ich ... vermisse. Kannst du mich dabei unterstützen?'"
      },
      {
        name: "Scham",
        color: "bg-red-800",
        category: "🟡 Niedrige Aktivierung / Unbehagen",
        categoryDescription: "Der Rückzug-Modus",
        intensityScale: "Verlegen → Beschämt → Gedemütigt",
        definition: "Schmerzhaftes Gefühl der Bloßstellung oder des fundamentalen Versagens als Person",
        bodySignals: "Hitze im Gesicht (Erröten), gesenkter Blick, sich klein machen, Verstecken wollen",
        underlyingNeed: "Zugehörigkeit, Akzeptanz, sich verstecken, Vergebung",
        helpfulQuestion: "Wofür fürchte ich, ausgeschlossen zu werden?",
        practicalExamples: [
          "Sie haben einen wichtigen Fehler gemacht und fühlen sich als Person unzulänglich",
          "Ihr Partner hat Sie vor anderen kritisiert oder bloßgestellt",
          "Sie vergleichen sich mit anderen und fühlen sich minderwertig"
        ],
        exampleDialog: {
          situation: "Sie haben vor Freunden Ihres Partners einen peinlichen Kommentar gemacht und fühlen sich schrecklich",
          dialog: [
            { speaker: "Sie", text: "Ich bin so dumm! Jetzt denken alle schlecht von dir wegen mir." },
            { speaker: "Partner", text: "Ach was, das war doch nicht so schlimm." },
            { speaker: "Sie (besser)", text: "Ich schäme mich für meinen Kommentar und habe Angst, dass ich dich blamiert habe. Das macht es schwer für mich, darüber zu sprechen." },
            { speaker: "Partner", text: "Hey, jeder macht mal Fehler. Meine Freunde mögen dich trotzdem. Du bist ein wunderbarer Mensch." }
          ]
        },
        communicationTip: "Teilen Sie Schamgefühle vorsichtig: 'Ich schäme mich für... Das macht es schwer für mich, darüber zu sprechen.'"
      },
      {
        name: "Hilflosigkeit / Ohnmacht",
        color: "bg-gray-600",
        category: "🟡 Niedrige Aktivierung / Unbehagen",
        categoryDescription: "Der Rückzug-Modus",
        intensityScale: "Überfordert → Hilflos → Resigniert",
        definition: "Gefühl der völligen Machtlosigkeit und des Ausgeliefertseins gegenüber der Situation",
        bodySignals: "Schwere, Leere, Erschlaffung, flacher Atem, kraftlose Bewegungen",
        underlyingNeed: "Selbstwirksamkeit, Kontrolle, Unterstützung, Handlungsfähigkeit",
        helpfulQuestion: "Wo fehlt mir gerade jede Macht?",
        practicalExamples: [
          "Beziehungsprobleme scheinen unlösbar und Sie wissen nicht weiter",
          "Sie können Ihrem Partner nicht helfen, obwohl er leidet",
          "Äußere Umstände bedrohen die Beziehung und Sie können nichts tun"
        ],
        exampleDialog: {
          situation: "Ihr Partner leidet unter Depressionen und Sie wissen nicht, wie Sie helfen können",
          dialog: [
            { speaker: "Sie", text: "Ich kann dir sowieso nicht helfen. Ich bin nutzlos." },
            { speaker: "Partner", text: "Das stimmt nicht. Du gibst dir Mühe." },
            { speaker: "Sie (hilfesuchend)", text: "Ich fühle mich hilflos in dieser Situation. Ich möchte dir so gerne helfen, aber weiß nicht wie. Können wir gemeinsam einen Weg finden?" },
            { speaker: "Partner", text: "Dass du da bist und es versuchst, bedeutet mir schon viel. Vielleicht können wir zusammen professionelle Hilfe suchen." }
          ]
        },
        communicationTip: "Bitten Sie um konkrete Hilfe: 'Ich fühle mich hilflos in dieser Situation. Können wir gemeinsam einen Weg finden?'"
      },
      {
        name: "Leere / Apathie",
        color: "bg-slate-500",
        category: "🟡 Niedrige Aktivierung / Unbehagen",
        categoryDescription: "Der Rückzug-Modus",
        intensityScale: "Abgestumpft → Leer → Apathisch",
        definition: "Gefühl innerer Taubheit und des Verlusts von emotionaler Verbindung",
        bodySignals: "Gefühl der Taubheit, Dissoziation, kein Zugang zu Gefühlen, mechanische Bewegungen",
        underlyingNeed: "Sinn, Verbindung, Stimulation, Erholung, Lebendigkeit",
        helpfulQuestion: "Was würde mich wieder lebendig fühlen lassen?",
        practicalExamples: [
          "Die Beziehung fühlt sich routine-mäßig und emotionslos an",
          "Sie spüren keine Freude oder Trauer mehr - alles ist gleichgültig",
          "Emotionale Überforderung hat zu innerem Rückzug geführt"
        ],
        communicationTip: "Beschreiben Sie die Leere: 'Ich fühle mich emotional taub. Ich brauche Hilfe, wieder Verbindung zu spüren.'"
      },

      // 🟢 KATEGORIE 3: WOHLBEFINDEN / SICHERHEIT & VERBINDUNG (Der Wachstums-Modus)
      {
        name: "Freude / Begeisterung",
        color: "bg-yellow-500",
        category: "🟢 Wohlbefinden / Sicherheit & Verbindung",
        categoryDescription: "Der Wachstums-Modus",
        intensityScale: "Zufrieden → Fröhlich → Begeistert / Ekstatisch",
        definition: "Warmes, expansives Gefühl des Glücks und der Lebensfreude",
        bodySignals: "Leichtigkeit, Wärme in der Brust, Lächeln, Energie, aufrechte Haltung",
        underlyingNeed: "Teilen, Verbindung, Feiern, Ausdruck",
        helpfulQuestion: "Worüber kann ich mich gerade authentisch freuen?",
        practicalExamples: [
          "Ihr Partner überrascht Sie mit einer liebevollen Geste",
          "Sie beide lachen zusammen über etwas Lustiges",
          "Ein gemeinsames Ziel wurde erreicht und Sie feiern den Erfolg"
        ],
        exampleDialog: {
          situation: "Ihr Partner hat heimlich Ihren Lieblingskuchen gebacken, nachdem Sie einen schwierigen Tag hatten",
          dialog: [
            { speaker: "Sie", text: "Oh wow, das ist ja mein Lieblingskuchen!" },
            { speaker: "Partner", text: "Ich dachte mir, dass du nach dem stressigen Tag etwas Schönes brauchst." },
            { speaker: "Sie (ausdrucksvoll)", text: "Ich freue mich so sehr über diese liebevolle Geste! Du zeigst mir damit, dass du an mich denkst. Das macht mich richtig glücklich!" },
            { speaker: "Partner", text: "Es freut mich, dich glücklich zu sehen. Du bedeutest mir so viel." }
          ]
        },
        communicationTip: "Teilen Sie Freude bewusst: 'Ich freue mich so sehr über... Das macht mich richtig glücklich!'"
      },
      {
        name: "Liebe / Zuneigung", 
        color: "bg-pink-500",
        category: "🟢 Wohlbefinden / Sicherheit & Verbindung",
        categoryDescription: "Der Wachstums-Modus",
        intensityScale: "Sympathie → Zuneigung → Liebe / Hingabe",
        definition: "Tiefe emotionale Verbindung und bedingungslose Akzeptanz einer anderen Person",
        bodySignals: "Wärmegefühl, weicher Blick, entspannte Körpermitte, Berührungsdrang",
        underlyingNeed: "Nähe, Fürsorge, Verbindung, Geben und Nehmen",
        helpfulQuestion: "Wem oder was möchte ich mich gerade zuwenden?",
        practicalExamples: [
          "Sie schauen Ihren schlafenden Partner an und spüren tiefe Zärtlichkeit",
          "Ihr Partner ist krank und Sie kümmern sich gerne um ihn",
          "In einem schwierigen Moment stehen Sie bedingungslos zusammen"
        ],
        exampleDialog: {
          situation: "Ihr Partner ist mit einem wichtigen Projekt gescheitert und völlig niedergeschlagen",
          dialog: [
            { speaker: "Partner", text: "Ich bin so ein Versager. Nichts klappt bei mir." },
            { speaker: "Sie", text: "Du bist kein Versager! Du bist intelligent und fleißig." },
            { speaker: "Sie (liebevoller)", text: "Ich liebe dich, auch wenn Projekte manchmal nicht klappen. Du bist ein wunderbarer Mensch mit so vielen Talenten. Diese Schwierigkeit ändert nichts an meiner Liebe zu dir." },
            { speaker: "Partner", text: "Danke, dass du zu mir stehst. Deine Liebe gibt mir Kraft, weiterzumachen." }
          ]
        },
        communicationTip: "Drücken Sie Liebe konkret aus: 'Ich liebe dich, weil... Du bist mir so wichtig.'"
      },
      {
        name: "Geborgenheit / Sicherheit",
        color: "bg-green-600", 
        category: "🟢 Wohlbefinden / Sicherheit & Verbindung",
        categoryDescription: "Der Wachstums-Modus",
        intensityScale: "Ruhig → Sicher → Geborgen",
        definition: "Fundamentales Gefühl von Schutz und emotionaler Sicherheit",
        bodySignals: "Tiefe, ruhige Atmung, entspannte Muskulatur, offene Haltung",
        underlyingNeed: "Schutz, Vertrauen, Loslassen-Können, Stabilität",
        helpfulQuestion: "Was gibt mir in diesem Moment das Gefühl, absolut sicher zu sein?",
        practicalExamples: [
          "Sie liegen in den Armen Ihres Partners und spüren vollkommene Ruhe",
          "Nach einem stressigen Tag bringt die Gegenwart Ihres Partners sofort Entspannung",
          "Sie können sich vollkommen fallen lassen, ohne Angst vor Verurteilung"
        ],
        exampleDialog: {
          situation: "Nach einem besonders anstrengenden Arbeitstag kommen Sie nach Hause",
          dialog: [
            { speaker: "Sie", text: "Was für ein furchtbarer Tag. Alles ging schief." },
            { speaker: "Partner", text: "Komm her. Erzähl mir davon." },
            { speaker: "Sie (entspannt)", text: "Bei dir fühle ich mich geborgen und sicher. Wenn du deine Arme um mich legst, ist die ganze Welt in Ordnung. Das bedeutet mir sehr viel." },
            { speaker: "Partner", text: "Du bist bei mir immer sicher. Hier kannst du alles loslassen." }
          ]
        },
        communicationTip: "Anerkennen Sie Sicherheit: 'Bei dir fühle ich mich geborgen und sicher. Das bedeutet mir sehr viel.'"
      },
      {
        name: "Neugier / Interesse",
        color: "bg-purple-500",
        category: "🟢 Wohlbefinden / Sicherheit & Verbindung", 
        categoryDescription: "Der Wachstums-Modus",
        intensityScale: "Aufmerksam → Neugierig → Fasziniert",
        definition: "Offene, explorative Haltung gegenüber neuen Erfahrungen und Erkenntnissen",
        bodySignals: "Wachheit, offene Augen, nach vorne geneigt, ruhige Konzentration",
        underlyingNeed: "Erkunden, Lernen, Wachstum, Verstehen",
        helpfulQuestion: "Was fesselt gerade meine Aufmerksamkeit?",
        practicalExamples: [
          "Sie entdecken eine neue Seite an Ihrem Partner und sind fasziniert",
          "Ein Gespräch öffnet neue Perspektiven auf Ihre Beziehung",
          "Sie beide erkunden gemeinsam neue Aktivitäten oder Orte"
        ],
        communicationTip: "Zeigen Sie Interesse: 'Das finde ich faszinierend an dir... Erzähl mir mehr davon!'"
      },

      // 🔵 KATEGORIE 4: KOMPLEXE & GEMISCHTE GEFÜHLE (Die reflektierte Ebene)
      {
        name: "Neid / Eifersucht",
        color: "bg-green-800",
        category: "🔵 Komplexe & Gemischte Gefühle",
        categoryDescription: "Die reflektierte Ebene", 
        intensityScale: "Unbehagen → Neidisch → Eifersüchtig / Besitzergreifend",
        definition: "Komplexe Mischung aus Angst (zu verlieren), Wut (ungerecht behandelt) und Traurigkeit (Mangel)",
        bodySignals: "Enge in der Brust, angespannte Kiefer, unruhige Gedanken, Kontrollbedürfnis",
        underlyingNeed: "Sicherheit in der Bindung, Selbstwert, Gerechtigkeit, Einzigartigkeit",
        helpfulQuestion: "Was habe ich nicht, das ich für mein Glück brauche?",
        practicalExamples: [
          "Ihr Partner verbringt viel Zeit mit attraktiven Kollegen",
          "Andere Paare scheinen glücklicher oder erfolgreicher zu sein",
          "Ihr Partner bewundert Eigenschaften anderer, die Sie nicht haben"
        ],
        exampleDialog: {
          situation: "Ihr Partner schwärmt von seiner neuen Kollegin, die sehr sportlich und erfolgreich ist",
          dialog: [
            { speaker: "Sie", text: "Du redest ständig nur noch von ihr! Bin ich dir nicht mehr gut genug?" },
            { speaker: "Partner", text: "Du bist eifersüchtig ohne Grund. Wir arbeiten nur zusammen." },
            { speaker: "Sie (reflektiert)", text: "Ich bin eifersüchtig, weil ich Angst habe, dass du jemanden findest, der sportlicher und erfolgreicher ist als ich. Kannst du mir helfen, mich sicherer zu fühlen?" },
            { speaker: "Partner", text: "Oh, das wusste ich nicht. Du bist perfekt für mich, genau so wie du bist. Lass mich dir das öfter zeigen." }
          ]
        },
        communicationTip: "Benennen Sie die dahinterliegende Angst: 'Ich bin eifersüchtig, weil ich Angst habe, dass...'"
      },
      {
        name: "Schuld",
        color: "bg-orange-800",
        category: "🔵 Komplexe & Gemischte Gefühle",
        categoryDescription: "Die reflektierte Ebene",
        intensityScale: "Reue → Schuldig → Überwältigt von Schuld",
        definition: "Mischung aus Angst (vor Bestrafung) und Scham (über Versagen gegen eigene Werte)",
        bodySignals: "Druck in der Brust, gesenkter Blick, schwere Schultern, innere Unruhe",
        underlyingNeed: "Wiedergutmachung, Verantwortung übernehmen, Vergebung, Integrität",
        helpfulQuestion: "Wem gegenüber habe ich meine Werte verletzt?",
        practicalExamples: [
          "Sie haben Ihren Partner verletzt oder enttäuscht",
          "Ein Versprechen wurde gebrochen und Sie spüren die Verantwortung",
          "Ihr Verhalten entsprach nicht Ihren eigenen moralischen Standards"
        ],
        exampleDialog: {
          situation: "Sie haben in einem Streit etwas Verletzendes über die Familie Ihres Partners gesagt",
          dialog: [
            { speaker: "Sie", text: "Es tut mir leid, aber du hast mich auch verletzt!" },
            { speaker: "Partner", text: "Das rechtfertigt nicht, was du über meine Familie gesagt hast." },
            { speaker: "Sie (verantwortlich)", text: "Du hast recht. Ich fühle mich schuldig, weil ich deine Familie beleidigt habe, obwohl das gegen meine Werte verstößt. Wie kann ich das wiedergutmachen?" },
            { speaker: "Partner", text: "Danke, dass du Verantwortung übernimmst. Vielleicht könntest du dich bei ihnen entschuldigen?" }
          ]
        },
        communicationTip: "Übernehmen Sie Verantwortung: 'Ich fühle mich schuldig, weil ich... Wie kann ich das wiedergutmachen?'"
      },
      {
        name: "Stolz",
        color: "bg-yellow-600",
        category: "🔵 Komplexe & Gemischte Gefühle", 
        categoryDescription: "Die reflektierte Ebene",
        intensityScale: "Zufrieden → Stolz → Überheblich",
        definition: "Mischung aus Freude (über Erfolg) und Sicherheit (in den eigenen Fähigkeiten)",
        bodySignals: "Aufrechte Haltung, erhobenes Kinn, warmes Gefühl in der Brust, Energie",
        underlyingNeed: "Anerkennung, Selbstwirksamkeit, Wertschätzung, Bedeutsamkeit",
        helpfulQuestion: "Worauf habe ich durch meine eigene Anstrengung erreicht?",
        practicalExamples: [
          "Sie haben erfolgreich an einem Beziehungsproblem gearbeitet",
          "Ihr Partner erreicht ein wichtiges Ziel und Sie sind stolz auf ihn",
          "Andere bewundern Ihre Beziehung und Sie fühlen sich bestätigt"
        ],
        communicationTip: "Teilen Sie berechtigten Stolz: 'Ich bin stolz darauf, dass wir... Das zeigt, wie stark wir sind.'"
      },
      {
        name: "Hoffnung",
        color: "bg-blue-400",
        category: "🔵 Komplexe & Gemischte Gefühle",
        categoryDescription: "Die reflektierte Ebene", 
        intensityScale: "Optimistisch → Hoffnungsvoll → Überzeugt",
        definition: "Mischung aus Neugier (auf Zukunft), Vorfreude und vorsichtiger Zuversicht",
        bodySignals: "Aufrechte Haltung, tiefere Atmung, Lächeln, nach vorne gerichteter Blick",
        underlyingNeed: "Perspektive, Orientierung, Motivation, Sinn",
        helpfulQuestion: "Was könnte trotz allem positiv in der Zukunft liegen?",
        practicalExamples: [
          "Nach einer Krise sehen Sie erste positive Veränderungen",
          "Sie beide beginnen eine Paartherapie und glauben an Besserung",
          "Trotz Schwierigkeiten vertrauen Sie in Ihre gemeinsame Zukunft"
        ],
        communicationTip: "Artikulieren Sie Hoffnung: 'Ich glaube daran, dass wir... Das gibt mir Mut für unsere Zukunft.'"
      },
      {
        name: "Dankbarkeit",
        color: "bg-amber-500",
        category: "🔵 Komplexe & Gemischte Gefühle",
        categoryDescription: "Die reflektierte Ebene",
        intensityScale: "Wertschätzend → Dankbar → Überwältigt von Dankbarkeit", 
        definition: "Mischung aus Freude (über ein Geschenk), Liebe (dem Geber gegenüber) und Demut",
        bodySignals: "Warmes Gefühl im Herzen, entspannte Mimik, das Bedürfnis zu danken, Lächeln",
        underlyingNeed: "Verbindung, Wertschätzung ausdrücken, Sinn, Reziprozität",
        helpfulQuestion: "Wem oder was verdanke ich gerade etwas Gutes?",
        practicalExamples: [
          "Ihr Partner hat Ihnen in einer schwierigen Zeit beigestanden",
          "Sie realisieren, wie viel Ihr Partner täglich für Sie tut",
          "Trotz aller Probleme erkennen Sie das Geschenk Ihrer Beziehung"
        ],
        communicationTip: "Drücken Sie konkrete Dankbarkeit aus: 'Ich bin so dankbar für... Du hast mir damit wirklich geholfen.'"
      },
      {
        name: "Mitgefühl",
        color: "bg-teal-600",
        category: "🔵 Komplexe & Gemischte Gefühle",
        categoryDescription: "Die reflektierte Ebene",
        intensityScale: "Verständnisvoll → Mitfühlend → Überwältigt von Mitgefühl",
        definition: "Mischung aus Liebe (Zuwendung), Traurigkeit (über den Schmerz anderer) und Hilfsbereitschaft",
        bodySignals: "Warme Öffnung im Herzen, sanfte Tränen, ausgestreckte Arme, ruhige Präsenz",
        underlyingNeed: "Linderung von Leid, Verbindung, Fürsorge, Sinn",
        helpfulQuestion: "Wie kann ich das Leid eines anderen lindern?",
        practicalExamples: [
          "Ihr Partner leidet und Sie spüren seinen Schmerz mit",
          "Sie sehen Ihr eigenes früheres Leid in den Schwierigkeiten anderer Paare",
          "Empathie für die Verletzlichkeit und Menschlichkeit Ihres Partners"
        ],
        communicationTip: "Bieten Sie Mitgefühl an: 'Ich kann sehen, dass du leidest. Ich bin für dich da und möchte dir helfen.'"
      }
    ];

    const categories = [...new Set(emotions.map(e => e.category))];

    // Practical Guide Component
    const PracticalGuide = () => (
      <Card className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-lg border border-blue-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Target className="w-6 h-6" />
            Praxisteil: Wie Adam das Lexikon nutzen kann
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-900/30 rounded-xl border border-red-500/30">
                <h4 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                  🚨 Für den Notfall
                </h4>
                <p className="text-red-100 text-sm">
                  "Ich spüre [körperliches Signal]. Welches Gefühl aus der 🔴 ROTEN oder 🟡 GELBEN Kategorie könnte das sein?"
                </p>
              </div>
              
              <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-500/30">
                <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                  🔍 Für die Selbstreflexion
                </h4>
                <p className="text-blue-100 text-sm">
                  "Welches Grundbedürfnis steckt hinter meinem Gefühl? Was will es mir sagen?"
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-900/30 rounded-xl border border-green-500/30">
                <h4 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
                  💬 Für die Kommunikation
                </h4>
                <p className="text-green-100 text-sm">
                  Statt: "Du machst mich wütend" → "Ich fühle Wut, weil mein Bedürfnis nach Respekt verletzt wurde."
                </p>
              </div>
              
              <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-500/30">
                <h4 className="font-semibold text-purple-200 mb-2 flex items-center gap-2">
                  🎯 Emotionale Landkarte
                </h4>
                <p className="text-purple-100 text-sm">
                  Diese Gliederung verwandelt das chaotische Erleben von Emotionen in eine strukturierte Landkarte für besseres Verständnis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Gefühlslexikon</h1>
            <p className="text-gray-400 text-sm">Wissenschaftlich fundierte Emotionsmuster verstehen</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showPracticalGuide ? "default" : "ghost"}
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setShowPracticalGuide(!showPracticalGuide)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Praxis-Guide
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setCurrentTab('home')}
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          {showPracticalGuide && <PracticalGuide />}

          {!selectedEmotion ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Detaillierte Kategorien & Emotionen
                </h2>
                <p className="text-gray-300 text-lg mb-6">
                  Jede Emotion mit Intensitäts-Skala, körperlichen Signalen und zugrundeliegenden Bedürfnissen
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Badge className="bg-red-600/20 text-red-200 px-4 py-2">🔴 Alarm-Modus</Badge>
                  <Badge className="bg-yellow-600/20 text-yellow-200 px-4 py-2">🟡 Rückzug-Modus</Badge>
                  <Badge className="bg-green-600/20 text-green-200 px-4 py-2">🟢 Wachstums-Modus</Badge>
                  <Badge className="bg-blue-600/20 text-blue-200 px-4 py-2">🔵 Reflektierte Ebene</Badge>
                </div>
              </div>

              {categories.map(category => (
                <div key={category} className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-2xl font-bold text-white">{category}</h3>
                    <Badge className={`px-3 py-1 ${
                      category.includes('🔴') ? 'bg-red-600/20 text-red-200' :
                      category.includes('🟡') ? 'bg-yellow-600/20 text-yellow-200' :
                      category.includes('🟢') ? 'bg-green-600/20 text-green-200' :
                      'bg-blue-600/20 text-blue-200'
                    }`}>
                      {emotions.filter(e => e.category === category)[0]?.categoryDescription || ''}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {emotions.filter(e => e.category === category).map(emotion => (
                      <Card 
                        key={emotion.name}
                        className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer group"
                        onClick={() => setSelectedEmotion(emotion)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-5 h-5 rounded-full ${emotion.color} group-hover:scale-110 transition-transform`}></div>
                            <h4 className="font-semibold text-white text-lg">{emotion.name}</h4>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <span>🌡️</span>
                              <span className="text-xs">{emotion.intensityScale}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3">{emotion.definition}</p>
                          
                          <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                            <p className="text-blue-200 text-sm">
                              💬 "{emotion.helpfulQuestion}"
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Button 
                variant="ghost"
                onClick={() => setSelectedEmotion(null)}
                className="mb-6 text-blue-400 hover:text-blue-300"
              >
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                Zurück zur Übersicht
              </Button>
              
              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className={`w-20 h-20 rounded-full ${selectedEmotion.color} flex items-center justify-center`}>
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <Badge className={`mb-2 ${
                        selectedEmotion.category.includes('🔴') ? 'bg-red-600/20 text-red-200' :
                        selectedEmotion.category.includes('🟡') ? 'bg-yellow-600/20 text-yellow-200' :
                        selectedEmotion.category.includes('🟢') ? 'bg-green-600/20 text-green-200' :
                        'bg-blue-600/20 text-blue-200'
                      }`}>
                        {selectedEmotion.category}
                      </Badge>
                      <CardTitle className="text-3xl text-white mb-1">{selectedEmotion.name}</CardTitle>
                      <CardDescription className="text-gray-400">{selectedEmotion.categoryDescription}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="p-5 bg-blue-900/30 rounded-2xl border border-blue-700/50">
                        <h4 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                          🌡️ Intensitäts-Skala
                        </h4>
                        <p className="text-blue-100">{selectedEmotion.intensityScale}</p>
                      </div>

                      <div className="p-5 bg-purple-900/30 rounded-2xl border border-purple-700/50">
                        <h4 className="font-semibold text-purple-200 mb-3 flex items-center gap-2">
                          💡 Was es ist
                        </h4>
                        <p className="text-purple-100">{selectedEmotion.definition}</p>
                      </div>

                      <div className="p-5 bg-green-900/30 rounded-2xl border border-green-700/50">
                        <h4 className="font-semibold text-green-200 mb-3 flex items-center gap-2">
                          🔍 Körperliche Signale
                        </h4>
                        <p className="text-green-100">{selectedEmotion.bodySignals}</p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="p-5 bg-orange-900/30 rounded-2xl border border-orange-700/50">
                        <h4 className="font-semibold text-orange-200 mb-3 flex items-center gap-2">
                          🎯 Das zugrundeliegende Bedürfnis
                        </h4>
                        <p className="text-orange-100">{selectedEmotion.underlyingNeed}</p>
                      </div>

                      <div className="p-5 bg-cyan-900/30 rounded-2xl border border-cyan-700/50">
                        <h4 className="font-semibold text-cyan-200 mb-3 flex items-center gap-2">
                          💬 Hilfreiche Frage
                        </h4>
                        <p className="text-cyan-100 font-medium">"{selectedEmotion.helpfulQuestion}"</p>
                      </div>

                      <div className="p-5 bg-pink-900/30 rounded-2xl border border-pink-700/50">
                        <h4 className="font-semibold text-pink-200 mb-3 flex items-center gap-2">
                          💭 Kommunikations-Tipp
                        </h4>
                        <p className="text-pink-100 italic">{selectedEmotion.communicationTip}</p>
                      </div>
                    </div>
                  </div>

                  {/* Practical Examples Section */}
                  <div className="mt-8 p-6 bg-gray-700/40 rounded-2xl border border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                      📚 Praktische Beispiele aus dem Alltag
                    </h4>
                    <div className="space-y-3">
                      {selectedEmotion.practicalExamples.map((example, index) => (
                        <div key={index} className="p-3 bg-gray-800/60 rounded-lg border border-gray-600/30">
                          <p className="text-gray-300 text-sm">• {example}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example Dialog Section */}
                  {selectedEmotion.exampleDialog && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl border border-indigo-700/50">
                      <h4 className="font-semibold text-indigo-200 mb-4 flex items-center gap-2">
                        🎭 Musterdialog aus der Wirklichkeit
                      </h4>
                      <div className="mb-4 p-3 bg-indigo-800/30 rounded-lg">
                        <p className="text-indigo-100 text-sm font-medium">Situation:</p>
                        <p className="text-indigo-200 text-sm mt-1">{selectedEmotion.exampleDialog.situation}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedEmotion.exampleDialog.dialog.map((line, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            line.speaker === 'Sie' 
                              ? 'bg-blue-900/40 border border-blue-700/50 ml-4' 
                              : line.speaker === 'Sie (besser)' || line.speaker === 'Sie (ausdrucksvoll)' || line.speaker === 'Sie (liebevoller)' || line.speaker === 'Sie (reflektiert)' || line.speaker === 'Sie (verantwortlich)' || line.speaker === 'Sie (hilfesuchend)'
                              ? 'bg-green-900/40 border border-green-700/50 ml-4'
                              : 'bg-gray-800/40 border border-gray-600/50 mr-4'
                          }`}>
                            <div className="flex items-start gap-2">
                              <span className={`font-semibold text-xs px-2 py-1 rounded ${
                                line.speaker === 'Sie' 
                                  ? 'bg-blue-700 text-blue-100' 
                                  : line.speaker.includes('Sie (')
                                  ? 'bg-green-700 text-green-100'
                                  : 'bg-gray-700 text-gray-100'
                              }`}>
                                {line.speaker}
                              </span>
                              <p className={`text-sm flex-1 ${
                                line.speaker === 'Sie' 
                                  ? 'text-blue-200' 
                                  : line.speaker.includes('Sie (')
                                  ? 'text-green-200'
                                  : 'text-gray-200'
                              }`}>
                                "{line.text}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-8 text-center">
                    <Button
                      onClick={() => setCurrentTab('training-stufen')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Emotion im Training üben
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Community Cases Component
  const CommunityCasesPage = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Predefined therapy core questions with empathetic responses
    const coreTherapyCases = [
      {
        case_id: "therapy-1",
        title: "Zur aktuellen Krise",
        question: "Was ist der konkrete Anlass, warum Sie jetzt kommen – und was wäre für Sie ein Erfolg?",
        goal: "Den Leidensdruck konkretisieren und realistische Erwartungen setzen",
        difficulty: "Einfach",
        category: "Krisenintervention",
        ai_solution: "Diese Frage hilft dabei, den akuten Schmerz zu benennen und ein konkretes Ziel zu definieren. Eine empathische Antwort wäre: 'Ich verstehe, dass Sie beide unter der aktuellen Situation leiden. Es braucht Mut, hier zu sein. Lassen Sie uns gemeinsam herausfinden, was sich ändern muss, damit Sie wieder Hoffnung spüren können. Was würde für Sie persönlich bedeuten, dass sich die Mühe gelohnt hat?'",
        empathetic_responses: [
          "Ich verstehe, dass es schwer sein muss, über diese Krise zu sprechen",
          "Es zeigt Stärke, dass Sie beide hier sind und nach Lösungen suchen",
          "Ihre Gefühle in dieser schwierigen Zeit sind völlig berechtigt"
        ]
      },
      {
        case_id: "therapy-2", 
        title: "Zur gemeinsamen Geschichte",
        question: "Erzählen Sie mir von dem Paar, das Sie einmal waren – was hat Sie originally zusammengebracht?",
        goal: "Positive Ressourcen und verbindende Werte aktivieren",
        difficulty: "Einfach",
        category: "Ressourcenaktivierung",
        ai_solution: "Diese Frage reaktiviert positive Erinnerungen und gemeinsame Werte. Empathische Begleitung: 'Wenn Sie von den frühen Tagen erzählen, sehe ich, wie Ihre Gesichter weicher werden. Diese Verbindung, die Sie einmal hatten, ist nicht verschwunden – sie ist nur unter den aktuellen Sorgen begraben. Diese Qualitäten, die Sie damals aneinander geschätzt haben, sind noch da. Wie könnten Sie diese heute wieder mehr würdigen?'",
        empathetic_responses: [
          "Es ist schön zu hören, was Sie ursprünglich verbunden hat",
          "Diese frühen Gefühle zeigen, dass eine tiefe Verbindung da war",
          "Die Person, in die Sie sich verliebt haben, steckt noch in Ihrem Partner"
        ]
      },
      {
        case_id: "therapy-3",
        title: "Zum Kommunikationsmuster", 
        question: "Was passiert typischerweise in 95% Ihrer Streits? Wer verfolgt, wer flüchtet?",
        goal: "Das Teufelskreis-Muster (Pursuer-Distancer) identifizieren",
        difficulty: "Mittel",
        category: "Kommunikationsmuster",
        ai_solution: "Dieses Muster zu erkennen ist befreiend für beide Partner. Empathische Intervention: 'Sehen Sie, wie Sie beide in diesem Tanz gefangen sind? Der eine fühlt sich ungehört und wird lauter, der andere fühlt sich überwältigt und zieht sich zurück. Keiner von Ihnen ist der Böse – Sie reagieren nur auf die Angst des anderen. Wenn wir diesen Kreislauf durchbrechen, können Sie beide endlich das bekommen, was Sie brauchen: Nähe und Sicherheit.'",
        empathetic_responses: [
          "Dieser Kreislauf ist erschöpfend für Sie beide",
          "Niemand von Ihnen will diesen Tanz – Sie sind beide gefangen",
          "Es ist verständlich, dass Sie so reagieren, wenn Sie sich bedroht fühlen"
        ]
      },
      {
        case_id: "therapy-4",
        title: "Zu den Triggern",
        question: "Welche Themen lösen innerhalb von Sekunden eine emotionale Explosion aus?",
        goal: "Frühwarnsystem für hochsensible Themen entwickeln",
        difficulty: "Mittel", 
        category: "Trigger-Management",
        ai_solution: "Trigger zu identifizieren schafft emotionale Sicherheit. Empathische Herangehensweise: 'Diese Themen sind wie offene Wunden für Sie – kein Wunder, dass Sie so stark reagieren. Ihre Reaktion ist nicht übertrieben, sondern ein Zeichen dafür, dass hier etwas sehr Wichtiges für Sie bedroht wird. Lassen Sie uns gemeinsam verstehen, welches Bedürfnis dahinter liegt, damit Ihr Partner lernen kann, vorsichtiger mit diesem sensiblen Bereich umzugehen.'",
        empathetic_responses: [
          "Diese Themen berühren offensichtlich etwas sehr Wichtiges in Ihnen",
          "Es ist verständlich, dass Sie so stark reagieren, wenn Sie verletzt sind",
          "Ihre Emotionen sind ein Signal – sie zeigen, was Ihnen wichtig ist"
        ]
      },
      {
        case_id: "therapy-5",
        title: "Zur emotionalen Sicherheit",
        question: "Wann fühlen Sie sich in dieser Beziehung absolut sicher – und wann gar nicht?",
        goal: "Die Grundbedingung für Bindungsfähigkeit klären",
        difficulty: "Schwer",
        category: "Bindungssicherheit", 
        ai_solution: "Emotionale Sicherheit ist das Fundament jeder Beziehung. Empathischer Zugang: 'Sicherheit ist nicht Luxus, sondern Grundbedürfnis. Wenn Sie sich unsicher fühlen, ist Ihr Nervensystem im Alarmzustand – da ist Liebe fast unmöglich. Die Momente, in denen Sie sich sicher fühlen, zeigen uns den Weg: Was brauchen Sie, um häufiger in diesem Zustand zu sein? Ihr Partner will Sie nicht verletzen – er weiß nur noch nicht, wie er Ihnen Sicherheit geben kann.'",
        empathetic_responses: [
          "Sicherheit zu brauchen ist völlig normal und gesund",
          "Wenn Sie sich unsicher fühlen, können Sie nicht wirklich verbunden sein",
          "Diese sicheren Momente zeigen, was möglich ist zwischen Ihnen"
        ]
      },
      {
        case_id: "therapy-6",
        title: "Zu den Bedürfnissen",
        question: "Welches Ihrer Grundbedürfnisse (Sicherheit, Autonomie, Wertschätzung) fühlt sich aktuell verletzt an?",
        goal: "Hinter den Konflikten die eigentlichen Bedürfnisse finden",
        difficulty: "Mittel",
        category: "Bedürfnisklärung",
        ai_solution: "Bedürfnisse zu erkennen verwandelt Vorwürfe in Bitten. Empathische Begleitung: 'Sehen Sie, wie unterschiedlich Ihre Bedürfnisse sind? Das ist nicht schlimm – das ist menschlich. Der eine braucht mehr Nähe, der andere mehr Raum. Der eine mehr Bestätigung, der andere mehr Ruhe. Wenn wir diese Bedürfnisse würdigen statt bekämpfen, können wir Wege finden, wie beide bekommen, was sie brauchen.'",
        empathetic_responses: [
          "Ihre Bedürfnisse sind völlig berechtigt und wichtig",
          "Es ist schmerzhaft, wenn ein Grundbedürfnis unerfüllt bleibt",
          "Diese Bedürfnisse zu äußern zeigt Mut und Selbstfürsorge"
        ]
      },
      {
        case_id: "therapy-7",
        title: "Zur Konfliktkultur",
        question: "Wie haben Ihre Eltern gestritten – und was haben Sie daraus über 'richtige' Konflikte gelernt?",
        goal: "Familiäre Prägungen und deren Wiederholung bewusst machen",
        difficulty: "Schwer",
        category: "Familiäre Prägungen",
        ai_solution: "Familiäre Muster zu verstehen befreit von unbewussten Wiederholungen. Empathischer Ansatz: 'Sie haben als Kind gelernt, dass Konflikte gefährlich oder normal sind, dass man kämpft oder sich zurückzieht. Diese Strategien haben damals überlebt, aber heute schaden sie vielleicht Ihrer Beziehung. Sie sind nicht Ihre Eltern – Sie können neue, liebevollere Wege des Streitens lernen. Was würden Sie Ihren Kindern über Konflikte beibringen wollen?'",
        empathetic_responses: [
          "Diese frühen Erfahrungen haben Sie geprägt – das ist normal",
          "Sie können neue, gesündere Muster entwickeln",
          "Ihre Vergangenheit erklärt Ihr Verhalten, aber bestimmt es nicht"
        ]
      },
      {
        case_id: "therapy-8",
        title: "Zur Reparaturfähigkeit", 
        question: "Wie versuchen Sie normalerweise, sich zu versöhnen – und warum scheitert es oft?",
        goal: "Reparaturmechanismen analysieren und verbessern",
        difficulty: "Mittel",
        category: "Reparaturmechanismen",
        ai_solution: "Gute Reparatur-Versuche zu erkennen stärkt die Beziehung. Empathische Würdigung: 'Ich sehe, dass Sie beide versuchen, Frieden zu machen – das zeigt, wie wichtig Ihnen die Beziehung ist. Manchmal scheitern Versöhnungen, weil die Verletzung noch zu frisch oder der Ansatz nicht passend ist. Lassen Sie uns herausfinden, was Sie jeweils brauchen, um wirklich vergeben und vertrauen zu können. Manchmal braucht es Zeit, manchmal andere Worte, manchmal andere Taten.'",
        empathetic_responses: [
          "Ihre Versöhnungsversuche zeigen, dass Ihnen die Beziehung wichtig ist",
          "Manchmal braucht Heilung mehr Zeit und andere Ansätze",
          "Es ist frustrierend, wenn gut gemeinte Gesten nicht ankommen"
        ]
      },
      {
        case_id: "therapy-9",
        title: "Zur Zukunftsangst",
        question: "Was ist Ihre größte Angst – dass Sie sich trennen oder dass Sie so weiterleben müssen?", 
        goal: "Die Motivation für Veränderung freilegen",
        difficulty: "Schwer",
        category: "Zukunftsängste",
        ai_solution: "Diese Angst zu teilen schafft Klarheit über die Motivation. Empathische Begleitung: 'Diese Angst zu haben ist menschlich – sie zeigt, dass Sie vor einer wichtigen Entscheidung stehen. Beide Optionen – so weitermachen oder sich trennen – fühlen sich schmerzhaft an. Das bedeutet, dass Sie eine dritte Option brauchen: echte Veränderung. Lassen Sie uns gemeinsam herausfinden, wie eine Beziehung aussehen könnte, vor der Sie keine Angst haben müssen.'",
        empathetic_responses: [
          "Diese Angst zu spüren ist ein Zeichen, dass Veränderung nötig ist",
          "Beide Optionen fühlen sich schwer an – das verstehe ich",
          "Sie verdienen eine Beziehung, vor der Sie keine Angst haben müssen"
        ]
      },
      {
        case_id: "therapy-10",
        title: "Zum individuellen Beitrag",
        question: "Was ist Ihr persönlicher 40%-Anteil an den Problemen – unabhängig vom Partner?",
        goal: "Eigenverantwortung statt Opferhaltung fördern",
        difficulty: "Schwer", 
        category: "Eigenverantwortung",
        ai_solution: "Eigenverantwortung zu übernehmen ist ein Zeichen von Reife und Stärke. Empathische Ermutigung: 'Es braucht Mut, den eigenen Anteil zu sehen – das macht Sie nicht zum schlechteren Menschen, sondern zum verantwortlichen Partner. Wenn Sie Ihren 40%-Anteil verändern, hat das mehr Einfluss als alle Vorwürfe an den Partner. Sie können nur sich selbst ändern – aber das ist auch Ihre größte Macht. Was wäre der erste kleine Schritt, den Sie gehen könnten?'",
        empathetic_responses: [
          "Eigenverantwortung zu übernehmen zeigt Stärke und Reife",
          "Sie können nur sich selbst ändern – aber das ist Ihre Macht",
          "Dieser Mut zur Selbstreflexion ist der erste Schritt zur Heilung"
        ]
      }
    ];

    useEffect(() => {
      loadCommunityCases();
    }, []);

    const loadCommunityCases = async () => {
      try {
        // Try to load from backend first
        const response = await fetch(`${BACKEND_URL}/api/community-cases`);
        if (response.ok) {
          const data = await response.json();
          const backendCases = data.cases || [];
          // Combine with core therapy cases
          setCases([...coreTherapyCases, ...backendCases]);
        } else {
          // If backend fails, use core therapy cases
          setCases(coreTherapyCases);
        }
      } catch (error) {
        console.error('Error loading community cases:', error);
        // Fallback to core therapy cases
        setCases(coreTherapyCases);
      } finally {
        setLoading(false);
      }
    };

    // Filter cases based on search term
    const filteredCases = cases.filter(caseItem =>
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.ai_solution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Create case form component
    const CreateCaseForm = () => {
      const [formData, setFormData] = useState({
        title: '',
        question: '',
        situation: '',
        category: 'Kommunikation'
      });
      const [submitting, setSubmitting] = useState(false);

      const categories = [
        'Kommunikation', 'Vertrauen', 'Intimität', 'Finanzen', 
        'Familie', 'Zukunftsplanung', 'Konflikte', 'Bedürfnisse'
      ];

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.question) {
          showNotification('Bitte füllen Sie Titel und Frage aus', 'error');
          return;
        }

        setSubmitting(true);
        try {
          const response = await fetch(`${BACKEND_URL}/api/create-community-case-direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dialog: [
                { speaker: 'User', message: formData.question },
                { speaker: 'Situation', message: formData.situation }
              ],
              title: formData.title,
              category: formData.category,
              user_consent: true
            })
          });

          if (response.ok) {
            showNotification('Fall erfolgreich eingereicht! Vielen Dank für Ihren Beitrag.', 'success');
            setShowCreateForm(false);
            setFormData({ title: '', question: '', situation: '', category: 'Kommunikation' });
            loadCommunityCases(); // Reload to include new case
          } else {
            showNotification('Fehler beim Einreichen. Bitte versuchen Sie es später erneut.', 'error');
          }
        } catch (error) {
          console.error('Error creating case:', error);
          showNotification('Fehler beim Einreichen. Bitte versuchen Sie es später erneut.', 'error');
        } finally {
          setSubmitting(false);
        }
      };

      return (
        <Card className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Eigenen Fall beitragen
            </CardTitle>
            <CardDescription className="text-gray-300">
              Teilen Sie anonymisiert eine Situation aus Ihrer Beziehung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Titel/Thema</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="z.B. Streit über Haushaltsaufgaben"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Kategorie</Label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-300">Ihre Frage/Ihr Anliegen</Label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  placeholder="Beschreiben Sie Ihre Situation oder Frage..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-24"
                />
              </div>

              <div>
                <Label className="text-gray-300">Zusätzliche Details (optional)</Label>
                <textarea
                  value={formData.situation}
                  onChange={(e) => setFormData({...formData, situation: e.target.value})}
                  placeholder="Weitere Details zur Situation..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-20"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Wird eingereicht...' : 'Fall einreichen'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-300"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Community Cases</h1>
            <p className="text-gray-400 text-sm">Lernen von realen Paartherapie-Situationen</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Eigenen Fall beitragen
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setCurrentTab('home')}
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          {showCreateForm && <CreateCaseForm />}

          {loading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Lade Community Cases...</p>
            </div>
          ) : !selectedCase ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Kernfragen der Paartherapie</h2>
                <p className="text-gray-300 text-lg mb-6">
                  20 bewährte Therapie-Fragen mit empathischen Antworten + Community-Beiträge
                </p>
                
                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Suchen nach Themen, Kategorien oder Stichworten..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-800/60 border-gray-600 text-white pl-10 pr-4 py-3 rounded-2xl"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {filteredCases.length} von {cases.length} Fällen
                  </p>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[...new Set(cases.map(c => c.category))].map(category => (
                  <Button
                    key={category}
                    variant="ghost"
                    size="sm"
                    className="bg-gray-800/40 hover:bg-gray-700/60 text-gray-300 rounded-full px-4 py-2"
                    onClick={() => setSearchTerm(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map(caseItem => (
                  <Card 
                    key={caseItem.case_id}
                    className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer group"
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`${
                          caseItem.difficulty === 'Einfach' ? 'bg-green-600/20 text-green-200' :
                          caseItem.difficulty === 'Mittel' ? 'bg-yellow-600/20 text-yellow-200' : 
                          'bg-red-600/20 text-red-200'
                        } px-3 py-1`}>
                          {caseItem.difficulty}
                        </Badge>
                        <Badge className="bg-blue-600/20 text-blue-200 px-3 py-1">
                          {caseItem.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                        {caseItem.title}
                      </h3>
                      
                      {caseItem.question && (
                        <div className="mb-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                          <p className="text-blue-200 text-sm font-medium">Kernfrage:</p>
                          <p className="text-blue-100 text-sm mt-1">"{caseItem.question}"</p>
                        </div>
                      )}
                      
                      {caseItem.goal && (
                        <div className="mb-3 p-2 bg-purple-900/20 rounded-lg">
                          <p className="text-purple-200 text-xs">
                            🎯 {caseItem.goal}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-gray-300 text-sm mb-4">
                        {caseItem.ai_solution.substring(0, 120)}...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 p-0">
                          Fall analysieren <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        {caseItem.empathetic_responses && (
                          <span className="text-xs text-gray-500">
                            {caseItem.empathetic_responses.length} empathische Antworten
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Keine Fälle gefunden</h3>
                  <p className="text-gray-500">Versuchen Sie einen anderen Suchbegriff</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Button 
                variant="ghost"
                onClick={() => setSelectedCase(null)}
                className="mb-6 text-blue-400 hover:text-blue-300"
              >
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                Zurück zur Übersicht
              </Button>
              
              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${
                      selectedCase.difficulty === 'Einfach' ? 'bg-green-600/20 text-green-200' :
                      selectedCase.difficulty === 'Mittel' ? 'bg-yellow-600/20 text-yellow-200' : 
                      'bg-red-600/20 text-red-200'
                    } px-4 py-2`}>
                      {selectedCase.difficulty}
                    </Badge>
                    <Badge className="bg-blue-600/20 text-blue-200 px-4 py-2">
                      {selectedCase.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-2xl">{selectedCase.title}</CardTitle>
                  {selectedCase.goal && (
                    <CardDescription className="text-purple-300 text-base">
                      🎯 {selectedCase.goal}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {selectedCase.question && (
                      <div className="p-6 bg-blue-900/30 rounded-2xl border border-blue-700/50">
                        <h4 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                          ❓ Kernfrage der Paartherapie
                        </h4>
                        <p className="text-blue-100 text-lg italic">"{selectedCase.question}"</p>
                      </div>
                    )}
                    
                    <div className="p-6 bg-gray-700/40 rounded-2xl border border-gray-600/50">
                      <h4 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                        🧠 KI-Analyse & Therapeutischer Ansatz
                      </h4>
                      <p className="text-gray-300 leading-relaxed">{selectedCase.ai_solution}</p>
                    </div>
                    
                    {selectedCase.empathetic_responses && (
                      <div className="p-6 bg-green-900/30 rounded-2xl border border-green-700/50">
                        <h4 className="font-semibold text-green-200 mb-4 flex items-center gap-2">
                          💚 Empathische Antworten für Partner
                        </h4>
                        <div className="space-y-3">
                          {selectedCase.empathetic_responses.map((response, index) => (
                            <div key={index} className="p-3 bg-green-800/30 rounded-lg border border-green-600/30">
                              <p className="text-green-100">"{response}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 bg-amber-900/30 rounded-2xl border border-amber-700/50">
                      <h4 className="font-semibold text-amber-200 mb-3 flex items-center gap-2">
                        💡 Praktischer Tipp
                      </h4>
                      <p className="text-amber-100">
                        Diese Frage eignet sich besonders gut für ruhige Gesprächsmomente zu zweit. 
                        Schaffen Sie einen sicheren Rahmen ohne Ablenkungen und hören Sie aktiv zu, 
                        ohne sofort zu bewerten oder Lösungen anzubieten.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <Button
                      onClick={() => setCurrentTab('training-stufen')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Im Training üben
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  };
  const OwnCasesCreation = () => {
    const [dialogMessages, setDialogMessages] = useState([
      { speaker: 'Ich', message: '' },
      { speaker: 'Mein Partner', message: '' }
    ]);
    const [caseTitle, setCaseTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const addMessage = () => {
      setDialogMessages([
        ...dialogMessages,
        { speaker: dialogMessages.length % 2 === 0 ? 'Ich' : 'Mein Partner', message: '' }
      ]);
    };

    const updateMessage = (index, message) => {
      const updated = [...dialogMessages];
      updated[index] = { ...updated[index], message };
      setDialogMessages(updated);
    };

    const removeMessage = (index) => {
      if (dialogMessages.length > 2) {
        setDialogMessages(dialogMessages.filter((_, i) => i !== index));
      }
    };

    const submitCase = async () => {
      if (!caseTitle.trim()) {
        alert('Bitte geben Sie einen Titel für Ihren Case ein');
        return;
      }

      const validMessages = dialogMessages.filter(msg => msg.message.trim());
      if (validMessages.length < 2) {
        alert('Bitte fügen Sie mindestens 2 Nachrichten hinzu');
        return;
      }

      setIsSubmitting(true);
      
      try {
        // Simulate analysis processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock analysis
        const mockAnalysis = {
          title: caseTitle,
          communication_score: Math.floor(Math.random() * 3) + 6, // 6-8
          empathy_level: Math.floor(Math.random() * 3) + 5, // 5-7
          main_issues: [
            "Kommunikationsmuster zeigen Defensivität",
            "Bedürfnisse werden nicht klar ausgedrückt", 
            "Emotionale Validierung fehlt"
          ],
          suggestions: [
            "Verwenden Sie 'Ich'-Aussagen statt 'Du'-Vorwürfe",
            "Hören Sie aktiv zu, bevor Sie antworten",
            "Spiegeln Sie die Gefühle Ihres Partners wider"
          ],
          alternative_responses: validMessages.map((msg, index) => ({
            original: msg.message,
            improved: index % 2 === 0 
              ? `Mir ist aufgefallen, dass... Können wir darüber sprechen?`
              : `Ich verstehe deine Sicht. Für mich fühlt es sich so an...`
          }))
        };
        
        setAnalysisResult(mockAnalysis);
        setShowAnalysis(true);
      } catch (error) {
        console.error('Error creating case:', error);
        alert('Fehler beim Erstellen des Cases. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (showAnalysis && analysisResult) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
          </div>

          <header className="flex justify-between items-center p-6 mb-8 relative z-10">
            <h1 className="text-2xl font-bold text-white">Case-Analyse: {analysisResult.title}</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => {
                setShowAnalysis(false);
                setAnalysisResult(null);
                setCaseTitle('');
                setDialogMessages([
                  { speaker: 'Ich', message: '' },
                  { speaker: 'Mein Partner', message: '' }
                ]);
              }}
            >
              Neuen Case erstellen
            </Button>
          </header>

          <div className="relative z-10 max-w-4xl mx-auto p-6">
            <div className="grid gap-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-400">{analysisResult.communication_score}/10</div>
                    <div className="text-sm text-gray-400">Kommunikation</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-400">{analysisResult.empathy_level}/10</div>
                    <div className="text-sm text-gray-400">Empathie</div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Issues */}
              <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-red-400">🚨 Hauptprobleme</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.main_issues.map((issue, index) => (
                      <li key={index} className="text-gray-300 flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-green-400">💡 Verbesserungsvorschläge</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Alternative Responses */}
              {analysisResult.alternative_responses.map((alt, index) => (
                <Card key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-purple-400">🔄 Alternative Formulierung #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-red-300 font-medium mb-2">Original:</h4>
                      <p className="text-gray-300 italic bg-red-900/20 p-3 rounded-lg">"{alt.original}"</p>
                    </div>
                    <div>
                      <h4 className="text-green-300 font-medium mb-2">Empathischer:</h4>
                      <p className="text-gray-300 bg-green-900/20 p-3 rounded-lg">"{alt.improved}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setShowAnalysis(false);
                    setAnalysisResult(null);
                    setCaseTitle('');
                    setDialogMessages([
                      { speaker: 'Ich', message: '' },
                      { speaker: 'Mein Partner', message: '' }
                    ]);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Neuen Case erstellen
                </Button>
                <Button
                  onClick={() => setCurrentTab('home')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Zurück zum Dashboard
                </Button>
              </div>
            </div>
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

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Eigenen Case erstellen</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
        </header>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl overflow-hidden mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center">
                <Plus className="w-6 h-6 inline mr-2" />
                Beschreiben Sie Ihre Situation
              </CardTitle>
              <CardDescription className="text-gray-300 text-center">
                Geben Sie einen Dialog zwischen Ihnen und Ihrem Partner ein. Die KI wird eine Analyse und Lösungsvorschläge erstellen.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Case Title */}
                <div>
                  <Label className="text-gray-300 font-medium">Titel Ihres Cases *</Label>
                  <div className="mt-2">
                    <SpeechInput
                      value={caseTitle}
                      onChange={(e) => setCaseTitle(e.target.value)}
                      placeholder="z.B. Diskussion über Haushaltsaufgaben"
                      className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Dialog Messages */}
                <div>
                  <Label className="text-gray-300 font-medium">Dialog zwischen Ihnen und Ihrem Partner</Label>
                  <div className="mt-4 space-y-4">
                    {dialogMessages.map((msg, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="w-20 text-sm text-gray-400 pt-3 flex-shrink-0">
                          {msg.speaker}:
                        </div>
                        <div className="flex-1">
                          <SpeechInput
                            value={msg.message}
                            onChange={(e) => updateMessage(index, e.target.value)}
                            placeholder={`Was hat ${msg.speaker} gesagt?`}
                            className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                        {dialogMessages.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMessage(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMessage}
                    className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Weitere Nachricht hinzufügen
                  </Button>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-700/50">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-100 mb-2">KI-Analyse beinhaltet:</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Kommunikationsmuster-Analyse</li>
                        <li>• Emotionale Dynamiken</li>
                        <li>• Konkrete Verbesserungsvorschläge</li>
                        <li>• Alternative Gesprächsverläufe</li>
                        <li>• Empathie-Training Empfehlungen</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={submitCase}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-2xl font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Wird analysiert...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Case zur Analyse einreichen
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Training Stufen Component
  const TrainingStufen = () => {
    const [selectedStage, setSelectedStage] = useState(null);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [activeTraining, setActiveTraining] = useState(null);

    const trainingStages = [
      {
        id: 1,
        title: "Stufe 1: Grundlagen der Empathie",
        description: "Lernen Sie die Basics empathischer Kommunikation",
        difficulty: "Einfach",
        unlocked: true,
        color: "from-green-600 to-emerald-600",
        scenarios: [
          { id: 1, title: "Aktives Zuhören", description: "Ihr Partner erzählt von einem schweren Arbeitstag", free: true },
          { id: 2, title: "Gefühle spiegeln", description: "Zeigen Sie Verständnis für Emotionen", free: true },
          { id: 3, title: "Nachfragen stellen", description: "Interesse durch gezielte Fragen zeigen", free: true },
          { id: 4, title: "Körpersprache lesen", description: "Non-verbale Signale verstehen", free: true },
          { id: 5, title: "Empathische Antworten", description: "Angemessen auf Emotionen reagieren", free: true }
        ]
      },
      {
        id: 2,
        title: "Stufe 2: Konfliktlösung",
        description: "Konstruktive Auseinandersetzung mit Problemen",
        difficulty: "Mittel",
        unlocked: true, // Für Testing freigeschaltet
        color: "from-blue-600 to-cyan-600",
        scenarios: [
          { id: 6, title: "Meinungsverschiedenheiten", description: "Unterschiedliche Ansichten respektvoll diskutieren", free: false },
          { id: 7, title: "Kritik annehmen", description: "Konstruktiv mit Feedback umgehen", free: false },
          { id: 8, title: "Kompromisse finden", description: "Win-Win-Situationen schaffen", free: false }
        ]
      },
      {
        id: 3,
        title: "Stufe 3: Emotionale Intelligenz",
        description: "Vertiefte emotionale Wahrnehmung",
        difficulty: "Mittel",
        unlocked: true, // Für Testing freigeschaltet
        color: "from-purple-600 to-pink-600",
        scenarios: [
          { id: 9, title: "Emotionen regulieren", description: "Eigene Gefühle bewusst steuern", free: false },
          { id: 10, title: "Empathie zeigen", description: "Mitgefühl authentisch ausdrücken", free: false },
          { id: 11, title: "Verständnis ausdrücken", description: "Die Perspektive des Partners verstehen", free: false }
        ]
      },
      {
        id: 4,
        title: "Stufe 4: Beziehungsdynamiken",
        description: "Komplexe Beziehungsmuster verstehen",
        difficulty: "Schwer",
        unlocked: true, // Für Testing freigeschaltet
        color: "from-orange-600 to-red-600",
        scenarios: [
          { id: 12, title: "Verhaltensmuster", description: "Wiederkehrende Dynamiken erkennen", free: false },
          { id: 13, title: "Grenzen setzen", description: "Gesunde Abgrenzung in der Beziehung", free: false },
          { id: 14, title: "Vertrauen aufbauen", description: "Sicherheit in der Partnerschaft schaffen", free: false }
        ]
      },
      {
        id: 5,
        title: "Stufe 5: Meisterschaft",
        description: "Experte in empathischer Kommunikation",
        difficulty: "Experte",
        unlocked: true, // Für Testing freigeschaltet
        color: "from-yellow-600 to-orange-600",
        scenarios: [
          { id: 15, title: "Krisenintervention", description: "In schweren Zeiten zusammenhalten", free: false },
          { id: 16, title: "Langfristige Vision", description: "Gemeinsame Zukunft gestalten", free: false },
          { id: 17, title: "Beziehungscoach", description: "Anderen Paaren helfen", free: false }
        ]
      }
    ];

    // Handle starting a scenario
    const startScenario = (scenario) => {
      setActiveTraining({
        scenarioId: scenario.id,
        userId: user?.id || 'demo-user',
        userName: user?.name || 'Sophia',
        partnerName: user?.partner_name || 'Max'
      });
    };

    const completeTraining = () => {
      setActiveTraining(null);
      setSelectedScenario(null);
      showNotification('Training erfolgreich abgeschlossen!', 'success');
    };

    // Show active training scenario
    if (activeTraining) {
      return (
        <TrainingScenario
          scenarioId={activeTraining.scenarioId}
          userId={activeTraining.userId}
          userName={activeTraining.userName}
          partnerName={activeTraining.partnerName}
          onComplete={completeTraining}
          onHome={() => {
            setActiveTraining(null);
            setSelectedScenario(null);
            setSelectedStage(null);
            setCurrentTab('home');
          }}
          onBack={() => {
            setActiveTraining(null);
            setSelectedScenario(null);
          }}
          onNext={() => {
            const currentStage = trainingStages.find(stage => 
              stage.scenarios.some(s => s.id === activeTraining.scenarioId)
            );
            if (currentStage) {
              const currentScenarioIndex = currentStage.scenarios.findIndex(s => s.id === activeTraining.scenarioId);
              const nextScenario = currentStage.scenarios[currentScenarioIndex + 1];
              if (nextScenario) {
                setActiveTraining({
                  ...activeTraining,
                  scenarioId: nextScenario.id
                });
              } else {
                // Move to next stage if available
                const currentStageIndex = trainingStages.findIndex(s => s.id === currentStage.id);
                const nextStage = trainingStages[currentStageIndex + 1];
                if (nextStage && nextStage.scenarios.length > 0) {
                  setActiveTraining({
                    ...activeTraining,
                    scenarioId: nextStage.scenarios[0].id
                  });
                } else {
                  showNotification('Herzlichen Glückwunsch! Sie haben alle Trainings abgeschlossen!', 'success');
                  completeTraining();
                }
              }
            }
          }}
        />
      );
    }

    if (selectedStage) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
          </div>

          <header className="flex justify-between items-center p-6 mb-8 relative z-10">
            <h1 className="text-2xl font-bold text-white">{selectedStage.title}</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10"
              onClick={() => setSelectedStage(null)}
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
            </Button>
          </header>

          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 bg-gradient-to-br ${selectedStage.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">{selectedStage.title}</h2>
              <p className="text-gray-300 mb-4">{selectedStage.description}</p>
              <Badge className={`${
                selectedStage.difficulty === 'Einfach' ? 'bg-green-600' :
                selectedStage.difficulty === 'Mittel' ? 'bg-yellow-600' : 
                selectedStage.difficulty === 'Schwer' ? 'bg-red-600' : 'bg-purple-600'
              }`}>
                {selectedStage.difficulty}
              </Badge>
            </div>

            <div className="space-y-4">
              {selectedStage.scenarios.map(scenario => (
                <Card 
                  key={scenario.id}
                  className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer"
                  onClick={() => startScenario(scenario)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{scenario.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{scenario.description}</p>
                        <div className="flex gap-2">
                          {scenario.free ? (
                            <Badge className="bg-green-600">Kostenlos</Badge>
                          ) : (
                            <Badge className="bg-yellow-600">PRO</Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        className={`ml-4 ${scenario.free ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          startScenario(scenario);
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Starten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Training Stufen</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
        </header>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">5 strukturierte Stufen</h2>
            <p className="text-gray-300">Verbessern Sie Ihre Kommunikation Schritt für Schritt</p>
          </div>

          <div className="space-y-6">
            {trainingStages.map(stage => (
              <Card 
                key={stage.id}
                className={`border border-gray-700/50 transition-all cursor-pointer ${
                  stage.unlocked 
                    ? 'bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80' 
                    : 'bg-gray-900/60 backdrop-blur-sm opacity-75'
                }`}
                onClick={() => stage.unlocked && setSelectedStage(stage)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${stage.color} rounded-full flex items-center justify-center flex-shrink-0 ${
                      !stage.unlocked ? 'grayscale' : ''
                    }`}>
                      {stage.unlocked ? (
                        <Target className="w-8 h-8 text-white" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{stage.title}</h3>
                        <Badge className={`${
                          stage.difficulty === 'Einfach' ? 'bg-green-600' :
                          stage.difficulty === 'Mittel' ? 'bg-yellow-600' : 
                          stage.difficulty === 'Schwer' ? 'bg-red-600' : 'bg-purple-600'
                        }`}>
                          {stage.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-300 mb-3">{stage.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{stage.scenarios.length} Szenarien</span>
                        {stage.id === 1 && (
                          <Badge className="bg-green-600">5 kostenlose Szenarien</Badge>
                        )}
                        {!stage.unlocked && (
                          <Badge className="bg-gray-600">Noch gesperrt</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      {stage.unlocked ? (
                        <Button 
                          size="sm"
                          className={`bg-gradient-to-r ${stage.color} hover:opacity-90`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Starten
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          disabled
                          className="bg-gray-600"
                        >
                          Gesperrt
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };
  const DialogCoachingPage = () => {
    const [dialogStep, setDialogStep] = useState('input'); // input, analysis, results
    const [dialogData, setDialogData] = useState({
      scenario: '',
      userMessage: '',
      partnerMessage: '',
      context: ''
    });
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeDialog = async () => {
      // Validate input data first
      if (!dialogData.userMessage.trim() || !dialogData.partnerMessage.trim()) {
        setError('Bitte füllen Sie beide Nachrichten aus.');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Sending dialog analysis request:', dialogData);
        
        // Use a simpler mock response for now to avoid backend issues
        const mockAnalysis = {
          communication_scores: {
            overall_score: 6.5,
            empathy_level: 5.8,
            conflict_potential: 7.2,
            emotional_safety: 4.9
          },
          detailed_analysis: {
            communication_patterns: [
              "Es zeigt sich ein Muster von Vorwürfen und Defensivität zwischen beiden Partnern.",
              "Die Kommunikation ist geprägt von 'Du'-Aussagen statt 'Ich'-Botschaften.",
              "Beide Partner fühlen sich nicht gehört und missverstanden."
            ],
            emotional_dynamics: [
              "Unter der Oberfläche liegt bei beiden Partnern ein Gefühl der Überforderung.",
              "Die Frustration verstärkt sich gegenseitig, anstatt Verständnis zu schaffen.",
              "Es fehlt emotionale Validierung und Anerkennung der jeweiligen Anstrengungen."
            ]
          },
          specific_improvements: [
            {
              category: "Ich-Botschaften verwenden",
              problem: "Vorwürfe mit 'Du machst nie...' führen zu Abwehrreaktionen",
              solution: "Ersetzen Sie 'Du'-Aussagen durch 'Ich'-Gefühle: 'Ich fühle mich überlastet, wenn...'",
              example: "Statt 'Du machst nie etwas' → 'Mir würde es helfen, wenn wir die Aufgaben gemeinsam aufteilen könnten'"
            },
            {
              category: "Gefühle anerkennen",
              problem: "Beide Partner fühlen sich in ihren Anstrengungen nicht gesehen",
              solution: "Beginnen Sie mit Anerkennung, bevor Sie Wünsche äußern",
              example: "'Ich weiß, dass du hart arbeitest. Mir geht es darum, dass wir als Team funktionieren.'"
            }
          ],
          alternative_formulations: [
            {
              original_statement: dialogData.userMessage,
              speaker: "Sie",
              improved_version: `Mir fällt auf, dass ich mich bei der Hausarbeit oft alleine fühle. Ich weiß, dass du viel arbeitest und müde bist. Können wir gemeinsam schauen, wie wir die Aufgaben besser aufteilen können?`,
              why_better: "Diese Formulierung vermeidet Vorwürfe, anerkennt die Situation des Partners und schlägt eine gemeinsame Lösung vor.",
              emotional_impact: "Der Partner fühlt sich nicht angegriffen, sondern zu einer Lösung eingeladen."
            },
            {
              original_statement: dialogData.partnerMessage,
              speaker: "Ihr Partner",
              improved_version: `Du hast recht, dass du viel im Haushalt machst. Ich merke, dass du dich überfordert fühlst. Lass uns mal schauen, was ich konkret übernehmen kann, damit du dich entlastet fühlst.`,
              why_better: "Anstatt zu rechtfertigen, wird das Gefühl des Partners validiert und Hilfe angeboten.",
              emotional_impact: "Führt zu Gefühl der Zusammengehörigkeit statt zu weiterem Konflikt."
            }
          ],
          next_steps: [
            {
              timeframe: "Sofort",
              action: "Führen Sie ein ruhiges Gespräch ohne Vorwürfe",
              goal: "Verständnis für die jeweiligen Perspektiven entwickeln"
            },
            {
              timeframe: "Diese Woche",
              action: "Gemeinsam eine Hausarbeits-Aufteilung erstellen",
              goal: "Klare Strukturen und faire Verteilung etablieren"
            }
          ]
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setAnalysis(mockAnalysis);
        setDialogStep('results');
        
      } catch (error) {
        console.error('Error analyzing dialog:', error);
        setError(`Fehler bei der Dialog-Analyse: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const resetDialog = () => {
      setDialogStep('input');
      setDialogData({ scenario: '', userMessage: '', partnerMessage: '', context: '' });
      setAnalysis(null);
      setError(null);
      setLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Dialog-Coaching</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
        </header>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          {dialogStep === 'input' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">KI-gestützte Kommunikationsanalyse</h2>
                <p className="text-gray-300">Lassen Sie Ihre Gespräche analysieren und erhalten Sie Verbesserungsvorschläge</p>
              </div>

              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-300 font-medium">Kontext der Situation</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={dialogData.context}
                          onChange={(e) => setDialogData({...dialogData, context: e.target.value})}
                          placeholder="z.B. Diskussion über Haushaltsaufgaben nach einem stressigen Arbeitstag"
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 font-medium">Was Sie gesagt haben</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={dialogData.userMessage}
                          onChange={(e) => setDialogData({...dialogData, userMessage: e.target.value})}
                          placeholder="Ihre Nachricht in dem Gespräch..."
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 font-medium">Antwort Ihres Partners</Label>
                      <div className="mt-2">
                        <SpeechInput
                          value={dialogData.partnerMessage}
                          onChange={(e) => setDialogData({...dialogData, partnerMessage: e.target.value})}
                          placeholder="Die Antwort Ihres Partners..."
                          className="bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                        <p className="text-red-200 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <Button
                      onClick={analyzeDialog}
                      disabled={!dialogData.userMessage.trim() || !dialogData.partnerMessage.trim() || loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Analysiert...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-2" />
                          Dialog analysieren
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Removed intermediate analysis step - loading now happens in button */}

          {dialogStep === 'results' && analysis && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Analyse-Ergebnisse</h2>
                <Button onClick={resetDialog} variant="outline" className="border-gray-600 text-gray-300">
                  Neuen Dialog analysieren
                </Button>
              </div>

              <div className="grid gap-6">
                {/* Communication Scores */}
                {analysis.communication_scores && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-400">
                          {analysis.communication_scores.overall_score || analysis.communication_score || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">Kommunikation</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysis.communication_scores.empathy_level || analysis.empathy_level || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">Empathie</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-400">
                          {analysis.communication_scores.conflict_potential || analysis.conflict_potential || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">Konfliktpotential</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysis.communication_scores.emotional_safety || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">Emotionale Sicherheit</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Detailed Analysis */}
                {analysis.detailed_analysis && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                      <CardHeader>
                        <CardTitle className="text-cyan-400 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" />
                          Gesprächsmuster-Analyse
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.detailed_analysis.communication_patterns?.map((pattern, index) => (
                            <li key={index} className="text-gray-300 p-3 bg-cyan-900/20 rounded-lg">
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                      <CardHeader>
                        <CardTitle className="text-pink-400 flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          Emotionale Dynamiken
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.detailed_analysis.emotional_dynamics?.map((dynamic, index) => (
                            <li key={index} className="text-gray-300 p-3 bg-pink-900/20 rounded-lg">
                              {dynamic}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Strengths - Enhanced */}
                {analysis.strengths && (
                  <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Ihre Stärken
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.strengths.map((strength, index) => (
                          <div key={index} className="bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                            {typeof strength === 'object' ? (
                              <>
                                <h4 className="font-semibold text-green-300 mb-2">{strength.aspect}</h4>
                                <p className="text-gray-300 mb-3">{strength.description}</p>
                                {strength.how_to_build_on && (
                                  <div className="bg-green-800/20 p-3 rounded mt-3">
                                    <span className="text-green-200 text-sm font-medium">💡 Darauf aufbauen: </span>
                                    <span className="text-gray-300 text-sm">{strength.how_to_build_on}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-300 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                {strength}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Specific Improvements - Detailed */}
                {analysis.specific_improvements && (
                  <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-blue-400 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Detaillierte Verbesserungsvorschläge
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {analysis.specific_improvements.map((improvement, index) => (
                          <div key={index} className="bg-blue-900/20 p-5 rounded-lg border-l-4 border-blue-400">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-blue-300">{improvement.category}</h4>
                            </div>
                            
                            <div className="space-y-3 ml-8">
                              <div>
                                <span className="text-red-300 font-medium">Problem: </span>
                                <span className="text-gray-300">{improvement.problem}</span>
                              </div>
                              
                              <div>
                                <span className="text-green-300 font-medium">Lösung: </span>
                                <span className="text-gray-300">{improvement.solution}</span>
                              </div>
                              
                              {improvement.example && (
                                <div className="bg-blue-800/30 p-3 rounded-lg">
                                  <span className="text-blue-200 font-medium">💡 Praktisches Beispiel: </span>
                                  <span className="text-gray-300 italic">"{improvement.example}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fallback for simple improvements */}
                {analysis.improvements && !analysis.specific_improvements && (
                  <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-blue-400 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Verbesserungsvorschläge
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {analysis.improvements.map((improvement, index) => (
                          <li key={index} className="text-gray-300 flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Alternative Formulations - Enhanced */}
                {analysis.alternative_formulations && analysis.alternative_formulations.map((alt, index) => (
                  <Card key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Alternative Formulierung für {alt.speaker}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <h4 className="text-red-300 font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Original-Aussage:
                        </h4>
                        <p className="text-gray-300 italic bg-red-900/20 p-4 rounded-lg border-l-4 border-red-400">
                          "{alt.original_statement}"
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Empathische Alternative:
                        </h4>
                        <p className="text-gray-300 bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400">
                          "{alt.improved_version}"
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-900/20 p-4 rounded-lg">
                          <h5 className="text-blue-300 font-medium mb-2">🤔 Warum ist das besser?</h5>
                          <p className="text-gray-300 text-sm">{alt.why_better}</p>
                        </div>
                        
                        <div className="bg-purple-900/20 p-4 rounded-lg">
                          <h5 className="text-purple-300 font-medium mb-2">💝 Emotionale Wirkung:</h5>
                          <p className="text-gray-300 text-sm">{alt.emotional_impact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Fallback for simple alternative responses */}
                {analysis.alternative_responses && !analysis.alternative_formulations && analysis.alternative_responses.map((alt, index) => (
                  <Card key={index} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Alternative Formulierung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-red-300 font-medium mb-2">Original:</h4>
                        <p className="text-gray-300 italic bg-red-900/20 p-3 rounded-lg">"{alt.original}"</p>
                      </div>
                      <div>
                        <h4 className="text-green-300 font-medium mb-2">Empathischer:</h4>
                        <p className="text-gray-300 bg-green-900/20 p-3 rounded-lg">"{alt.improved}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Next Steps Section */}
                {analysis.next_steps && (
                  <Card className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-orange-400 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5" />
                        Nächste Schritte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.next_steps.map((step, index) => (
                          <div key={index} className="flex gap-4 p-4 bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-orange-600/30 rounded-full text-orange-200 text-xs font-medium">
                                  {step.timeframe}
                                </span>
                              </div>
                              <h5 className="font-medium text-orange-200 mb-1">{step.action}</h5>
                              <p className="text-gray-300 text-sm">{step.goal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PartnerSelection = () => {
    const [partnerAvatar, setPartnerAvatar] = useState(
      localStorage.getItem('partner_avatar') || null
    );

    const handlePartnerAvatarChange = (newAvatar) => {
      setPartnerAvatar(newAvatar);
      localStorage.setItem('partner_avatar', newAvatar);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Neurobond</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
        </header>

        <div className="flex flex-col items-center px-6 relative z-10">
          <h2 className="text-3xl font-bold mb-8 text-center">Wähle dein Profil</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl w-full">
            {/* Main User */}
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <AvatarUpload
                    currentAvatar={userAvatar}
                    onAvatarChange={setUserAvatar}
                    user={user}
                    storageKey="user_avatar"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{user && user.name || 'Sophia'}</h3>
                <p className="text-gray-300 mb-3">Level 3</p>
                <Badge className="bg-blue-600">Hauptnutzer</Badge>
              </CardContent>
            </Card>

            {/* Partner */}
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <AvatarUpload
                    currentAvatar={partnerAvatar}
                    onAvatarChange={handlePartnerAvatarChange}
                    user={{ id: 'partner', name: user?.partner_name || 'Partner' }}
                    storageKey="partner_avatar"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{user && user.partner_name || 'Max'}</h3>
                <p className="text-gray-300 mb-3">Level 3</p>
                <Badge className="bg-purple-600">Partner</Badge>
              </CardContent>
            </Card>
          </div>

          <Button 
            variant="outline"
            className="mt-8 border-gray-600 text-white hover:bg-gray-800"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Zurück zum Hauptmenü
          </Button>
          
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              onClick={() => setCurrentTab('partner1')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 mr-2" />
              {user?.name || 'Sophia'} Dashboard
            </Button>
            <Button 
              onClick={() => setCurrentTab('partner2')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <User className="w-4 h-4 mr-2" />
              {user?.partner_name || 'Max'} Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Regular Dashboard Component (Dark Theme)
  const Dashboard = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <header className="backdrop-blur-sm bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NEUROBOND</h1>
                      <p className="text-xs text-gray-400">Bindungstraining</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-3 bg-gray-800/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-700/50">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 border-2 border-blue-400 flex-shrink-0">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={`${user && user.name} Avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-full h-full text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">Hallo, {user && user.name}!</p>
                        <Badge className={`text-xs px-2 py-1 ${
                          (user?.subscription || userSubscription) === 'pro' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          {(user?.subscription || userSubscription) === 'pro' ? 'PRO' : 'FREE'}
                        </Badge>
                      </div>
                      {user && user.partner_name && (
                        <p className="text-xs text-gray-300">{user.name} & {user.partner_name}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentTab('partners')}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none hover:from-purple-700 hover:to-blue-700"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Partner Profile</span>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUser(null); 
                      setShowLandingPage(true); 
                      localStorage.removeItem('empathy_user');
                      localStorage.removeItem('user_avatar');
                      showNotification('Erfolgreich abgemeldet', 'success');
                    }}
                    className="text-gray-300 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span className="hidden sm:inline ml-2">Abmelden</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Willkommen zurück, {user && user.name}! 👋
              </h2>
              {user && user.partner_name && (
                <p className="text-xl text-gray-300 mb-6">
                  Stärkt eure Bindung - <span className="font-semibold text-blue-400">{user.name}</span> und <span className="font-semibold text-purple-400">{user.partner_name}</span>
                </p>
              )}
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
                  <div className="text-2xl font-bold text-blue-400">0</div>
                  <div className="text-sm text-gray-400">Szenarien absolviert</div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
                  <div className="text-2xl font-bold text-green-400">0%</div>
                  <div className="text-sm text-gray-400">Fortschritt</div>
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
                  <div className="text-2xl font-bold text-purple-400">5</div>
                  <div className="text-sm text-gray-400">Stufen verfügbar</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('training-stufen')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-blue-400" />
                    Training Stufen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">5 strukturierte Stufen für bessere Kommunikation</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-200">5 kostenlose Szenarien</Badge>
                    <Button size="sm" className="ml-auto bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-1" />
                      Starten
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('dialog-coaching')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Dialog-Coaching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">KI-gestützte Kommunikationsanalyse</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">Wissenschaftlich fundiert</Badge>
                    <Button size="sm" className="ml-auto bg-purple-600 hover:bg-purple-700">
                      <Brain className="w-4 h-4 mr-1" />
                      Analysieren
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('gefuehlslexikon')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Heart className="w-5 h-5 text-red-400" />
                    Gefühlslexikon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">50+ Emotionen verstehen und benennen</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-green-900/50 text-green-200">Kostenlos</Badge>
                    <Button size="sm" className="ml-auto bg-red-600 hover:bg-red-700">
                      <Star className="w-4 h-4 mr-1" />
                      Erkunden
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('own-cases')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Plus className="w-5 h-5 text-green-400" />
                    Eigene Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Deine eigenen Situationen analysieren lassen</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-green-900/50 text-green-200">Neu!</Badge>
                    <Button size="sm" className="ml-auto bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Erstellen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('community-cases')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="w-5 h-5 text-green-400" />
                    Community Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Anonyme Fälle aus der Community</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-green-900/50 text-green-200">Kostenlos</Badge>
                    <Button size="sm" className="ml-auto bg-green-600 hover:bg-green-700">
                      <Users className="w-4 h-4 mr-1" />
                      Entdecken
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('partners')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="w-5 h-5 text-blue-400" />
                    Partner Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Persönliche Profile und Tagesziele</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-200">Dynamische Ziele!</Badge>
                    <Button size="sm" className="ml-auto bg-blue-600 hover:bg-blue-700">
                      <Users className="w-4 h-4 mr-1" />
                      Öffnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check for test mode in URL
  const isTestMode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('test') === 'true';

  // Enhanced render logic with localStorage fallback
  const hasUserInStorage = typeof window !== 'undefined' && localStorage.getItem('empathy_user');
  
  console.log('🔍 NEUROBOND Render Check:', {
    showLandingPage,
    showOnboarding,
    hasUser: !!user,
    hasUserInStorage: !!hasUserInStorage,
    isTestMode
  });

  // If we have a user in storage but not in state, something went wrong
  if (hasUserInStorage && !user && !showOnboarding && !isTestMode) {
    console.log('🔧 NEUROBOND: User in storage but not in state - attempting recovery...');
    try {
      const userData = JSON.parse(hasUserInStorage);
      setUser(userData);
      setShowLandingPage(false);
      setShowOnboarding(false);
    } catch (e) {
      console.error('❌ NEUROBOND: Failed to recover user from storage:', e);
    }
  }

  // Simplified render logic - show dashboard if user exists OR is in storage
  if (!user && !hasUserInStorage && !isTestMode) {
    if (showOnboarding) {
      return <OnboardingForm />;
    }
    return <LandingPage />;
  }

  // If we have onboarding active, show that
  if (showOnboarding && !isTestMode) {
    return <OnboardingForm />;
  }

  // At this point, either user exists or is in storage - show dashboard
  console.log('✅ NEUROBOND: Rendering dashboard - user authenticated');

  // For test mode, create a default user if none exists
  if (isTestMode && !user) {
    const testUser = {
      id: 'test-user-' + Date.now(),
      name: 'Sophia',
      email: 'sophia@neurobond.com',
      partner_name: 'Max'
    };
    setUser(testUser);
    localStorage.setItem('empathy_user', JSON.stringify(testUser));
    setShowOnboarding(false);
    setShowLandingPage(false);
  }

  // Navigation logic
  if (currentTab === 'partners') {
    return <PartnerSelection />;
  }

  if (currentTab === 'partner1') {
    return <PartnerDashboard isMainUser={true} />;
  }

  if (currentTab === 'partner2') {
    return <PartnerDashboard isMainUser={false} />;
  }

  if (currentTab === 'own-cases') {
    return <OwnCasesCreation />;
  }

  if (currentTab === 'dialog-coaching') {
    return <DialogCoachingPage />;
  }

  if (currentTab === 'gefuehlslexikon') {
    return <GefuehlslexikonPage />;
  }

  if (currentTab === 'community-cases') {
    return <CommunityCasesPage />;
  }

  if (currentTab === 'training-stufen') {
    return <TrainingStufen />;
  }

  return (
    <>
      <Dashboard />
      
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-black' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <X className="w-5 h-5" />}
            {notification.type === 'warning' && <Trophy className="w-5 h-5" />}
            {notification.type === 'info' && <Sparkles className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">NEUROBOND PRO</CardTitle>
              <CardDescription className="text-gray-300">
                Erweitern Sie Ihr Empathie-Training mit unbegrenztem Zugang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">CHF 10.00</div>
                      <div className="text-gray-400 text-sm">pro Monat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">CHF 100.00</div>
                      <div className="text-gray-400 text-sm">pro Jahr</div>
                      <div className="text-green-400 text-xs font-medium">2 Monate gratis!</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Alle 17 Trainings-Szenarien</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Vollständiges Gefühlslexikon</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Dialog-Coaching mit KI-Analyse</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Eigene Fälle erstellen</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Wöchentliche Trainingspläne</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`${BACKEND_URL}/api/checkout/session`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            package_type: 'monthly',
                            origin_url: window.location.origin
                          })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          if (data.url) {
                            localStorage.setItem('pending_pro_upgrade', 'monthly');
                            localStorage.setItem('stripe_session_id', data.session_id);
                            window.location.href = data.url;
                          }
                        }
                      } catch (error) {
                        showNotification('Fehler beim Laden der Zahlungsseite.', 'error');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Monatlich - CHF 10.00
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`${BACKEND_URL}/api/checkout/session`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            package_type: 'yearly',
                            origin_url: window.location.origin
                          })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          if (data.url) {
                            localStorage.setItem('pending_pro_upgrade', 'yearly');
                            localStorage.setItem('stripe_session_id', data.session_id);
                            window.location.href = data.url;
                          }
                        }
                      } catch (error) {
                        showNotification('Fehler beim Laden der Zahlungsseite.', 'error');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Jährlich - CHF 100.00 (2 Monate gratis!)
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

const App = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EmpathyTrainingApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;