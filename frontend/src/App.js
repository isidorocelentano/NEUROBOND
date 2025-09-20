import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea.jsx';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle, Play, Crown, Rocket, User, UserCheck, Mic, Globe, Camera, Upload, UserCircle, MicOff, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmpathyTrainingApp = () => {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // Speech Recognition States
  const [speechLanguage, setSpeechLanguage] = useState('de-DE');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Avatar States
  const [userAvatar, setUserAvatar] = useState(null);

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Speech Recognition Configuration
  const speechLanguages = [
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'de-CH', name: 'Schweizerdeutsch', flag: '🇨🇭' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' }
  ];

  // Check speech recognition support
  useEffect(() => {
    const checkSpeechSupport = () => {
      try {
        if (typeof window !== 'undefined') {
          const isSupported = !!(
            window.SpeechRecognition || 
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition
          );
          console.log('Speech recognition supported:', isSupported);
          setSpeechSupported(isSupported);
        } else {
          setSpeechSupported(false);
        }
      } catch (error) {
        console.log('Speech recognition check failed:', error);
        setSpeechSupported(false);
      }
    };
    
    checkSpeechSupport();
    setTimeout(checkSpeechSupport, 1000);
  }, []);

  // Avatar Upload Component
  const AvatarUpload = ({ userId, currentAvatar, onAvatarUpdate }) => {
    const [previewImage, setPreviewImage] = useState(currentAvatar);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('Nur JPEG, PNG, GIF und WebP Bilder sind erlaubt', 'error');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Bild ist zu groß. Maximum 5MB erlaubt', 'error');
        return;
      }

      // Show preview
      if (typeof window !== 'undefined' && window.FileReader) {
        const reader = new window.FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }

      // Set the preview image immediately
      if (onAvatarUpdate) {
        onAvatarUpdate(reader.result || previewImage);
      }
      setUserAvatar(reader.result || previewImage);
      showNotification('Avatar erfolgreich hochgeladen!', 'success');
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-16 h-16 text-gray-400" />
            )}
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
          
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Bild hochladen
          </Button>
          
          {previewImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewImage(null);
                if (onAvatarUpdate) onAvatarUpdate(null);
                showNotification('Avatar entfernt', 'success');
              }}
              disabled={isUploading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Entfernen
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center max-w-48">
          JPEG, PNG, GIF oder WebP. Max 5MB. Wird automatisch auf 200x200px skaliert.
        </p>
      </div>
    );
  };

  // Speech Input Component
  const SpeechInput = ({ value, onChange, placeholder, multiline = false, className = "", disabled = false, name = "" }) => {
    const [isListening, setIsListening] = useState(false);
    const [showLanguageSelect, setShowLanguageSelect] = useState(false);

    const startSpeechRecognition = () => {
      if (!speechSupported) {
        showNotification('Spracherkennung wird von Ihrem Browser nicht unterstützt', 'warning');
        return;
      }

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = speechLanguage;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          showNotification('Hörzu... Bitte sprechen Sie jetzt', 'info');
        };

        recognition.onresult = (event) => {
          try {
            const transcript = event.results[0][0].transcript;
            const currentValue = value || '';
            const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
            if (typeof onChange === 'function') {
              onChange(newValue);
            }
            showNotification('Spracheingabe erfolgreich!', 'success');
          } catch (error) {
            console.error('Speech result processing error:', error);
            showNotification('Fehler beim Verarbeiten der Spracheingabe', 'error');
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Fehler bei der Spracherkennung';
          switch(event.error) {
            case 'no-speech':
              errorMessage = 'Keine Sprache erkannt. Bitte versuchen Sie es erneut.';
              break;
            case 'audio-capture':
              errorMessage = 'Mikrofon nicht verfügbar. Bitte prüfen Sie die Berechtigungen.';
              break;
            case 'not-allowed':
              errorMessage = 'Mikrofon-Zugriff verweigert. Bitte aktivieren Sie die Berechtigung.';
              break;
            case 'network':
              errorMessage = 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.';
              break;
          }
          showNotification(errorMessage, 'error');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (error) {
        console.error('Speech recognition error:', error);
        showNotification('Fehler beim Starten der Spracherkennung', 'error');
        setIsListening(false);
      }
    };

    const InputComponent = multiline ? Textarea : Input;
    
    const handleChange = (e) => {
      try {
        const value = e && e.target ? e.target.value : e;
        if (typeof onChange === 'function') {
          onChange(value);
        }
      } catch (error) {
        console.error('Input change error:', error);
      }
    };
    
    return (
      <div className="relative">
        <InputComponent
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`pr-20 ${className}`}
          disabled={disabled}
          name={name}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Language Selector */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => speechSupported ? setShowLanguageSelect(!showLanguageSelect) : showNotification('Spracherkennung nicht verfügbar', 'warning')}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              disabled={disabled || isListening}
            >
              <Globe className={`w-4 h-4 ${speechSupported ? 'text-blue-500' : 'text-gray-400'}`} />
            </Button>
              
            {showLanguageSelect && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-36">
                {speechLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSpeechLanguage(lang.code);
                      setShowLanguageSelect(false);
                      showNotification(`Sprache geändert zu ${lang.name}`, 'success');
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                      speechLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speech Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startSpeechRecognition}
            disabled={disabled || isListening || !speechSupported}
            className={`h-8 w-8 p-0 ${
              isListening 
                ? 'text-red-500 animate-pulse hover:bg-red-50' 
                : speechSupported 
                  ? 'text-blue-500 hover:bg-blue-50'
                  : 'text-gray-400'
            }`}
            title={speechSupported 
              ? `Spracheingabe (${speechLanguages.find(l => l.code === speechLanguage) && speechLanguages.find(l => l.code === speechLanguage).name || 'Deutsch'})`
              : 'Spracherkennung nicht verfügbar'
            }
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Modern Landing Page Component
  const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Modern Navigation */}
          <nav className="backdrop-blur-sm bg-white/80 border-b border-white/20 sticky top-0 z-50">
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
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
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

          {/* Hero Section */}
          <div className="container mx-auto px-4 py-16 lg:py-24">
            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Wissenschaftlich fundiert
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Stärke deine 
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> Beziehung </span>
                mit KI-gestütztem Training
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                NEUROBOND kombiniert Neurowissenschaft mit bewährten Methoden der 
                Paartherapie (EFT & Gottman). Verbessert eure Kommunikation, löst Konflikte 
                empathisch und baut eine tiefere emotionale Verbindung auf.
              </p>

              {/* Call-to-Action Buttons */}
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
                  className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-4 text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300"
                >
                  <Crown className="w-6 h-6 mr-3" />
                  PRO Version entdecken
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
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

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">KI-Feedback</h3>
                <p className="text-gray-600 text-sm">Personalisierte Bewertungen und Verbesserungsvorschläge für eure Kommunikation</p>
              </div>
              
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Sprachsteuerung</h3>
                <p className="text-gray-600 text-sm">6 Sprachen unterstützt - einfach sprechen statt tippen</p>
              </div>
              
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Strukturiertes Training</h3>
                <p className="text-gray-600 text-sm">5 aufeinander aufbauende Stufen für nachhaltige Beziehungsverbesserung</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modern Onboarding Component
  const OnboardingForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      partner_name: ''
    });

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
        avatar: userAvatar
      };
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      localStorage.setItem('user_avatar', userAvatar || '');
      setShowOnboarding(false);
      setShowLandingPage(false);
      showNotification(`Willkommen, ${formData.name}! Ihr Profil wurde erfolgreich erstellt.`, 'success');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NEUROBOND</h1>
                <p className="text-sm text-gray-500">Bindungstraining</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Willkommen!</h2>
            <p className="text-gray-600">Lass uns dein persönliches Profil erstellen</p>
          </div>

          {/* Form Card */}
          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border border-white/20 rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex justify-center mb-6">
                  <AvatarUpload 
                    userId="temp-user" 
                    currentAvatar={userAvatar}
                    onAvatarUpdate={setUserAvatar}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">Dein Name *</Label>
                    <SpeechInput
                      value={formData.name}
                      onChange={(value) => setFormData({...formData, name: value})}
                      placeholder="z.B. Adam"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
                      name="name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">E-Mail-Adresse *</Label>
                    <SpeechInput
                      value={formData.email}
                      onChange={(value) => setFormData({...formData, email: value})}
                      placeholder="adam@example.com"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
                      name="email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="partner_name" className="text-gray-700 font-medium">Name deines Partners</Label>
                    <SpeechInput
                      value={formData.partner_name}
                      onChange={(value) => setFormData({...formData, partner_name: value})}
                      placeholder="z.B. Linda (optional)"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
                      name="partner_name"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Du erhältst Zugang zu:</h4>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      5 kostenlose Trainings-Szenarien
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Gefühlslexikon mit 50+ Emotionen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      KI-gestütztes Feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      6-sprachige Sprachsteuerung
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
    );
  };

  // Simple Dashboard
  const Dashboard = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          {/* Header */}
          <header className="backdrop-blur-sm bg-white/80 border-b border-white/20 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NEUROBOND</h1>
                      <p className="text-xs text-gray-500">Bindungstraining</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-blue-300 flex-shrink-0">
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
                      <p className="text-sm font-medium text-gray-900">Hallo, {user && user.name}!</p>
                      {user && user.partner_name && (
                        <p className="text-xs text-gray-600">{user.name} & {user.partner_name}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Rocket className="w-4 h-4" />
                    Kostenlos
                  </div>
                  
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {setUser(null); setShowLandingPage(true); localStorage.removeItem('empathy_user');}}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span className="hidden sm:inline ml-2">Abmelden</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Willkommen zurück, {user && user.name}! 👋
              </h2>
              {user && user.partner_name && (
                <p className="text-xl text-gray-600 mb-6">
                  Stärkt eure Bindung - <span className="font-semibold">{user.name}</span> und <span className="font-semibold">{user.partner_name}</span>
                </p>
              )}
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Szenarien absolviert</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <div className="text-2xl font-bold text-green-600">0%</div>
                  <div className="text-sm text-gray-600">Fortschritt</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-600">Stufen verfügbar</div>
                </div>
              </div>
            </div>

            {/* Functional Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Training Stufen werden geladen...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Training Stufen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">5 strukturierte Stufen für bessere Kommunikation</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">5 kostenlose Szenarien</Badge>
                    <Button size="sm" className="ml-auto">
                      <Play className="w-4 h-4 mr-1" />
                      Starten
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Dialog-Coaching wird geladen...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Dialog-Coaching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">KI-gestützte Kommunikationsanalyse</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Wissenschaftlich fundiert</Badge>
                    <Button size="sm" className="ml-auto">
                      <Brain className="w-4 h-4 mr-1" />
                      Analysieren
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Gefühlslexikon wird geöffnet...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Gefühlslexikon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">50+ Emotionen verstehen und benennen</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Kostenlos</Badge>
                    <Button size="sm" className="ml-auto">
                      <Star className="w-4 h-4 mr-1" />
                      Erkunden
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Community Cases werden geladen...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Community Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Anonyme Fälle aus der Community</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Kostenlos</Badge>
                    <Button size="sm" className="ml-auto">
                      <Users className="w-4 h-4 mr-1" />
                      Entdecken
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Wöchentliche Trainingspläne werden erstellt...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Trainingspläne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Personalisierte wöchentliche Pläne</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">KI-personalisiert</Badge>
                    <Button size="sm" className="ml-auto">
                      <Trophy className="w-4 h-4 mr-1" />
                      Planen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => showNotification('Profil wird geöffnet...', 'info')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Mein Profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Avatar, Einstellungen und Fortschritt</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Personalisiert</Badge>
                    <Button size="sm" className="ml-auto">
                      <User className="w-4 h-4 mr-1" />
                      Bearbeiten
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
      name: 'Test User',
      email: 'test@example.com',
      partner_name: 'Test Partner'
    };
    setUser(testUser);
    localStorage.setItem('empathy_user', JSON.stringify(testUser));
    setShowOnboarding(false);
    setShowLandingPage(false);
  }

  return <Dashboard />;
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