import { createRoute, type RootRoute } from "@tanstack/react-router";
import { useUser } from "@/lib/hooks";
import { DecoButton } from "@/components/deco-button";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { useCreateIncidentFromAI, useIncidentStatusInfo, useSeverityInfo } from "@/hooks/useIncidents";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

function IncidentPreview({ incident }: { incident: any }) {
  const statusInfo = useIncidentStatusInfo(incident.status);

  return (
    <div 
      className="border rounded-lg p-4"
      style={{ 
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--card-foreground)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{incident.title}</h3>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}
        >
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>
      
      {incident.affectedResources && incident.affectedResources.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Affected Resources:
          </p>
          <div className="flex flex-wrap gap-2">
            {incident.affectedResources.map((resource: any, index: number) => {
              const severityInfo = useSeverityInfo(resource.severity);
              return (
                <span 
                  key={index}
                  className={`px-2 py-1 rounded text-xs border ${severityInfo.className}`}
                >
                  {resource.resource} • {severityInfo.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {incident.timeline && incident.timeline.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Timeline:
          </p>
          <div className="space-y-2">
            {incident.timeline.map((event: any, index: number) => (
              <div key={index} className="text-sm">
                • {event.event}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {incident.commitments && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Commitments:
          </p>
          <p className="text-sm">{incident.commitments}</p>
        </div>
      )}
    </div>
  );
}

function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Hi! I\'m your AI assistant for creating incident reports. Describe what happened and I\'ll help you create a structured incident report.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [generatedIncident, setGeneratedIncident] = useState<any>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  
  const createIncidentFromAI = useCreateIncidentFromAI();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Show loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Let me analyze that and create an incident report for you...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const result = await createIncidentFromAI.mutateAsync({
        description: input,
        context: messages.filter(m => m.type === 'user').map(m => m.content).join('\n'),
        visibility,
      });

      // Remove loading message and add success message
      setMessages(prev => prev.slice(0, -1));
      
      const successMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: `Great! I've created your incident report "${result.created.title}". The incident has been saved with ID ${result.created.id.slice(0, 8)}... and is set to ${visibility} visibility.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, successMessage]);
      setGeneratedIncident(result.aiGenerated);
      
      toast.success('Incident created successfully!');
      
    } catch (error: any) {
      // Remove loading message and add error message
      setMessages(prev => prev.slice(0, -1));
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'ai',
        content: `I'm sorry, there was an error creating the incident: ${error.message}. Please try again with a different description.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to create incident');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-[600px]">
      {/* Chat Panel */}
      <div 
        className="border rounded-lg flex flex-col"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--card-foreground)' }}>
              AI Incident Assistant
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Visibility:
            </label>
            <button
              onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')}
              className="flex items-center gap-2 text-sm px-2 py-1 rounded border"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)'
              }}
            >
              {visibility === 'private' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {visibility === 'private' ? 'Private' : 'Public'}
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  message.type === 'user'
                    ? 'text-white'
                    : message.type === 'system'
                    ? 'border'
                    : ''
                }`}
                style={{
                  backgroundColor: message.type === 'user' 
                    ? 'var(--primary)' 
                    : message.type === 'system'
                    ? 'var(--muted)'
                    : 'var(--secondary)',
                  color: message.type === 'user' 
                    ? 'var(--primary-foreground)' 
                    : 'var(--foreground)',
                  borderColor: message.type === 'system' ? 'var(--border)' : undefined,
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the incident (e.g., 'API is returning 500 errors for user authentication')"
              className="flex-1 resize-none border rounded-md p-2 text-sm"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)'
              }}
              rows={2}
              disabled={createIncidentFromAI.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || createIncidentFromAI.isPending}
              size="sm"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {createIncidentFromAI.isPending ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--foreground)' }}>
            Generated Incident Preview
          </h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {generatedIncident ? 'Here\'s the incident that was created:' : 'The AI-generated incident will appear here.'}
          </p>
        </div>
        
        {generatedIncident ? (
          <div className="space-y-4">
            <IncidentPreview incident={generatedIncident} />
            
            <div 
              className="border rounded-lg p-4"
              style={{ 
                backgroundColor: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--muted-foreground)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Incident Created Successfully</span>
              </div>
              <p className="text-sm">
                Your incident has been saved and is now available in the admin dashboard. 
                You can edit it further or add timeline updates as needed.
              </p>
              <div className="flex gap-2 mt-3">
                <Button 
                  asChild 
                  size="sm"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <a href="/admin">
                    View All Incidents
                  </a>
                </Button>
                <Button 
                  asChild 
                  size="sm" 
                  variant="outline"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  <a href="/admin/new-incident">
                    Create Another
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center"
            style={{ 
              borderColor: 'var(--muted)',
              color: 'var(--muted-foreground)'
            }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <p>Describe your incident in the chat and I'll generate a structured report for you.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewIncidentPage() {
  const { data: user } = useUser(); // This will redirect to login if not authenticated

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              <a href="/admin" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </a>
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                🤖 Create Incident with AI
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Describe the incident and let AI generate a structured report
              </p>
            </div>
          </div>
          <DecoButton />
        </header>

        {/* Chat Interface */}
        <ChatInterface />
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/admin/new-incident",
    component: NewIncidentPage,
    getParentRoute: () => parentRoute,
  });
