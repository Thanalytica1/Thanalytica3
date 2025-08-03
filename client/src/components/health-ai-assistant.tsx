import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { healthAI } from "@/lib/health-ai";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  confidence?: number;
  actionItems?: string[];
}

interface HealthAIAssistantProps {
  className?: string;
}

export function HealthAIAssistant({ className }: HealthAIAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [goals, setGoals] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'symptoms' | 'goals'>('chat');

  const addMessage = (type: 'user' | 'ai', message: string, confidence?: number, actionItems?: string[]) => {
    const newMessage: Conversation = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      confidence,
      actionItems
    };
    setConversation(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user?.id) return;

    addMessage('user', currentMessage);
    setIsLoading(true);

    try {
      const response = await healthAI.answerHealthQuestion(currentMessage, user.id);
      addMessage('ai', response, 0.85);
      setCurrentMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptoms.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      const symptomList = symptoms.split(',').map(s => s.trim()).filter(s => s);
      const insight = await healthAI.analyzeSymptoms(symptomList, user.id);
      
      addMessage('user', `Analyze symptoms: ${symptoms}`);
      addMessage('ai', insight.response, insight.confidence, [
        "Consult with healthcare provider",
        "Monitor symptoms closely",
        "Consider lifestyle adjustments"
      ]);
      setSymptoms("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestInterventions = async () => {
    if (!goals.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      const goalList = goals.split(',').map(g => g.trim()).filter(g => g);
      const recommendations = await healthAI.suggestInterventions(goalList, user.id);
      
      addMessage('user', `My health goals: ${goals}`);
      const interventions = recommendations.map(r => `${r.title}: ${r.description}`).join('\n\n');
      addMessage('ai', `Based on your goals, here are personalized interventions:\n\n${interventions}`, 0.88, 
        recommendations.map(r => r.title));
      setGoals("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to generate interventions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <span>Health AI Assistant</span>
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chat')}
            className="flex-1"
          >
            <Brain className="w-4 h-4 mr-1" />
            Chat
          </Button>
          <Button
            variant={activeTab === 'symptoms' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('symptoms')}
            className="flex-1"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Symptoms
          </Button>
          <Button
            variant={activeTab === 'goals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('goals')}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-1" />
            Goals
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3/4 p-3 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  {msg.confidence && (
                    <Badge className={`mt-2 text-xs ${getConfidenceColor(msg.confidence)}`}>
                      {Math.round(msg.confidence * 100)}% confidence
                    </Badge>
                  )}
                  {msg.actionItems && msg.actionItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about your health, symptoms, or longevity strategies..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMessage("What's my biological age?")}
                className="text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Biological Age
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMessage("How can I improve my longevity?")}
                className="text-xs"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Longevity Tips
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMessage("Analyze my health trends")}
                className="text-xs"
              >
                <Brain className="w-3 h-3 mr-1" />
                Health Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          <div className="space-y-3">
            <Textarea
              placeholder="Describe your symptoms (comma-separated): fatigue, headache, joint pain..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAnalyzeSymptoms}
              disabled={isLoading || !symptoms.trim()}
              className="w-full"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Analyze Symptoms
            </Button>
            <p className="text-xs text-gray-600">
              Note: This is not medical advice. Always consult healthcare professionals for medical concerns.
            </p>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-3">
            <Textarea
              placeholder="Enter your health goals (comma-separated): lose weight, improve sleep, reduce stress, increase energy..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleSuggestInterventions}
              disabled={isLoading || !goals.trim()}
              className="w-full"
            >
              <Target className="w-4 h-4 mr-2" />
              Get Personalized Plan
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">AI is thinking...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}