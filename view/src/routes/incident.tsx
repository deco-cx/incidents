import { createRoute, type RootRoute, useParams } from "@tanstack/react-router";
import { useGetIncident, useIncidentStatusInfo, useSeverityInfo } from "@/hooks/useIncidents";
import { Clock, AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";

function PublicIncidentPage() {
  const { id } = useParams({ from: "/incident/$id" });
  const { data: result, isLoading, error } = useGetIncident(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !result?.success || !result.incident) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--destructive)' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Incident Not Found
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>
            The incident you're looking for doesn't exist or is not publicly visible.
          </p>
          <Button 
            asChild
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
          >
            <a href="https://status.deco.cx" className="inline-flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Visit Status Page
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const incident = result.incident;
  const statusInfo = useIncidentStatusInfo(incident.status);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Deco" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                Deco Status
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Incident Report
              </p>
            </div>
          </div>
          <Button 
            asChild 
            variant="outline" 
            size="sm"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            <a href="https://status.deco.cx" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Status
            </a>
          </Button>
        </header>

        {/* Incident Details */}
        <main className="space-y-6">
          {/* Title and Status */}
          <div 
            className="border rounded-lg p-6"
            style={{ 
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              color: 'var(--card-foreground)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{incident.title}</h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Reported {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })} • 
                  Last updated {formatDistanceToNow(new Date(incident.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.className}`}
              >
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            
            <div 
              className="border-l-4 pl-4"
              style={{ borderColor: 'var(--primary)' }}
            >
              <p style={{ color: 'var(--muted-foreground)' }}>
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Affected Resources */}
          {incident.affectedResources && incident.affectedResources.length > 0 && (
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Affected Services</h3>
              <div className="grid gap-3">
                {incident.affectedResources.map((resource: any, index: number) => {
                  const severityInfo = useSeverityInfo(resource.severity);
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ 
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--muted)'
                      }}
                    >
                      <span className="font-medium">{resource.resource}</span>
                      <span 
                        className={`px-2 py-1 rounded text-sm border ${severityInfo.className}`}
                      >
                        {severityInfo.icon} {severityInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {incident.timeline && incident.timeline.length > 0 && (
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <div className="space-y-4">
                {incident.timeline
                  .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--primary)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          {format(new Date(event.time), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p>{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commitments */}
          {incident.commitments && (
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Our Commitment</h3>
              <p>{incident.commitments}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              For more information about Deco service status, visit our status page.
            </p>
            <Button 
              asChild
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <a href="https://status.deco.cx" className="inline-flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Visit Status Page
              </a>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/incident/$id",
    component: PublicIncidentPage,
    getParentRoute: () => parentRoute,
  });
