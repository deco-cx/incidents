import { createRoute, type RootRoute } from "@tanstack/react-router";
import { useOptionalUser } from "@/lib/hooks";
import { DecoButton } from "@/components/deco-button";
import { useEffect } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function HomePage() {
  const { data: user } = useOptionalUser();

  useEffect(() => {
    // Redirect to status.deco.cx if not in development/localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('.deco.host');
    
    if (!isLocalhost) {
      window.location.href = 'https://status.deco.cx';
      return;
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Deco" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                Incidents Management
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Internal system for service disruption tracking
              </p>
            </div>
          </div>
          <DecoButton />
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              <h2 className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
                🚨 Deco Incidents
              </h2>
            </div>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              AI-powered incident management system for tracking, documenting, and communicating service disruptions.
            </p>
          </div>

          {/* User Status */}
          {user ? (
            <div 
              className="max-w-md mx-auto rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-2">
                Welcome, {user.name || user.email}!
              </h3>
              <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
                You have admin access to the incident management system.
              </p>
              <div className="space-y-2">
                <Button 
                  asChild 
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <a href="/admin">
                    Go to Admin Dashboard
                  </a>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  <a href="/admin/new-incident">
                    🤖 Create with AI
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="max-w-md mx-auto rounded-lg p-6 border text-center"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-2">
                Admin Access Required
              </h3>
              <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Sign in with Deco to access the incident management system.
              </p>
              <DecoButton />
            </div>
          )}

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-3">
                📊 Public Status
              </h3>
              <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
                View the public status page for all Deco services.
              </p>
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <a 
                  href="https://status.deco.cx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Visit status.deco.cx
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>

            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-3">
                🤖 AI-Powered
              </h3>
              <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Create incident reports quickly with AI assistance for structured documentation.
              </p>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Chat-like interface • Smart suggestions • Auto-formatting
              </div>
            </div>

            <div 
              className="rounded-lg p-6 border"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-3">
                📋 Timeline Tracking
              </h3>
              <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Detailed timeline of events with attachments and status updates.
              </p>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Real-time updates • Multi-resource tracking • Public/Private visibility
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div 
            className="max-w-2xl mx-auto rounded-lg p-4 border-2 border-dashed text-center"
            style={{ 
              borderColor: 'var(--muted)',
              color: 'var(--muted-foreground)'
            }}
          >
            <p className="text-sm">
              <strong>Development Mode:</strong> This page is only visible in localhost/development. 
              Production traffic redirects to status.deco.cx
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/",
    component: HomePage,
    getParentRoute: () => parentRoute,
  });