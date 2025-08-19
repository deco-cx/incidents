import { createRoute, type RootRoute } from "@tanstack/react-router";
import { useOptionalUser, useUser } from "@/lib/hooks";
import { DecoButton } from "@/components/deco-button";
import { useListIncidents, useIncidentStatusInfo, useSeverityInfo } from "@/hooks/useIncidents";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Clock, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function IncidentCard({ incident }: { incident: any }) {
  const statusInfo = useIncidentStatusInfo(incident.status);
  
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
      style={{ 
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--card-foreground)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{incident.title}</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Created {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {incident.visibility === 'private' ? (
            <EyeOff className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          ) : (
            <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          )}
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}
          >
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
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
            Latest Update:
          </p>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            {incident.timeline[incident.timeline.length - 1].event}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {incident.visibility === 'public' ? 'Public' : 'Private'} • 
          ID: {incident.id.slice(0, 8)}...
        </span>
        <Button 
          asChild 
          size="sm" 
          variant="outline"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)'
          }}
        >
          <a href={`/admin/incident/${incident.id}`}>
            Edit
          </a>
        </Button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data: user } = useUser(); // This will redirect to login if not authenticated
  const { data: incidents, isLoading, error } = useListIncidents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--destructive)' }} />
          <p style={{ color: 'var(--destructive)' }}>Failed to load incidents</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Deco" className="h-8 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                Incident Management
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
          </div>
          <DecoButton />
        </header>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
              All Incidents
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {incidents?.total || 0} incident{(incidents?.total || 0) !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              asChild
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <a href="/admin/new-incident" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Incident
              </a>
            </Button>
          </div>
        </div>

        {/* Incidents Grid */}
        {incidents?.incidents && incidents.incidents.length > 0 ? (
          <div className="grid gap-4">
            {incidents.incidents.map((incident: any) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-12 border-2 border-dashed rounded-lg"
            style={{ 
              borderColor: 'var(--muted)',
              color: 'var(--muted-foreground)'
            }}
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="text-lg font-medium mb-2">No incidents yet</h3>
            <p className="mb-4">Create your first incident to get started.</p>
            <Button 
              asChild
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <a href="/admin/new-incident" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create First Incident
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/admin",
    component: AdminDashboard,
    getParentRoute: () => parentRoute,
  });
