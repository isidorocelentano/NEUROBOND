import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle, Play, Crown, Rocket, User, UserCheck, Mic, Globe, Camera, Upload, UserCircle, MessageCircle, BookOpen, Settings, X, Send, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// SpeechInput Component with Multi-language Support
const SpeechInput = ({ value, onChange, placeholder, className, languages = ['de-DE', 'de-CH', 'en-US', 'fr-FR', 'es-ES', 'it-IT'] }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('de-DE');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
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
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onChange({ target: { value: value + ' ' + transcript } });
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentLanguage]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.lang = currentLanguage;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
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
            className={`h-8 w-8 p-0 hover:bg-gray-100 ${
              isListening ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Avatar Upload Component
const AvatarUpload = ({ currentAvatar, onAvatarChange, user }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]; 
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        onAvatarChange(base64);
        localStorage.setItem('user_avatar', base64);
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
      alert('Fehler beim Hochladen des Avatars');
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
          onClick={() => fileInputRef.current?.click()}
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
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
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

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Check for saved user on load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('empathy_user');
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setShowLandingPage(false);
        setShowOnboarding(false);
      }
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    } catch (error) {
      console.log('Error restoring user:', error);
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
                  onClick={() => {
                    showNotification('PRO Version wird bald verfügbar!', 'info');
                  }}
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
      
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      if (tempAvatar) {
        setUserAvatar(tempAvatar);
        localStorage.setItem('user_avatar', tempAvatar);
      }
      setShowOnboarding(false);
      setShowLandingPage(false);
      showNotification(`Willkommen, ${formData.name}! Ihr Profil wurde erfolgreich erstellt.`, 'success');
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
    const dailyGoalsCompleted = 6;
    const dailyGoalsTotal = 10;
    const progressPercentage = (dailyGoalsCompleted / dailyGoalsTotal) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Neurobond</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setCurrentTab('partners')}
          >
            <Settings className="w-6 h-6" />
          </Button>
        </header>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white/20">
            {(isMainUser && userAvatar) ? (
              <img 
                src={userAvatar} 
                alt={`${user && user.name} Avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <UserCircle className="w-20 h-20 text-white/80" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            {isMainUser ? (user && user.name || 'Sophia') : (user && user.partner_name || 'Max')}
          </h2>
          <p className="text-lg text-gray-300">Level {partnerLevel}</p>
        </div>

        {/* Daily Goals Section */}
        <div className="px-6 mb-8">
          <h3 className="text-2xl font-bold mb-6">Tagesziele</h3>
          
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

          {/* Goals List */}
          <div className="space-y-4">
            {[
              { text: "Empathie-Training absolvieren", completed: true },
              { text: "Gefühlslexikon studieren", completed: true },
              { text: "Dialog-Coaching durchführen", completed: true },
              { text: "Community Case kommentieren", completed: true },
              { text: "Meditation (5 Min)", completed: true },
              { text: "Partner-Dialog führen", completed: true },
              { text: "Wöchentlichen Plan aktualisieren", completed: false },
              { text: "Reflexion schreiben", completed: false },
              { text: "Dankbarkeits-Übung", completed: false },
              { text: "Konfliktlösung üben", completed: false }
            ].map((goal, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  goal.completed 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                    : 'bg-gray-600'
                }`}>
                  {goal.completed && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`${goal.completed ? 'text-white' : 'text-gray-400'}`}>
                  {goal.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
          <div className="flex justify-around py-4">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => showNotification('Training wird geladen...', 'info')}
            >
              <Target className="w-6 h-6 mb-1" />
              <span className="text-xs">Training</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => showNotification('Dialog wird geladen...', 'info')}
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs">Dialog</span>
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
              onClick={() => showNotification('Lexikon wird geladen...', 'info')}
            >
              <BookOpen className="w-6 h-6 mb-1" />
              <span className="text-xs">Lexikon</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center text-white hover:bg-white/10"
              onClick={() => setCurrentTab('partners')}
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs">Profil</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Own Cases Creation Component
  const OwnCasesCreation = () => {
    const [dialogMessages, setDialogMessages] = useState([
      { speaker: user?.name || 'Ich', message: '' },
      { speaker: user?.partner_name || 'Partner', message: '' }
    ]);
    const [caseTitle, setCaseTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addMessage = () => {
      setDialogMessages([
        ...dialogMessages,
        { speaker: dialogMessages.length % 2 === 0 ? user?.name || 'Ich' : user?.partner_name || 'Partner', message: '' }
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
        showNotification('Bitte geben Sie einen Titel für Ihren Case ein', 'error');
        return;
      }

      const validMessages = dialogMessages.filter(msg => msg.message.trim());
      if (validMessages.length < 2) {
        showNotification('Bitte fügen Sie mindestens 2 Nachrichten hinzu', 'error');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/create-community-case-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: caseTitle,
            messages: validMessages,
            consent: true,
            user_email: user?.email || 'anonymous@example.com'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          showNotification('Ihr Case wurde erfolgreich erstellt und wird analysiert!', 'success');
          setCaseTitle('');
          setDialogMessages([
            { speaker: user?.name || 'Ich', message: '' },
            { speaker: user?.partner_name || 'Partner', message: '' }
          ]);
        } else {
          throw new Error('Fehler beim Erstellen des Cases');
        }
      } catch (error) {
        console.error('Error creating case:', error);
        showNotification('Fehler beim Erstellen des Cases. Bitte versuchen Sie es später erneut.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

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
  const PartnerSelection = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <header className="flex justify-between items-center p-6 mb-8">
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

        <div className="flex flex-col items-center px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Wähle dein Profil</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl w-full">
            {/* Main User */}
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer"
              onClick={() => setCurrentTab('partner1')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-blue-400">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={`${user && user.name} Avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                      <UserCircle className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{user && user.name || 'Sophia'}</h3>
                <p className="text-gray-300">Level 3</p>
                <Badge className="mt-3 bg-blue-600">Hauptnutzer</Badge>
              </CardContent>
            </Card>

            {/* Partner */}
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer"
              onClick={() => setCurrentTab('partner2')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-purple-400">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_emotion-bridge-1/artifacts/kzo8v6yk_neurobond%20bild%20-%2001.jpg"
                    alt="Partner Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{user && user.partner_name || 'Max'}</h3>
                <p className="text-gray-300">Level 3</p>
                <Badge className="mt-3 bg-purple-600">Partner</Badge>
              </CardContent>
            </Card>
          </div>

          <Button 
            variant="outline"
            className="mt-8 border-gray-600 text-white hover:bg-gray-800"
            onClick={() => setCurrentTab('home')}
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Zurück zur Übersicht
          </Button>
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
                onClick={() => showNotification('Training Stufen werden geladen...', 'info')}
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
                onClick={() => showNotification('Dialog-Coaching wird geladen...', 'info')}
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
                onClick={() => showNotification('Gefühlslexikon wird geöffnet...', 'info')}
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
                onClick={() => showNotification('Community Cases werden geladen...', 'info')}
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

  if (showLandingPage && !isTestMode) {
    return <LandingPage />;
  }

  if (showOnboarding && !isTestMode) {
    return <OnboardingForm />;
  }

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