import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle, Play, Crown, Rocket, User, UserCheck, Mic, Globe, Camera, Upload, UserCircle, MicOff, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EmpathyTrainingApp = () => {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [currentTab, setCurrentTab] = useState('home');

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
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setShowLandingPage(false);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.log('Error restoring user:', error);
    }
  }, []);

  // Landing Page Component
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

  // Onboarding Component
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
        partner_name: formData.partner_name
      };
      
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      setShowOnboarding(false);
      setShowLandingPage(false);
      showNotification(`Willkommen, ${formData.name}! Ihr Profil wurde erfolgreich erstellt.`, 'success');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
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

          <Card className="bg-white/90 backdrop-blur-lg shadow-2xl border border-white/20 rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">Dein Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="z.B. Adam"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">E-Mail-Adresse *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="adam@example.com"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="partner_name" className="text-gray-700 font-medium">Name deines Partners</Label>
                    <Input
                      id="partner_name"
                      value={formData.partner_name}
                      onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                      placeholder="z.B. Linda (optional)"
                      className="mt-2 bg-gray-50 border-gray-200 rounded-xl"
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
                      Sprachsteuerung verfügbar
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

  // Training Component
  const TrainingComponent = () => {
    const [currentStage, setCurrentStage] = useState(1);
    const [currentScenario, setCurrentScenario] = useState(null);
    const [userResponse, setUserResponse] = useState('');

    const scenarios = [
      {
        id: 1,
        stage: 1,
        title: "Konflikt um Hausarbeit",
        situation: "Dein Partner sagt: 'Du hilfst nie im Haushalt! Ich mache immer alles alleine.'",
        options: [
          { id: 1, text: "Das stimmt nicht! Ich helfe sehr wohl!", type: "problematic" },
          { id: 2, text: "Du übertreibst total, ich mache auch vieles.", type: "problematic" },
          { id: 3, text: "Es tut mir leid, dass du dich allein gelassen fühlst. Lass uns darüber sprechen.", type: "empathetic" }
        ]
      },
      {
        id: 2,
        stage: 1,
        title: "Zeitmangel in der Beziehung",
        situation: "Dein Partner sagt: 'Wir verbringen gar keine Zeit mehr miteinander. Dir sind andere Sachen wichtiger.'",
        options: [
          { id: 1, text: "Das ist unfair! Ich arbeite hart für uns beide.", type: "problematic" },
          { id: 2, text: "Ich verstehe, dass du mehr gemeinsame Zeit brauchst. Das ist mir auch wichtig.", type: "empathetic" },
          { id: 3, text: "Du weißt doch, wie stressig mein Job ist!", type: "problematic" }
        ]
      }
    ];

    const handleResponse = (option) => {
      let feedback = "";
      if (option.type === "empathetic") {
        feedback = "✅ Ausgezeichnet! Diese Antwort zeigt Empathie und Verständnis. Sie validiert die Gefühle deines Partners und öffnet den Dialog für eine konstruktive Lösung.";
      } else {
        feedback = "❌ Diese Antwort könnte defensiv wirken. Versuche stattdessen, die Gefühle deines Partners zu verstehen und zu validieren, bevor du deine Sicht erklärst.";
      }
      
      showNotification(feedback, option.type === "empathetic" ? "success" : "warning");
      
      // Next scenario or complete stage
      const nextScenario = scenarios.find(s => s.id > currentScenario.id && s.stage === currentStage);
      if (nextScenario) {
        setTimeout(() => setCurrentScenario(nextScenario), 3000);
      } else {
        setTimeout(() => {
          showNotification("Stufe 1 abgeschlossen! 🎉", "success");
          setCurrentScenario(null);
        }, 3000);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
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
                      <p className="text-xs text-gray-500">Training Stufen</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTab('home')}
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Zurück zum Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            {!currentScenario ? (
              // Stage Selection
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Training Stufen</h2>
                  <p className="text-xl text-gray-600">Wähle eine Stufe zum Üben empathischer Kommunikation</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5].map(stage => (
                    <Card 
                      key={stage}
                      className={`${stage === 1 ? 'bg-white/80 cursor-pointer hover:shadow-lg' : 'bg-gray-100/60'} backdrop-blur-sm border transition-all`}
                      onClick={stage === 1 ? () => setCurrentScenario(scenarios[0]) : undefined}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className={`w-5 h-5 ${stage === 1 ? 'text-blue-600' : 'text-gray-400'}`} />
                          Stufe {stage}
                          {stage > 1 && <Crown className="w-4 h-4 text-yellow-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`mb-4 ${stage === 1 ? 'text-gray-600' : 'text-gray-400'}`}>
                          {stage === 1 && "Grundlagen empathischer Kommunikation"}
                          {stage === 2 && "Aktives Zuhören und Validation"}
                          {stage === 3 && "Konfliktlösung mit Empathie"}
                          {stage === 4 && "Emotionale Intelligenz vertiefen"}
                          {stage === 5 && "Meisterschaft in Beziehungskommunikation"}
                        </p>
                        <div className="flex gap-2">
                          {stage === 1 ? (
                            <>
                              <Badge variant="secondary">Kostenlos</Badge>
                              <Button size="sm" className="ml-auto">
                                <Play className="w-4 h-4 mr-1" />
                                Starten
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">PRO erforderlich</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Scenario Practice
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Stufe {currentScenario.stage}</Badge>
                    <Badge variant="outline">Szenario {currentScenario.id}</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentScenario.title}</h2>
                </div>

                <Card className="bg-white/80 backdrop-blur-sm shadow-lg mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Situation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-lg italic">"{currentScenario.situation}"</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Wie würdest du antworten?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentScenario.options.map(option => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full p-4 h-auto text-left justify-start hover:bg-blue-50"
                        onClick={() => handleResponse(option)}
                      >
                        <span className="text-sm leading-relaxed">{option.text}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = () => {
    if (currentTab === 'training') {
      return <TrainingComponent />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
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
                      <UserCircle className="w-full h-full text-gray-400" />
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
                    onClick={() => {
                      setUser(null); 
                      setShowLandingPage(true); 
                      localStorage.removeItem('empathy_user');
                      showNotification('Erfolgreich abgemeldet', 'success');
                    }}
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
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Willkommen zurück, {user && user.name}! 👋
              </h2>
              {user && user.partner_name && (
                <p className="text-xl text-gray-600 mb-6">
                  Stärkt eure Bindung - <span className="font-semibold">{user.name}</span> und <span className="font-semibold">{user.partner_name}</span>
                </p>
              )}
              
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card 
                className="bg-white/60 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setCurrentTab('training')}
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
                    <Button size="sm" className="ml-auto" onClick={(e) => {e.stopPropagation(); setCurrentTab('training');}}>
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
                  <p className="text-gray-600 mb-4">Einstellungen und Fortschritt</p>
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