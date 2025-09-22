import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ArrowRight, Send, User, MessageCircle, Target, CheckCircle, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TrainingScenario = ({ scenarioId, userId, userName, partnerName, onComplete }) => {
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('conversation'); // conversation, evaluation, completed
  const [evaluation, setEvaluation] = useState(null);

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
          <p className="text-gray-300">{sessionData?.scenario?.context}</p>
          <div className="flex justify-center gap-2 mt-4">
            {sessionData?.scenario?.learning_goals?.map((goal, index) => (
              <span key={index} className="bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm">
                {goal}
              </span>
            ))}
          </div>
        </div>

        {currentPhase === 'conversation' && (
          <>
            {/* Conversation Area */}
            <Card className="bg-gray-800/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 rounded-3xl mb-6">
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.speaker === userName ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.speaker === userName 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-100'
                      }`}>
                        <div className="text-xs text-gray-300 mb-1">{msg.speaker}</div>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {responding && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
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
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Wie antworten Sie empathisch?"
                    className="flex-1 bg-gray-700/50 border-gray-600 rounded-xl text-white placeholder-gray-400"
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
                  Denken Sie daran: Zeigen Sie Empathie, stellen Sie offene Fragen, und bestätigen Sie die Gefühle.
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
              <Button
                onClick={() => onComplete && onComplete()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Zurück zu Training Stufen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrainingScenario;