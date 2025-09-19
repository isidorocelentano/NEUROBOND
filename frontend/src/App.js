import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle, BookOpen, Eye, Lightbulb, MessageCircle, Send, User, UserCheck, Calendar, Clock, Award, Zap, CheckSquare, Shield, ThumbsUp, TrendingUp, Play, ChevronRight, Rocket, Mail, Phone, MapPin, Crown, Lock, CreditCard, X, AlertTriangle, Info, Mic, MicOff, Globe, Camera, Upload, UserCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initialize Stripe with error handling
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

const EmpathyTrainingApp = () => {
  const [user, setUser] = useState(null);
  const [stages, setStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userResponse, setUserResponse] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [aiFeedbackGiven, setAiFeedbackGiven] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // Dialog Coaching States
  const [dialogMessages, setDialogMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState('partner1'); // partner1 or partner2
  const [dialogAnalysis, setDialogAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dialogSessions, setDialogSessions] = useState([]);
  
  // Weekly Training Plan States
  const [currentWeekPlan, setCurrentWeekPlan] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [loadingWeeklyPlan, setLoadingWeeklyPlan] = useState(false);
  
  // Community Cases States
  const [communityCases, setCommunityCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Notification States
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  
  // Speech Recognition States
  const [speechLanguage, setSpeechLanguage] = useState('de-DE');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Avatar States
  const [userAvatar, setUserAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Login States
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  
  // Contact Form States
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  // Subscription States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free'); // free, active, cancelled, expired

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
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);

      // Upload avatar
      await uploadAvatar(file);
    };

    const uploadAvatar = async (file) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/user/${userId}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setUserAvatar(response.data.avatar);
          setPreviewImage(response.data.avatar);
          onAvatarUpdate(response.data.avatar);
          showNotification('Avatar erfolgreich hochgeladen!', 'success');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        showNotification('Fehler beim Hochladen des Avatars', 'error');
        setPreviewImage(currentAvatar); // Reset preview
      } finally {
        setIsUploading(false);
      }
    };

    const removeAvatar = async () => {
      try {
        const response = await axios.delete(`${API}/user/${userId}/avatar`);
        if (response.data.success) {
          setUserAvatar(null);
          setPreviewImage(null);
          onAvatarUpdate(null);
          showNotification('Avatar entfernt', 'success');
        }
      } catch (error) {
        console.error('Avatar removal error:', error);
        showNotification('Fehler beim Entfernen des Avatars', 'error');
      }
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
            onClick={() => fileInputRef.current?.click()}
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
            onClick={() => fileInputRef.current?.click()}
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
              onClick={removeAvatar}
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
  // Check speech recognition support
  useEffect(() => {
    const checkSpeechSupport = () => {
      try {
        if (typeof window !== 'undefined' && window.location) {
          setSpeechSupported(
            'webkitSpeechRecognition' in window || 
            'SpeechRecognition' in window
          );
        }
      } catch (error) {
        console.log('Speech recognition check failed:', error);
        setSpeechSupported(false);
      }
    };
    checkSpeechSupport();
  }, []);

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
    
    // Safety check for onChange function
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
        
        {speechSupported && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Language Selector */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageSelect(!showLanguageSelect)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                disabled={disabled || isListening}
              >
                <Globe className="w-4 h-4 text-gray-500" />
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
              disabled={disabled || isListening}
              className={`h-8 w-8 p-0 ${
                isListening 
                  ? 'text-red-500 animate-pulse hover:bg-red-50' 
                  : 'text-blue-500 hover:bg-blue-50'
              }`}
              title={`Spracheingabe (${speechLanguages.find(l => l.code === speechLanguage)?.name || 'Deutsch'})`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchStages();
    // Don't auto-login - users must explicitly login with email
  }, []);

  // Load essential data only, with fallbacks
  useEffect(() => {
    const loadEssentialData = async () => {
      if (user && !showOnboarding) {
        try {
          // Only load stages - most critical for training
          await fetchStages();
          
          // Load user progress after a delay
          setTimeout(async () => {
            try {
              await fetchUserProgress(user.id);
            } catch (error) {
              console.log('User progress not available, using empty progress');
            }
          }, 2000);
          
          // Load community cases after another delay
          setTimeout(async () => {
            try {
              await fetchCommunityCases();
            } catch (error) {
              console.log('Community cases not available');
            }
          }, 4000);
        } catch (error) {
          console.error('Error loading stages:', error);
          // Create fallback stages if API fails
          setStages([
            {
              stage_number: 1,
              title: "Ideale Reaktionen: Vom Rückzug zur Verbindung",
              description: "Training Stage 1 - Kostenlos verfügbar",
              scenarios: []
            }
          ]);
        }
      }
    };
    
    loadEssentialData();
  }, [user, showOnboarding]);

  // Helper function to get current week
  Date.prototype.getWeek = function() {
    const onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  };

  // Reset AI feedback state when new scenario is selected
  useEffect(() => {
    if (selectedScenario) {
      setAiFeedback('');
      setAiFeedbackGiven(false);
      setUserResponse('');
    }
  }, [selectedScenario]);

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setStages(response.data);
      } else {
        throw new Error('Invalid stages data');
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
      // Set fallback stages for basic functionality
      setStages([{
        stage_number: 1,
        title: "Ideale Reaktionen: Vom Rückzug zur Verbindung",
        description: "Entwickle empathische Kommunikationsfähigkeiten für deine Beziehung",
        scenarios: [
          {
            id: "fallback_1",
            title: "Kommunikations-Szenario",
            description: "Fallback-Szenario für Training",
            situation: "Training wird geladen...",
            problematic_reaction: "Bitte warten...",
            ideal_reaction: "System lädt..."
          }
        ]
      }]);
    }
  };

  const fetchUserProgress = async (userId) => {
    try {
      const response = await axios.get(`${API}/progress/${userId}`);
      setUserProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await axios.post(`${API}/users`, {
        ...userData,
        avatar: userAvatar  // Include avatar in user creation
      });
      const newUser = response.data;
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      setShowOnboarding(false);
      setShowLandingPage(false);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const getAIFeedback = async (scenario, response, stageNumber) => {
    setLoading(true);
    try {
      const feedbackResponse = await axios.post(`${API}/ai-feedback`, {
        scenario_text: `${scenario.situation}: ${scenario.context}`,
        user_response: response,
        stage_number: stageNumber
      });
      setAiFeedback(feedbackResponse.data.feedback);
      setAiFeedbackGiven(true);
      
      // Save progress
      await axios.post(`${API}/progress`, {
        user_id: user.id,
        stage_number: stageNumber,
        scenario_id: scenario.id,
        user_response: response,
        ai_feedback: feedbackResponse.data.feedback,
        score: extractScoreFromFeedback(feedbackResponse.data.feedback)
      });
      
      // Refresh progress
      fetchUserProgress(user.id);
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setAiFeedback('Entschuldigung, es gab ein Problem beim Abrufen des Feedbacks. Versuche es später erneut.');
      setAiFeedbackGiven(true);
    }
    setLoading(false);
  };

  const extractScoreFromFeedback = (feedback) => {
    const scoreMatch = feedback.match(/(\d+)\/10|(\d+) von 10|Bewertung[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : 5;
  };

  // Dialog Coaching Functions
  const addDialogMessage = () => {
    if (!currentMessage.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      speaker: currentSpeaker === 'partner1' ? user?.name || 'Partner 1' : user?.partner_name || 'Partner 2',
      message: currentMessage,
      timestamp: new Date(),
      speakerType: currentSpeaker
    };
    
    setDialogMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
  };

  const analyzeDialog = async () => {
    if (dialogMessages.length < 2) {
      showNotification('Bitte füge mindestens 2 Nachrichten hinzu, um eine Analyse zu erhalten.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${API}/dialog-analysis`, {
        dialog_messages: dialogMessages.map(msg => ({
          speaker: msg.speaker,
          message: msg.message
        })),
        partner1_name: user?.name || 'Partner 1',
        partner2_name: user?.partner_name || 'Partner 2'
      });
      
      setDialogAnalysis(response.data.analysis);
      
      // Save dialog session
      await axios.post(`${API}/dialog-session`, {
        user_id: user.id,
        partner1_name: user?.name || 'Partner 1',
        partner2_name: user?.partner_name || 'Partner 2',
        messages: dialogMessages,
        analysis: response.data.analysis
      });
      
    } catch (error) {
      console.error('Error analyzing dialog:', error);
      setDialogAnalysis('Entschuldigung, es gab ein Problem bei der Dialog-Analyse. Versuche es später erneut.');
    }
    setIsAnalyzing(false);
  };

  const clearDialog = () => {
    setDialogMessages([]);
    setDialogAnalysis('');
    setCurrentMessage('');
  };

  // Weekly Training Plan Functions
  const generateWeeklyPlan = async () => {
    setLoadingWeeklyPlan(true);
    try {
      const response = await axios.post(`${API}/weekly-training-plan`, {
        user_id: user.id,
        partner1_name: user?.name || 'Partner 1',
        partner2_name: user?.partner_name || 'Partner 2',
        current_challenges: 'Kommunikation und Empathie stärken'
      });
      
      setCurrentWeekPlan(response.data.plan);
    } catch (error) {
      console.error('Error generating weekly plan:', error);
    }
    setLoadingWeeklyPlan(false);
  };

  const markExerciseComplete = async (exerciseId, type) => {
    // Update local state and save to backend
    const updatedProgress = {
      ...weeklyProgress,
      [exerciseId]: true
    };
    setWeeklyProgress(updatedProgress);
    
    // Here you could save to backend
    try {
      await axios.post(`${API}/weekly-progress`, {
        user_id: user.id,
        week_number: new Date().getWeek(),
        completed_exercises: Object.keys(updatedProgress).filter(key => updatedProgress[key]),
        overall_rating: null,
        notes: ''
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Community Cases Functions
  const fetchCommunityCases = async () => {
    setLoadingCases(true);
    try {
      const response = await axios.get(`${API}/community-cases`);
      setCommunityCases(response.data);
    } catch (error) {
      console.error('Error fetching community cases:', error);
    }
    setLoadingCases(false);
  };

  const markCaseHelpful = async (caseId) => {
    try {
      await axios.post(`${API}/community-case/${caseId}/helpful`);
      // Refresh cases to show updated helpful count
      fetchCommunityCases();
    } catch (error) {
      console.error('Error marking case as helpful:', error);
    }
  };

  const createCommunityCase = async (dialogSessionId) => {
    try {
      // Get the temporary dialog session from localStorage
      const tempDialogSession = localStorage.getItem('temp_dialog_session');
      if (!tempDialogSession) {
        showNotification('Kein Dialog zum Teilen gefunden', 'error');
        return;
      }

      const dialogData = JSON.parse(tempDialogSession);
      
      const response = await axios.post(`${API}/create-community-case-direct`, {
        messages: dialogData.messages,
        user_consent: true
      });
      
      if (response.data.success) {
        showNotification('Dialog erfolgreich anonymisiert und zur Community hinzugefügt!', 'success');
        fetchCommunityCases(); // Refresh the cases
        // Clear the temporary dialog session
        localStorage.removeItem('temp_dialog_session');
        // Clear current dialog
        setDialogMessages([]);
        setDialogAnalysis('');
      }
    } catch (error) {
      console.error('Error creating community case:', error);
      showNotification('Fehler beim Erstellen des Community Cases', 'error');
    }
  };

  // Login/Logout Functions
  const handleLogin = async (email) => {
    try {
      const response = await axios.get(`${API}/user/by-email/${encodeURIComponent(email)}`);
      
      if (response.data) {
        const userData = response.data;
        setUser(userData);
        setUserAvatar(userData.avatar);
        localStorage.setItem('empathy_user', JSON.stringify(userData));
        setShowLogin(false);
        setShowLandingPage(false);
        setShowOnboarding(false);
        fetchUserProgress(userData.id);
        showNotification(`Willkommen zurück, ${userData.name}!`, 'success');
      } else {
        showNotification('Kein Benutzer mit dieser E-Mail gefunden', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 404) {
        showNotification('Kein Benutzer mit dieser E-Mail gefunden. Bitte registrieren Sie sich zuerst.', 'warning');
      } else {
        showNotification('Fehler beim Anmelden. Bitte versuchen Sie es erneut.', 'error');
      }
    }
  };

  const handleLogout = () => {
    // Complete logout - clear everything
    localStorage.removeItem('empathy_user');
    setUser(null);
    setUserAvatar(null);
    setShowLandingPage(true);
    setShowOnboarding(false);
    setShowLogin(false);
    setUserProgress([]);
    setDialogMessages([]);
    setDialogAnalysis('');
    setSubscriptionStatus('free');
    setSelectedScenario(null);
    setCurrentStage(1);
    setUserResponse('');
    setAiResponse('');
    setLoading(false);
    
    showNotification('Erfolgreich abgemeldet', 'success');
  };

  // Contact Form Functions
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitContactForm = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    
    try {
      const response = await axios.post(`${API}/contact`, {
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message
      });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        setContactSubmitted(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => setContactSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      showNotification('Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.', 'error');
    }
    
    setContactSubmitting(false);
  };

  // Subscription Functions
  const initiateUpgrade = async (planType) => {
    setPaymentProcessing(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/checkout/session`, {
        package_type: planType,
        origin_url: originUrl
      });
      
      if (response.data.success) {
        // Show loading notification before redirect
        showNotification('Weiterleitung zu Stripe Checkout...', 'info');
        
        // Store session info for polling
        localStorage.setItem('payment_session_id', response.data.session_id);
        localStorage.setItem('payment_plan_type', planType);
        
        // Small delay to show notification, then redirect
        setTimeout(() => {
          window.location.href = response.data.url;
        }, 1000);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      showNotification('Fehler beim Starten der Zahlung. Bitte versuchen Sie es später erneut.', 'error');
    }
    setPaymentProcessing(false);
  };

  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      if (response.data.payment_status === 'paid') {
        setSubscriptionStatus('active');
        localStorage.removeItem('payment_session_id');
        localStorage.removeItem('payment_plan_type');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    if (attempts >= maxAttempts) return false;
    
    const success = await checkPaymentStatus(sessionId);
    if (success) return true;
    
    // Continue polling
    setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    return false;
  };

  // Check for returning payment on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, []);

  const hasAccessToFeature = (featureType, itemIndex = 0) => {
    if (subscriptionStatus === 'active') return true;
    
    // Free tier limitations
    switch (featureType) {
      case 'stage_1_scenarios':
        return itemIndex < 5; // First 5 scenarios of stage 1
      case 'other_stages':
        return false; // No access to stages 2-5
      case 'dialog_coaching':
        return false; // No access to dialog coaching
      case 'weekly_training':
        return false; // No access to weekly training
      case 'community_cases':
        return false; // No access to community cases
      default:
        return true;
    }
  };

  const calculateStageProgress = (stageNumber) => {
    const stageAttempts = userProgress.filter(p => p.stage_number === stageNumber);
    const stage = stages.find(s => s.stage_number === stageNumber);
    if (!stage) return 0;
    return Math.round((stageAttempts.length / stage.scenarios.length) * 100);
  };

  const getStageIcon = (stageNumber) => {
    const icons = [Heart, Users, Target, Brain, Sparkles];
    const IconComponent = icons[stageNumber - 1] || Heart;
    return <IconComponent className="w-6 h-6" />;
  };

  // Feelings Data
  const FEELINGS_DATA = [
    {
      id: "stress",
      name: "Stress / Überforderung",
      description: "Ein Zustand emotionaler und körperlicher Anspannung durch zu viele Anforderungen.",
      signs: [
        "Schnelles Sprechen oder Schweigen",
        "Unruhige Körperhaltung, Zappeln",
        "Seufzen, tiefe Atemzüge",
        "Angespannte Gesichtszüge",
        "Hektische Bewegungen"
      ],
      attention: [
        "Achte auf Veränderungen im Verhalten",
        "Beobachte körperliche Anspannung",
        "Höre auf den Tonfall in der Stimme",
        "Achte auf Rückzugsverhalten"
      ],
      needs: [
        "Entlastung und Unterstützung",
        "Verständnis und Mitgefühl",
        "Ruhe und Entspannung",
        "Struktur und Klarheit"
      ],
      empathic_responses: [
        "Ich sehe, dass du gerade viel um die Ohren hast",
        "Das scheint wirklich stressig zu sein für dich",
        "Wie kann ich dir helfen, etwas Druck rauszunehmen?",
        "Soll ich dir etwas abnehmen, damit du durchatmen kannst?"
      ]
    },
    {
      id: "sadness",
      name: "Traurigkeit / Enttäuschung",
      description: "Ein Gefühl der Niedergeschlagenheit, oft ausgelöst durch Verlust oder unerfüllte Erwartungen.",
      signs: [
        "Gesenkter Blick, wenig Augenkontakt",
        "Leisere Stimme oder Schweigen",
        "Hängende Schultern",
        "Tränen oder kämpfen gegen Tränen",
        "Rückzug, weniger Aktivität"
      ],
      attention: [
        "Beachte Veränderungen in der Körpersprache",
        "Höre auf das, was nicht gesagt wird",
        "Achte auf Rückzug und Isolation",
        "Bemerke unterdrückte Emotionen"
      ],
      needs: [
        "Trost und emotionale Nähe",
        "Verstanden und gehört werden",
        "Zeit zum Trauern",
        "Sicherheit und Geborgenheit"
      ],
      empathic_responses: [
        "Ich sehe, dass du traurig bist. Das tut mir leid",
        "Es ist okay, traurig zu sein. Deine Gefühle sind wichtig",
        "Möchtest du darüber reden oder soll ich einfach da sein?",
        "Du musst das nicht alleine durchstehen"
      ]
    },
    {
      id: "anger",
      name: "Wut / Ärger",
      description: "Eine starke emotionale Reaktion auf Ungerechtigkeit, Frustration oder Grenzverletzungen.",
      signs: [
        "Laute Stimme oder betonte Stille",
        "Angestrengte Körperhaltung",
        "Schnelle, ruckartige Bewegungen",
        "Rotes Gesicht, angespannte Kiefer",
        "Vermeidung von Blickkontakt"
      ],
      attention: [
        "Erkenne die Ursache hinter der Wut",
        "Achte auf unterdrückte Frustration",
        "Bemerke Gerechtigkeitsbedürfnis",
        "Unterscheide zwischen Wut und Verletzung"
      ],
      needs: [
        "Gehört und verstanden werden",
        "Gerechtigkeit und Fairness",
        "Respekt für Grenzen",
        "Raum für Emotionen"
      ],
      empathic_responses: [
        "Ich sehe, dass dich etwas richtig ärgert",
        "Du hast ein Recht darauf, wütend zu sein",
        "Erzähl mir, was dich so aufbringt",
        "Deine Gefühle sind berechtigt und wichtig"
      ]
    },
    {
      id: "anxiety",
      name: "Angst / Sorge",
      description: "Ein Gefühl der Ungewissheit und Befürchtung vor möglichen negativen Ereignissen.",
      signs: [
        "Unruhiges Verhalten, Nervosität",
        "Schnelles Sprechen oder Stammeln",
        "Körperliche Anspannung",
        "Katastrophendenken verbalisieren",
        "Kontrollierende Verhaltensweisen"
      ],
      attention: [
        "Höre auf wiederholte Sorgen",
        "Bemerke körperliche Anzeichen von Stress",
        "Achte auf Vermeidungsverhalten",
        "Erkenne übermäßige Vorsicht"
      ],
      needs: [
        "Sicherheit und Beruhigung",
        "Unterstützung und Rückhalt",
        "Informationen und Klarheit",
        "Vertrauen und Zuversicht"
      ],
      empathic_responses: [
        "Ich verstehe, dass du dir Sorgen machst",
        "Es ist natürlich, dass dich das beschäftigt",
        "Lass uns gemeinsam schauen, wie wir damit umgehen können",
        "Du bist nicht allein mit deinen Ängsten"
      ]
    },
    {
      id: "loneliness",
      name: "Einsamkeit / Isolation",
      description: "Das Gefühl der Trennung und des Nicht-Verbunden-Seins mit anderen Menschen.",
      signs: [
        "Rückzug aus sozialen Aktivitäten",
        "Weniger Kommunikation",
        "Melancholische Stimmung",
        "Bedürfnis nach Aufmerksamkeit",
        "Selbstzweifel äußern"
      ],
      attention: [
        "Bemerke sozialen Rückzug",
        "Achte auf Veränderungen in der Kommunikation",
        "Höre auf indirekte Bitten um Nähe",
        "Erkenne Selbstisolierung"
      ],
      needs: [
        "Verbindung und Nähe",
        "Aufmerksamkeit und Interesse",
        "Zugehörigkeit und Akzeptanz",
        "Bedeutungsvolle Gespräche"
      ],
      empathic_responses: [
        "Ich bin hier für dich, du bist nicht allein",
        "Mir ist aufgefallen, dass du dich zurückziehst",
        "Deine Gesellschaft ist mir wichtig",
        "Lass uns mehr Zeit miteinander verbringen"
      ]
    },
    {
      id: "frustration",
      name: "Frustration / Ohnmacht",
      description: "Das Gefühl der Machtlosigkeit, wenn Ziele blockiert oder Erwartungen nicht erfüllt werden.",
      signs: [
        "Seufzen und Augenrollen",
        "Wiederholende Versuche",
        "Aufgeben von Bemühungen",
        "Gereizte oder resignierte Stimmung",
        "Körperliche Verspannungen"
      ],
      attention: [
        "Erkenne wiederholte erfolglose Versuche",
        "Achte auf Resignation und Aufgeben",
        "Bemerke körperliche Anspannung",
        "Höre auf Selbstkritik"
      ],
      needs: [
        "Handlungsfähigkeit und Kontrolle",
        "Unterstützung und Hilfe",
        "Anerkennung der Bemühungen",
        "Alternative Lösungswege"
      ],
      empathic_responses: [
        "Das muss frustrierend sein, wenn nichts klappt",
        "Ich sehe, wie sehr du dich anstrengst",
        "Lass uns gemeinsam nach anderen Wegen suchen",
        "Deine Bemühungen sind nicht umsonst"
      ]
    },
    {
      id: "joy",
      name: "Freude / Begeisterung",
      description: "Ein positives Gefühl der Zufriedenheit, des Glücks und der Lebendigkeit.",
      signs: [
        "Lächeln und strahlende Augen",
        "Lebhafte Körpersprache",
        "Schnelleres, begeistertes Sprechen",
        "Aufrechte Haltung",
        "Teilen wollen von Erlebnissen"
      ],
      attention: [
        "Nimm die Begeisterung wahr",
        "Achte auf den Wunsch zu teilen",
        "Bemerke erhöhte Energie",
        "Erkenne das Bedürfnis nach Bestätigung"
      ],
      needs: [
        "Teilhabe und Mitfreude",
        "Anerkennung und Bestätigung",
        "Gemeinschaft und Verbindung",
        "Ausdruck und Teilen"
      ],
      empathic_responses: [
        "Ich freue mich mit dir! Das ist wunderbar!",
        "Deine Begeisterung ist ansteckend",
        "Erzähl mir mehr davon, ich höre gerne zu",
        "Es macht mich glücklich, dich so strahlend zu sehen"
      ]
    },
    {
      id: "guilt",
      name: "Schuld / Scham",
      description: "Negative Gefühle über eigenes Verhalten oder die eigene Person.",
      signs: [
        "Vermeidung von Blickkontakt",
        "Selbstvorwürfe und Entschuldigungen",
        "Geduckter Körperhaltung",
        "Leise oder zögernde Stimme",
        "Rechtfertigendes Verhalten"
      ],
      attention: [
        "Höre auf Selbstkritik und Vorwürfe",
        "Bemerke Rechtfertigungsversuche",
        "Achte auf Vermeidungsverhalten",
        "Erkenne übermäßige Entschuldigungen"
      ],
      needs: [
        "Vergebung und Verständnis",
        "Selbstakzeptanz",
        "Wiedergutmachung und Lösung",
        "Selbstmitgefühl"
      ],
      empathic_responses: [
        "Jeder macht Fehler, das ist menschlich",
        "Du bist trotzdem ein wertvoller Mensch",
        "Was können wir tun, um es besser zu machen?",
        "Ich urteile nicht über dich"
      ]
    }
  ];

  // Feelings Card Component
  const FeelingCard = ({ feeling }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              {feeling.name}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Weniger' : 'Mehr'}
            </Button>
          </CardTitle>
          <CardDescription>
            {feeling.description}
          </CardDescription>
        </CardHeader>
        
        {expanded && (
          <CardContent className="space-y-6">
            {/* Anzeichen */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-800">Wie macht sich das Gefühl bemerkbar?</h4>
              </div>
              <ul className="space-y-1">
                {feeling.signs.map((sign, index) => (
                  <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-1.5 w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></span>
                    {sign}
                  </li>
                ))}
              </ul>
            </div>

            {/* Worauf achten */}
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-amber-800">Worauf solltest du achten?</h4>
              </div>
              <ul className="space-y-1">
                {feeling.attention.map((point, index) => (
                  <li key={index} className="text-amber-700 text-sm flex items-start gap-2">
                    <span className="text-amber-500 mt-1.5 w-1 h-1 bg-amber-500 rounded-full flex-shrink-0"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bedürfnisse */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-purple-800">Welche Bedürfnisse liegen dahinter?</h4>
              </div>
              <ul className="space-y-1">
                {feeling.needs.map((need, index) => (
                  <li key={index} className="text-purple-700 text-sm flex items-start gap-2">
                    <span className="text-purple-500 mt-1.5 w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>

            {/* Einfühlsame Reaktionen */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-800">Einfühlsame Reaktionen - Das kannst du sagen:</h4>
              </div>
              <div className="space-y-2">
                {feeling.empathic_responses.map((response, index) => (
                  <div key={index} className="p-2 bg-green-100 rounded text-green-700 text-sm italic">
                    "{response}"
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // Landing Page Component
  const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_connect-emote/artifacts/oupuxjdj_NEUROBOND%20LOGO%2001.jpg" 
                alt="NEUROBOND Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            
            {/* Back to App Button - nur anzeigen wenn User bereits registriert ist */}
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">Willkommen zurück, {user.name}!</span>
                <Button 
                  variant="outline"
                  onClick={() => setShowLandingPage(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Zur App
                </Button>
              </div>
            )}
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stärke deine Beziehung mit 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> wissenschaftlich fundiertem </span>
              Bindungstraining
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              NEUROBOND kombiniert Neurowissenschaft mit bewährten Methoden der Paartherapie (EFT & Gottman). 
              Verbessert eure Kommunikation, löst Konflikte empathisch und baut eine tiefere emotionale Verbindung auf.
            </p>

            {/* Call-to-Action Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
              {/* Free Trial Option */}
              <div className="p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 transition-all duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Kostenlos testen</h3>
                  <p className="text-gray-600 mb-6">
                    Starte mit 5 kostenlosen Trainings-Szenarien und dem Gefühlslexikon. 
                    Perfekt um NEUROBOND kennenzulernen.
                  </p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>5 Gratis Trainings-Szenarien</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Gefühlslexikon-Zugang</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Keine Anmeldung erforderlich</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => setShowLandingPage(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-lg font-semibold rounded-xl"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Kostenlos starten
                  </Button>
                </div>
              </div>

              {/* Pro Version Option */}
              <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg border-2 border-purple-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                  BELIEBT
                </div>
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Direkt PRO starten</h3>
                  <p className="text-purple-100 mb-6">
                    Sofortiger Zugang zu allen Premium-Features und dem kompletten Trainingsprogramm.
                  </p>
                  <ul className="text-sm text-purple-100 mb-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-300" />
                      <span>Alle 5 Trainingsstufen (100+ Szenarien)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-300" />
                      <span>Dialog-Coaching mit KI-Analyse</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-300" />
                      <span>Wöchentliche Trainingspläne</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-300" />
                      <span>Community Cases & Support</span>
                    </li>
                  </ul>
                  <div className="mb-4">
                    <div className="text-3xl font-bold mb-1">CHF 10.00</div>
                    <div className="text-purple-200 text-sm">pro Monat (inkl. MWST)</div>
                  </div>
                  <Button 
                    onClick={() => {
                      setShowLandingPage(false);
                      // Wait a moment for the app to load, then show upgrade modal
                      setTimeout(() => setShowUpgradeModal(true), 1000);
                    }}
                    className="w-full bg-white text-purple-700 hover:bg-gray-100 py-3 text-lg font-semibold rounded-xl"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    PRO Version starten
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">5,000+</div>
                <div className="text-gray-600">Paare trainieren bereits</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                <div className="text-gray-600">Verbesserte Kommunikation</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">4.8/5</div>
                <div className="text-gray-600">Zufriedenheits-Rating</div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Warum NEUROBOND für eure Beziehung?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Wissenschaftlich fundiert</h3>
                <p className="text-gray-600">
                  Basiert auf EFT (Emotionally Focused Therapy) und der Gottman-Methode. 
                  Über 40 Jahre Forschung in praktische Übungen umgesetzt.
                </p>
              </Card>

              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">KI-Dialog-Coaching</h3>
                <p className="text-gray-600">
                  Dokumentiert eure echten Gespräche und erhaltet sofortiges, 
                  personalisiertes Feedback für bessere Kommunikation.
                </p>
              </Card>

              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Wöchentliche Trainingspläne</h3>
                <p className="text-gray-600">
                  Strukturierte, spielerische Übungen die eure Bindung nachhaltig stärken. 
                  Täglich nur 5-15 Minuten für spürbare Verbesserungen.
                </p>
              </Card>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              So funktioniert NEUROBOND
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">5-Stufen Training</h4>
                <p className="text-sm text-gray-600">Lernt empathische Kommunikation durch interaktive Szenarien</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Dialog-Coaching</h4>
                <p className="text-sm text-gray-600">Analysiert eure echten Gespräche mit KI-Feedback</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Wochentraining</h4>
                <p className="text-sm text-gray-600">Personalisierte Übungen basierend auf euren Bedürfnissen</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Community</h4>
                <p className="text-sm text-gray-600">Lernt von anonymisierten Erfahrungen anderer Paare</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Was Paare über NEUROBOND sagen
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Nach nur 3 Wochen mit NEUROBOND haben wir gelernt, wieder richtig miteinander zu reden. 
                  Die KI-Analyse unserer Gespräche war ein Augenöffner!"
                </p>
                <div className="font-semibold">Sarah & Michael</div>
                <div className="text-sm text-gray-500">Zusammen seit 8 Jahren</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Die wöchentlichen Trainingspläne sind genial! Nur 10 Minuten am Tag, aber der Unterschied 
                  in unserer Beziehung ist riesig. Wissenschaftlich und praktisch zugleich."
                </p>
                <div className="font-semibold">Anna & Thomas</div>
                <div className="text-sm text-gray-500">Verheiratet seit 12 Jahren</div>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Beginnt heute eure Reise zu einer stärkeren Beziehung
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Wissenschaftlich fundiert. Praktisch umsetzbar. Nachhaltig wirksam.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setShowLandingPage(false)}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Jetzt kostenlos starten
              </Button>
              <div className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5" />
                <span>Sofort verfügbar • Keine Kreditkarte nötig</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-600">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_connect-emote/artifacts/oupuxjdj_NEUROBOND%20LOGO%2001.jpg" 
                alt="NEUROBOND Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-sm">
              © 2024 NEUROBOND. Wissenschaftlich fundiertes Bindungstraining für stärkere Beziehungen.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex justify-center mb-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLandingPage(false)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Zur NEUROBOND App
                </Button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Impressum:</strong></p>
                <p>MYSYMP AG</p>
                <p>6207 Nottwil, Switzerland</p>
                <p>E-Mail: <a href="mailto:info@neurobond.ch" className="text-blue-600 hover:underline">info@neurobond.ch</a></p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  // Subscription Upgrade Modal Component
  const UpgradeModal = () => {
    return (
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              NEUROBOND PRO upgraden
            </DialogTitle>
            <DialogDescription>
              Schalten Sie alle Premium-Features frei und vertiefen Sie Ihr Bindungstraining
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Plan Selection */}
            <div className="space-y-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Monatlich</p>
                    <p className="text-sm text-gray-600">Flexibel, jederzeit kündbar</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">CHF 10.00</p>
                    <p className="text-xs text-gray-500">/Monat (inkl. MWST)</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Jährlich</p>
                    <p className="text-sm text-gray-600">2 Monate kostenlos!</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">CHF 100.00</p>
                    <p className="text-xs text-gray-500">/Jahr (inkl. MWST)</p>
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded mt-1">
                      CHF 20.00 sparen
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Features */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">PRO Features:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Alle 5 Trainingsstufen (100+ Szenarien)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Vollständiges Gefühlslexikon</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unbegrenztes Dialog-Coaching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Wöchentliche Trainingspläne</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Community Cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Persönlicher AI-Coach</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center justify-center gap-4 py-3 border-t">
              <div className="text-xs text-gray-500">Sichere Zahlung mit:</div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Visa, Mastercard, PayPal, TWINT</span>
              </div>
            </div>

            <Button 
              onClick={() => initiateUpgrade(selectedPlan)}
              disabled={paymentProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {paymentProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Jetzt PRO werden
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Premium Feature Lock Component
  const PremiumLock = ({ featureType }) => {
    const getFeatureDetails = () => {
      switch (featureType) {
        case 'stages':
          return {
            title: 'Erweiterte Trainingsstufen',
            description: 'Schalten Sie Stufe 2-5 mit über 80 zusätzlichen Szenarien frei'
          };
        case 'dialog':
          return {
            title: 'Dialog-Coaching',
            description: 'Analysieren Sie Ihre echten Gespräche mit KI-gestütztem Feedback'
          };
        case 'weekly':
          return {
            title: 'Wöchentliche Trainingspläne',
            description: 'Personalisierte, wissenschaftlich fundierte Wochenprogramme'
          };
        case 'community':
          return {
            title: 'Community Cases',
            description: 'Lernen Sie von anonymisierten Erfahrungen anderer Paare'
          };
        default:
          return {
            title: 'Premium Feature',
            description: 'Dieses Feature ist nur für PRO-Mitglieder verfügbar'
          };
      }
    };

    const details = getFeatureDetails();

    return (
      <div className="text-center py-12 px-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{details.title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{details.description}</p>
        <Button 
          onClick={() => setShowUpgradeModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3"
        >
          <Crown className="w-4 h-4 mr-2" />
          Jetzt upgraden
        </Button>
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

    const handleSubmit = (e) => {
      e.preventDefault();
      createUser(formData);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_connect-emote/artifacts/oupuxjdj_NEUROBOND%20LOGO%2001.jpg" 
                alt="NEUROBOND Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardDescription className="text-gray-600">
              Wissenschaftlich fundiertes Bindungstraining für stärkere Beziehungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                {/* Avatar Upload Section */}
                <div className="flex justify-center mb-6">
                  <AvatarUpload 
                    userId="temp-user" 
                    currentAvatar={userAvatar}
                    onAvatarUpdate={setUserAvatar}
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Dein Name</Label>
                  <SpeechInput
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                    placeholder="z.B. Adam"
                    className="mt-1"
                    name="name"
                  />
                </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <SpeechInput
                  value={formData.email}
                  onChange={(value) => setFormData({...formData, email: value})}
                  placeholder="adam@example.com"
                  className="mt-1"
                  name="email"
                />
              </div>
              <div>
                <Label htmlFor="partner_name">Name deines Partners (optional)</Label>
                <SpeechInput
                  value={formData.partner_name}
                  onChange={(value) => setFormData({...formData, partner_name: value})}
                  placeholder="z.B. Linda"
                  className="mt-1"
                  name="partner_name"
                />
              </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                NEUROBOND starten
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Scenario Practice Component
  const ScenarioCard = ({ scenario, stageNumber, isLocked = false }) => {
    return (
      <Card className={`mb-4 transition-shadow ${isLocked ? 'opacity-60' : 'hover:shadow-lg'}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {scenario.situation}
            {isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-2">📋 Situation:</p>
              <p className="text-blue-600">{scenario.context}</p>
            </div>
            
            {isLocked ? (
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                PRO upgraden für Zugang
              </Button>
            ) : (
              <Button 
                onClick={() => setSelectedScenario(scenario)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Deine Reaktion eingeben
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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
    // Ensure test user is free user
    setSubscriptionStatus('free');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_connect-emote/artifacts/oupuxjdj_NEUROBOND%20LOGO%2001.jpg" 
              alt="NEUROBOND Logo" 
              className="h-12 md:h-16 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-blue-300 flex-shrink-0">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.name} Avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-full h-full text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <p className="text-gray-600 text-lg">
                  Willkommen zurück, {user?.name}! {user?.partner_name && `Stärkt eure Bindung - ${user.name} und ${user.partner_name}.`}
                </p>
                {subscriptionStatus === 'active' && (
                  <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    <Crown className="w-4 h-4" />
                    PRO
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {speechSupported && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                  <Mic className="w-3 h-3" />
                  <span>{speechLanguages.find(l => l.code === speechLanguage)?.flag}</span>
                  <span>{speechLanguages.find(l => l.code === speechLanguage)?.name}</span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLandingPage(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Startseite
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Clear user data and return to landing page
                  localStorage.removeItem('empathy_user');
                  setUser(null);
                  setShowLandingPage(true);
                  setUserProgress([]);
                  setDialogMessages([]);
                  setDialogAnalysis('');
                  setSubscriptionStatus('free');
                }}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Abmelden
              </Button>
            </div>
          </div>
          {subscriptionStatus === 'free' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800">
                    🚀 Sie nutzen die kostenlose Version
                  </p>
                  <p className="text-xs text-blue-600">
                    Upgraden Sie zu PRO für alle Features
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              NEUROBOND Fortschritt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stages.map((stage) => (
                <div key={stage.stage_number} className="text-center">
                  <div className="mb-2 flex justify-center">
                    {getStageIcon(stage.stage_number)}
                  </div>
                  <p className="text-sm font-medium mb-2">Stufe {stage.stage_number}</p>
                  <Progress 
                    value={calculateStageProgress(stage.stage_number)} 
                    className="w-full h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculateStageProgress(stage.stage_number)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Training Stages */}
        <Tabs defaultValue="stages" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-1 h-auto p-1 bg-gray-100 rounded-xl">
              <TabsTrigger 
                value="stages" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Training</span>
                <span className="sm:hidden">Stufen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="feelings" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Gefühle</span>
                <span className="sm:hidden">Lexikon</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dialogue" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Dialog</span>
                <span className="sm:hidden">Coach</span>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Cases</span>
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Wochen</span>
                <span className="sm:hidden">Pläne</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Kontakt</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger 
                value="progress" 
                className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Fortschritt</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="stages" className="space-y-6">
            {stages.map((stage) => (
              <Card key={stage.stage_number} className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                        {getStageIcon(stage.stage_number)}
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          Stufe {stage.stage_number}: {stage.title}
                          {stage.stage_number > 1 && subscriptionStatus === 'free' && (
                            <Lock className="w-4 h-4 text-yellow-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {stage.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {stage.stage_number === 1 && subscriptionStatus === 'free' 
                          ? '5 kostenlose Szenarien' 
                          : `${stage.scenarios.length} Szenarien`
                        }
                      </Badge>
                      {stage.stage_number > 1 && subscriptionStatus === 'free' && (
                        <Badge className="bg-yellow-100 text-yellow-800">PRO</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hasAccessToFeature('other_stages') || stage.stage_number === 1 ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        {stage.scenarios.slice(0, hasAccessToFeature('stage_1_scenarios', 999) ? 999 : 5).map((scenario, index) => (
                          <ScenarioCard 
                            key={scenario.id} 
                            scenario={scenario} 
                            stageNumber={stage.stage_number}
                            isLocked={stage.stage_number === 1 && !hasAccessToFeature('stage_1_scenarios', index)}
                          />
                        ))}
                      </div>
                      {stage.scenarios.length > 2 && (stage.stage_number === 1 || hasAccessToFeature('other_stages')) && (
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentStage(stage)}
                          className="w-full mt-4"
                        >
                          Alle {stage.scenarios.length} Szenarien anzeigen
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      {stage.stage_number === 1 && subscriptionStatus === 'free' && stage.scenarios.length > 5 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                {stage.scenarios.length - 5} weitere Szenarien verfügbar
                              </p>
                              <p className="text-xs text-yellow-600">
                                Upgraden Sie zu PRO für alle Inhalte
                              </p>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => setShowUpgradeModal(true)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              PRO
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <PremiumLock featureType="stages" />
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="feelings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-rose-500" />
                  NEUROBOND Gefühlslexikon
                </CardTitle>
                <CardDescription>
                  Wissenschaftlich fundiertes Wissen über Emotionen und empathische Kommunikation. 
                  {user?.partner_name && ` Verstehe ${user.partner_name} besser und stärke eure Verbindung.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {FEELINGS_DATA.map((feeling) => (
                    <FeelingCard key={feeling.id} feeling={feeling} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dialogue" className="space-y-6">
            {hasAccessToFeature('dialog_coaching') ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    NEUROBOND Dialog-Coaching
                  </CardTitle>
                  <CardDescription>
                    Haltet euer echtes Gespräch fest und erhaltet sofortige KI-Analyse eurer Kommunikationsmuster. 
                    {user?.partner_name && ` Verbessert die Kommunikation zwischen ${user.name} und ${user.partner_name}.`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dialog Entry Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Neuen Dialog hinzufügen</span>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={currentSpeaker === 'partner1' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentSpeaker('partner1')}
                      >
                        {user?.name || 'Partner 1'}
                      </Button>
                      <Button
                        variant={currentSpeaker === 'partner2' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentSpeaker('partner2')}
                      >
                        {user?.partner_name || 'Partner 2'}
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <SpeechInput
                        placeholder={`Was sagt ${currentSpeaker === 'partner1' ? (user?.name || 'Partner 1') : (user?.partner_name || 'Partner 2')}?`}
                        value={currentMessage}
                        onChange={setCurrentMessage}
                        multiline={true}
                        className="flex-1"
                        name="dialog-message"
                      />
                      <Button
                        onClick={() => {
                          if (currentMessage.trim()) {
                            const newMessage = {
                              id: Date.now().toString(),
                              speakerType: currentSpeaker,
                              speaker: currentSpeaker === 'partner1' ? (user?.name || 'Partner 1') : (user?.partner_name || 'Partner 2'),
                              message: currentMessage.trim(),
                              timestamp: new Date().toISOString()
                            };
                            setDialogMessages([...dialogMessages, newMessage]);
                            setCurrentMessage('');
                          }
                        }}
                        disabled={!currentMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Dialog Messages Display */}
                  {dialogMessages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Aktueller Dialog</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={analyzeDialog}
                            disabled={dialogMessages.length < 2 || isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Analysiert...
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4 mr-2" />
                                Analysieren
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (dialogMessages.length >= 2) {
                                // Create a temporary dialog session for sharing
                                const dialogSession = {
                                  id: Date.now().toString(),
                                  messages: dialogMessages,
                                  created_at: new Date().toISOString()
                                };
                                // Store temporarily for community sharing
                                localStorage.setItem('temp_dialog_session', JSON.stringify(dialogSession));
                                createCommunityCase(dialogSession.id);
                              }
                            }}
                            disabled={dialogMessages.length < 2}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Anonymisiert teilen
                          </Button>
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                        {dialogMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.speakerType === 'partner1' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              msg.speakerType === 'partner1' 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-green-100 text-green-900'
                            }`}>
                              <div className="font-semibold text-sm">{msg.speaker}</div>
                              <div>{msg.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogMessages([]);
                          setDialogAnalysis('');
                        }}
                      >
                        Dialog löschen
                      </Button>
                    </div>
                  )}

                  {/* AI Analysis Results */}
                  {dialogAnalysis && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">🤖 KI-Analyse eures Dialogs:</h4>
                      <div className="text-yellow-700 whitespace-pre-line">{dialogAnalysis}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    NEUROBOND Dialog-Coaching
                    <Lock className="w-4 h-4 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PremiumLock featureType="dialog" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {hasAccessToFeature('weekly_training') ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    NEUROBOND Wochentraining
                  </CardTitle>
                  <CardDescription>
                    Wissenschaftlich fundierte Trainingspläne basierend auf EFT und Gottman-Methode. 
                    Wöchentliche Bindungsübungen für nachhaltiges Beziehungswachstum.
                    {user?.partner_name && ` Perfekt für ${user.name} und ${user.partner_name}!`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Weekly training content would go here */}
                  <p className="text-center py-8 text-gray-500">Wöchentliches Training Inhalt...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    NEUROBOND Wochentraining
                    <Lock className="w-4 h-4 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PremiumLock featureType="weekly" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            {hasAccessToFeature('community_cases') ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    NEUROBOND Community Cases
                  </CardTitle>
                  <CardDescription>
                    Lerne von anonymisierten Dialogen anderer Paare. Entdecke bewährte Lösungsansätze 
                    für häufige Kommunikationsherausforderungen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Community cases content would go here */}
                  <p className="text-center py-8 text-gray-500">Community Cases Inhalt...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    NEUROBOND Community Cases
                    <Lock className="w-4 h-4 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PremiumLock featureType="community" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900">Mein Profil</h3>
                <p className="text-gray-600">Verwalten Sie Ihre persönlichen Daten</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <AvatarUpload 
                      userId={user?.id} 
                      currentAvatar={user?.avatar}
                      onAvatarUpdate={(newAvatar) => {
                        setUser(prev => ({ ...prev, avatar: newAvatar }));
                        // Update localStorage
                        const updatedUser = { ...user, avatar: newAvatar };
                        localStorage.setItem('empathy_user', JSON.stringify(updatedUser));
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Name</Label>
                      <p className="text-lg text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">E-Mail</Label>
                      <p className="text-lg text-gray-900">{user?.email}</p>
                    </div>
                    {user?.partner_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Partner</Label>
                        <p className="text-lg text-gray-900">{user.partner_name}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="flex items-center gap-2">
                        {subscriptionStatus === 'active' ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            PRO Mitglied
                          </Badge>
                        ) : (
                          <Badge variant="outline">Kostenlose Version</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Kontakt & Support
                </CardTitle>
                <CardDescription>
                  Haben Sie Fragen zu NEUROBOND oder benötigen Unterstützung? 
                  Wir helfen Ihnen gerne weiter!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Kontakt-Informationen</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">E-Mail</p>
                          <a 
                            href="mailto:info@neurobond.ch" 
                            className="text-blue-600 hover:underline"
                          >
                            info@neurobond.ch
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Adresse</p>
                          <p className="text-gray-600">
                            MYSYMP AG<br />
                            6207 Nottwil<br />
                            Switzerland
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Häufige Fragen</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-blue-800 text-sm">Wie kann ich mein Training fortsetzen?</p>
                        <p className="text-blue-600 text-sm mt-1">
                          Ihre Fortschritte werden automatisch gespeichert. Loggen Sie sich einfach wieder ein.
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-green-800 text-sm">Ist NEUROBOND wissenschaftlich fundiert?</p>
                        <p className="text-green-600 text-sm mt-1">
                          Ja, basiert auf EFT und Gottman-Methode mit über 40 Jahren Forschung.
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="font-medium text-purple-800 text-sm">Kann ich NEUROBOND mit meinem Partner nutzen?</p>
                        <p className="text-purple-600 text-sm mt-1">
                          Absolut! NEUROBOND ist speziell für Paare entwickelt worden.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold mb-4">Nachricht senden</h3>
                  
                  {contactSubmitted && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">Nachricht erfolgreich gesendet!</p>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        Wir werden uns schnellstmöglich bei Ihnen melden.
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={submitContactForm} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-name">Name *</Label>
                        <SpeechInput
                          value={contactForm.name}
                          onChange={(value) => setContactForm(prev => ({...prev, name: value}))}
                          placeholder="Ihr Name"
                          className="mt-1"
                          name="contact-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">E-Mail *</Label>
                        <SpeechInput
                          value={contactForm.email}
                          onChange={(value) => setContactForm(prev => ({...prev, email: value}))}
                          placeholder="ihre.email@example.com"
                          className="mt-1"
                          name="contact-email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="contact-subject">Betreff</Label>
                      <SpeechInput
                        value={contactForm.subject}
                        onChange={(value) => setContactForm(prev => ({...prev, subject: value}))}
                        placeholder="Worum geht es?"
                        className="mt-1"
                        name="contact-subject"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contact-message">Nachricht *</Label>
                      <SpeechInput
                        value={contactForm.message}
                        onChange={(value) => setContactForm(prev => ({...prev, message: value}))}
                        placeholder="Beschreiben Sie Ihr Anliegen..."
                        multiline={true}
                        className="mt-1 min-h-[120px]"
                        name="contact-message"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={contactSubmitting || !contactForm.name || !contactForm.email || !contactForm.message}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      {contactSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Nachricht senden
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Additional Information */}
                <div className="border-t pt-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold mb-3">Datenschutz</h4>
                      <p className="text-sm text-gray-600">
                        Ihre Daten werden vertraulich behandelt und nur zur Bearbeitung 
                        Ihrer Anfrage verwendet. Weitere Informationen finden Sie in 
                        unserer Datenschutzerklärung.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Antwortzeit</h4>
                      <p className="text-sm text-gray-600">
                        Wir bemühen uns, alle Anfragen innerhalb von 24 Stunden zu beantworten. 
                        Bei technischen Problemen können Sie uns auch direkt per E-Mail erreichen.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>NEUROBOND Trainingshistorie</CardTitle>
                <CardDescription>
                  Übersicht über alle deine Übungen, Dialog-Sessions und Wochenfortschritte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProgress.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Noch keine Übungen absolviert. Beginne mit Stufe 1!
                    </p>
                  ) : (
                    userProgress.slice(-10).reverse().map((progress, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">Stufe {progress.stage_number}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">{progress.score || 'N/A'}/10</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Deine Antwort:</strong> {progress.user_response.slice(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(progress.completed_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade Modal */}
        {showUpgradeModal && <UpgradeModal />}

        {/* Scenario Practice Dialog */}
        <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedScenario && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Szenario üben
                  </DialogTitle>
                  <DialogDescription>
                    {selectedScenario.situation}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* 1. Situation beschreiben */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">📋 Situation:</p>
                    <p className="text-blue-700">{selectedScenario.context}</p>
                  </div>

                  {/* 2. User Response Feld */}
                  <div className="space-y-2">
                    <Label htmlFor="response" className="text-lg font-medium">💭 Wie würdest du reagieren?</Label>
                    <SpeechInput
                      value={userResponse}
                      onChange={setUserResponse}
                      placeholder="Schreibe hier deine Reaktion auf diese Situation..."
                      multiline={true}
                      className="min-h-[120px]"
                      name="user-response"
                    />
                  </div>

                  <Button 
                    onClick={() => getAIFeedback(selectedScenario, userResponse, currentStage?.stage_number || 1)}
                    disabled={!userResponse.trim() || loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {loading ? 'AI analysiert...' : 'Deine Reaktion bewerten lassen'}
                  </Button>

                  {/* 3. AI Feedback Bewertung */}
                  {aiFeedback && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                      <p className="font-medium text-yellow-800 mb-2">🤖 Bewertung deiner Reaktion:</p>
                      <div className="text-yellow-700 whitespace-pre-wrap">{aiFeedback}</div>
                    </div>
                  )}

                  {/* 4. Falsche und ideale Reaktion (wird nur nach AI Feedback gezeigt) */}
                  {aiFeedbackGiven && (
                    <div className="space-y-3">
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                        <p className="font-medium text-red-800 mb-2">❌ Beispiel einer problematischen Reaktion:</p>
                        <p className="text-red-700">{selectedScenario.wrong_reaction}</p>
                        <p className="text-xs text-red-600 mt-2 italic">
                          💡 So solltest du NICHT reagieren - dies kann die Situation verschlimmern.
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                        <p className="font-medium text-green-800 mb-2">✅ Beispiel einer idealen Reaktion:</p>
                        <p className="text-green-700">{selectedScenario.ideal_reaction}</p>
                        {selectedScenario.effect && (
                          <div className="mt-3 p-3 bg-green-100 rounded-lg">
                            <p className="text-sm font-medium text-green-800 mb-1">🌟 Positive Wirkung:</p>
                            <p className="text-green-700 text-sm">{selectedScenario.effect}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>💭 Reflexion:</strong> Vergleiche deine ursprüngliche Antwort mit diesen Beispielen. 
                          Was kannst du für zukünftige ähnliche Situationen mitnehmen?
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Current Stage Detail Dialog */}
        <Dialog open={!!currentStage} onOpenChange={() => setCurrentStage(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {currentStage && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                      {getStageIcon(currentStage.stage_number)}
                    </div>
                    Stufe {currentStage.stage_number}: {currentStage.title}
                  </DialogTitle>
                  <DialogDescription>
                    {currentStage.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {currentStage.scenarios.map((scenario) => (
                    <ScenarioCard 
                      key={scenario.id} 
                      scenario={scenario} 
                      stageNumber={currentStage.stage_number}
                    />
                  ))}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

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
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {notification.type === 'info' && <Info className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
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