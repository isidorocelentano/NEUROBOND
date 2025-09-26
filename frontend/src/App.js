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
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Stripe Integration
  const stripe = window.Stripe && window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

  // Handle Stripe Checkout
  const handleStripeCheckout = async () => {
    if (!stripe) {
      showNotification('Stripe wird geladen... Bitte versuchen Sie es erneut.', 'warning');
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log('Creating checkout session for plan:', selectedPlan);
      
      const response = await fetch(`${BACKEND_URL}/api/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_type: selectedPlan,
          origin_url: window.location.origin
        }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.detail || 'Fehler beim Erstellen der Checkout Session');
      }

      console.log('Checkout session created:', session);

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.session_id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      console.error('Payment error:', error);
      showNotification(`Fehler beim Starten der Zahlung: ${error.message}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Enhanced user restoration with debugging and payment result handling
  useEffect(() => {
    console.log('🔍 NEUROBOND: Initializing app...');
    
    // Check for payment success/cancel in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentCanceled = urlParams.get('payment_canceled');
    const sessionId = urlParams.get('session_id');

    if (paymentSuccess === 'true' && sessionId) {
      console.log('✅ Payment successful, session_id:', sessionId);
      showNotification('Zahlung erfolgreich! Ihr PRO Account ist jetzt aktiv.', 'success');
      // Update user subscription status
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userData.subscription = 'pro';
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error updating user subscription:', error);
        }
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (paymentCanceled === 'true') {
      console.log('❌ Payment canceled');
      showNotification('Zahlung wurde abgebrochen. Sie können jederzeit erneut upgraden.', 'warning');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    try {
      const savedUser = localStorage.getItem('empathy_user');
      const savedAvatar = localStorage.getItem('user_avatar');
      
      console.log('🔍 SavedUser from localStorage:', savedUser);
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('✅ NEUROBOND: User found in localStorage:', userData);
        setUser(userData);
        setShowLandingPage(false);
        setShowOnboarding(false);
        console.log('✅ NEUROBOND: State updated - should show dashboard');
      } else {
        console.log('ℹ️ NEUROBOND: No saved user found - showing landing page');
      }
      
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
        console.log('✅ NEUROBOND: Avatar restored');
      }
    } catch (error) {
      console.error('❌ NEUROBOND: Error restoring user:', error);
      // Reset states to safe defaults
      setShowLandingPage(true);
      setShowOnboarding(false);
      setUser(null);
    }
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

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button 
                  size="lg"
                  onClick={() => {
                    setShowLandingPage(false);
                    setShowOnboarding(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Kostenlos ausprobieren
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setShowUpgradeModal(true)}
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-4 text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300"
                >
                  <Crown className="w-6 h-6 mr-3" />
                  PRO Version entdecken
                </Button>
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
        partner_name: formData.partner_name
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

  // Gefühlslexikon Component
  const GefuehlslexikonPage = () => {
    const [selectedEmotion, setSelectedEmotion] = useState(null);
    
    const emotions = [
      { name: "Freude", color: "bg-yellow-500", description: "Ein Gefühl des Glücks und der Zufriedenheit", category: "Positive Emotionen" },
      { name: "Liebe", color: "bg-pink-500", description: "Tiefe Zuneigung und Verbundenheit", category: "Positive Emotionen" },
      { name: "Dankbarkeit", color: "bg-green-500", description: "Anerkennung für etwas Gutes", category: "Positive Emotionen" },
      { name: "Hoffnung", color: "bg-blue-500", description: "Optimismus für die Zukunft", category: "Positive Emotionen" },
      { name: "Stolz", color: "bg-purple-500", description: "Selbstwertgefühl durch Leistung", category: "Positive Emotionen" },
      { name: "Wut", color: "bg-red-500", description: "Intensive negative Reaktion auf Frustration", category: "Herausfordernde Emotionen" },
      { name: "Trauer", color: "bg-gray-500", description: "Schmerz durch Verlust oder Enttäuschung", category: "Herausfordernde Emotionen" },
      { name: "Angst", color: "bg-orange-500", description: "Besorgnis über zukünftige Bedrohungen", category: "Herausfordernde Emotionen" },
      { name: "Eifersucht", color: "bg-indigo-500", description: "Furcht vor Verlust der Aufmerksamkeit", category: "Herausfordernde Emotionen" },
      { name: "Scham", color: "bg-red-800", description: "Gefühl der Bloßstellung oder Unzulänglichkeit", category: "Herausfordernde Emotionen" },
      { name: "Überraschung", color: "bg-cyan-500", description: "Unerwartete Reaktion auf Ereignisse", category: "Neutrale Emotionen" },
      { name: "Neugier", color: "bg-teal-500", description: "Interesse an Unbekanntem", category: "Neutrale Emotionen" },
      { name: "Verwirrung", color: "bg-slate-500", description: "Unklarheit über Situationen", category: "Neutrale Emotionen" }
    ];

    const categories = [...new Set(emotions.map(e => e.category))];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Gefühlslexikon</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
        </header>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          {!selectedEmotion ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">50+ Emotionen verstehen</h2>
                <p className="text-gray-300">Erweitern Sie Ihr emotionales Vokabular für bessere Kommunikation</p>
              </div>

              {categories.map(category => (
                <div key={category} className="mb-8">
                  <h3 className="text-xl font-bold text-blue-400 mb-4">{category}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {emotions.filter(e => e.category === category).map(emotion => (
                      <Card 
                        key={emotion.name}
                        className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer"
                        onClick={() => setSelectedEmotion(emotion)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${emotion.color}`}></div>
                            <h4 className="font-semibold text-white">{emotion.name}</h4>
                          </div>
                          <p className="text-gray-300 text-sm mt-2">{emotion.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Button 
                variant="ghost"
                onClick={() => setSelectedEmotion(null)}
                className="mb-4 text-blue-400 hover:text-blue-300"
              >
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                Zurück zur Übersicht
              </Button>
              
              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${selectedEmotion.color} mx-auto mb-4`}></div>
                  <CardTitle className="text-3xl text-white">{selectedEmotion.name}</CardTitle>
                  <CardDescription className="text-gray-300">{selectedEmotion.category}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Definition</h4>
                      <p className="text-gray-300">{selectedEmotion.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Wie sich {selectedEmotion.name} zeigt</h4>
                      <p className="text-gray-300">
                        Diese Emotion kann sich durch verschiedene körperliche und emotionale Signale zeigen. 
                        Achten Sie auf Veränderungen in Ihrer Körperhaltung, Ihrem Ton und Ihren Gedanken.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Empathische Kommunikation</h4>
                      <p className="text-gray-300">
                        "Ich merke, dass du {selectedEmotion.name.toLowerCase()} fühlst. Das ist völlig verständlich. 
                        Magst du mir mehr darüber erzählen, was diese Emotion in dir auslöst?"
                      </p>
                    </div>
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

    useEffect(() => {
      loadCommunityCases();
    }, []);

    const loadCommunityCases = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/community-cases`);
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded community cases:', data.length);
          // API returns cases directly as array, not wrapped in data.cases
          setCases(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to load community cases:', response.status);
          showNotification('Fehler beim Laden der Community Cases.', 'error');
          setCases([]);
        }
      } catch (error) {
        console.error('Error loading community cases:', error);
        showNotification('Fehler beim Laden der Community Cases. Versuchen Sie es später erneut.', 'error');
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl"></div>
        </div>

        <header className="flex justify-between items-center p-6 mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">Community Cases</h1>
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
          {loading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Lade Community Cases...</p>
            </div>
          ) : !selectedCase ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Anonyme Fälle aus der Community</h2>
                <p className="text-gray-300">Lernen Sie von realen Situationen anderer Paare</p>
              </div>

              <div className="space-y-4">
                {cases.map(caseItem => (
                  <Card 
                    key={caseItem.id}
                    className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer"
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-white">{caseItem.title}</h3>
                        <Badge className={`${
                          caseItem.difficulty_level === 'Einfach' ? 'bg-green-600' :
                          caseItem.difficulty_level === 'Mittel' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {caseItem.difficulty_level}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {caseItem.ai_solution ? caseItem.ai_solution.substring(0, 150) + '...' : 'Keine Beschreibung verfügbar'}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-3 text-blue-400 hover:text-blue-300">
                        Fall analysieren <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Button 
                variant="ghost"
                onClick={() => setSelectedCase(null)}
                className="mb-4 text-blue-400 hover:text-blue-300"
              >
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
                Zurück zur Übersicht
              </Button>
              
              <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white">{selectedCase.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      selectedCase.difficulty_level === 'Einfach' ? 'bg-green-600' :
                      selectedCase.difficulty_level === 'Mittel' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {selectedCase.difficulty_level}
                    </Badge>
                    <span className="text-gray-400 text-sm">Anonymisierter Fall</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {selectedCase.anonymized_dialogue && selectedCase.anonymized_dialogue.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-purple-400 mb-3">Dialog-Beispiel</h4>
                        <div className="space-y-2">
                          {selectedCase.anonymized_dialogue.slice(0, 3).map((message, index) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                              <span className="font-medium text-blue-300">{message.speaker}:</span>
                              <span className="text-gray-300 ml-2">{message.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-3">KI-Analyse & Lösungsvorschläge</h4>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedCase.ai_solution}</div>
                    </div>
                    
                    <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-700/50">
                      <h4 className="font-semibold text-blue-100 mb-2">Empathie-Tipp</h4>
                      <p className="text-blue-200 text-sm">
                        Versuchen Sie, die Perspektive beider Partner zu verstehen. 
                        Oft sind beide Seiten berechtigt, auch wenn sie unterschiedlich kommunizieren.
                      </p>
                    </div>
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
                      <p className="text-sm font-medium text-white">Hallo, {user && user.name}!</p>
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

      {/* Enhanced Upgrade Modal with Stripe Integration */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="text-center">
              <div className="flex justify-between items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <CardTitle className="text-2xl text-white mb-2">NEUROBOND PRO</CardTitle>
              <CardDescription className="text-gray-300">
                Erweitern Sie Ihr Empathie-Training mit unbegrenztem Zugang
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Plan Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white text-center">Wählen Sie Ihren Plan</h3>
                
                <div className="grid gap-3">
                  {/* Monthly Plan */}
                  <div 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlan === 'monthly' 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">Monatlich</h4>
                        <p className="text-sm text-gray-400">Flexibel kündbar</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">CHF 10.00</div>
                        <div className="text-sm text-gray-400">pro Monat</div>
                      </div>
                    </div>
                  </div>

                  {/* Yearly Plan with Savings */}
                  <div 
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                      selectedPlan === 'yearly' 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-green-600 text-white">CHF 20.00 sparen</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">Jährlich</h4>
                        <p className="text-sm text-gray-400">2 Monate gratis</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">CHF 100.00</div>
                        <div className="text-sm text-gray-400">pro Jahr</div>
                        <div className="text-xs text-green-400">CHF 8.33/Monat</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white text-center">PRO Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Unbegrenzter Zugang zu allen 5 Training Stufen</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Personalisierte Dialog-Coaching Sessions</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Zugang zu Community Cases</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Wöchentliche Trainingspläne</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Premium Support</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 text-center">Sichere Zahlung mit</h3>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💳</span>
                    </div>
                    <span className="text-sm text-gray-300">Kreditkarte</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <span className="text-sm text-gray-300">PayPal</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={isProcessingPayment}
                >
                  Später
                </Button>
                <Button 
                  onClick={handleStripeCheckout}
                  disabled={isProcessingPayment}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Verarbeitung...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      {selectedPlan === 'yearly' ? 'CHF 100.00 zahlen' : 'CHF 10.00 zahlen'}
                    </>
                  )}
                </Button>
              </div>

              {/* Legal Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Inkl. 8.1% Schweizer MWST • Jederzeit kündbar
                </p>
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