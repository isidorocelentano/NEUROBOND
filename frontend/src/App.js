import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Heart, Users, Target, Brain, Sparkles, Trophy, Star, ArrowRight, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  useEffect(() => {
    fetchStages();
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('empathy_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setShowOnboarding(false);
      fetchUserProgress(userData.id);
    }
  }, []);

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
      const response = await axios.get(`${API}/stages`);
      setStages(response.data);
    } catch (error) {
      console.error('Error fetching stages:', error);
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
      const response = await axios.post(`${API}/users`, userData);
      const newUser = response.data;
      setUser(newUser);
      localStorage.setItem('empathy_user', JSON.stringify(newUser));
      setShowOnboarding(false);
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Empathie Meisterschaft
            </CardTitle>
            <CardDescription className="text-gray-600">
              Werde zum Experten für emotionale Verbindung in deiner Beziehung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Dein Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="z.B. Adam"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="adam@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner_name">Name deines Partners (optional)</Label>
                <Input
                  id="partner_name"
                  type="text"
                  placeholder="z.B. Linda"
                  value={formData.partner_name}
                  onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                Training beginnen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Scenario Practice Component
  const ScenarioCard = ({ scenario, stageNumber }) => {
    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {scenario.situation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Kontext:</p>
              <p className="text-gray-600">{scenario.context}</p>
            </div>
            
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-2">❌ Falsche Reaktion:</p>
              <p className="text-red-600">{scenario.wrong_reaction}</p>
            </div>
            
            <Button 
              onClick={() => setSelectedScenario(scenario)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Szenario üben
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showOnboarding) {
    return <OnboardingForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Empathie Meisterschaft
          </h1>
          <p className="text-gray-600 text-lg">
            Willkommen zurück, {user?.name}! {user?.partner_name && `Trainiere für deine Beziehung mit ${user.partner_name}.`}
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Dein Fortschritt
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stages">Training Stufen</TabsTrigger>
            <TabsTrigger value="progress">Mein Fortschritt</TabsTrigger>
          </TabsList>
          
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
                        <CardTitle className="text-xl">
                          Stufe {stage.stage_number}: {stage.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {stage.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {stage.scenarios.length} Szenarien
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {stage.scenarios.slice(0, 2).map((scenario) => (
                      <ScenarioCard 
                        key={scenario.id} 
                        scenario={scenario} 
                        stageNumber={stage.stage_number}
                      />
                    ))}
                  </div>
                  {stage.scenarios.length > 2 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStage(stage)}
                      className="w-full mt-4"
                    >
                      Alle {stage.scenarios.length} Szenarien anzeigen
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="progress">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Deine Übungshistorie</CardTitle>
                <CardDescription>
                  Übersicht über alle deine Antworten und das AI-Feedback
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
                    <Textarea
                      id="response"
                      placeholder="Schreibe hier deine Reaktion auf diese Situation..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      className="min-h-[120px]"
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

                  {/* 4. Falsche Reaktion (wird nur nach AI Feedback gezeigt) */}
                  {aiFeedbackGiven && (
                    <div className="space-y-3">
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                        <p className="font-medium text-red-800 mb-2">❌ Beispiel einer problematischen Reaktion:</p>
                        <p className="text-red-700">{selectedScenario.wrong_reaction}</p>
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