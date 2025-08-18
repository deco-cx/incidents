import { createRoute, type RootRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useUser } from "@/lib/hooks";
import { DecoButton } from "@/components/deco-button";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Save, 
  Clock, 
  AlertTriangle,
  Plus,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  useGetIncident, 
  useUpdateIncident, 
  useAddTimelineEvent,
  useIncidentStatusInfo, 
  useSeverityInfo 
} from "@/hooks/useIncidents";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const statusOptions = [
  { value: "INVESTIGATING", label: "🔍 Investigating" },
  { value: "IDENTIFIED", label: "🎯 Identified" },
  { value: "MONITORING", label: "👁️ Monitoring" },
  { value: "RESOLVED", label: "✅ Resolved" },
];

const severityOptions = [
  { value: "Operational", label: "✅ Operational" },
  { value: "Under Maintenance", label: "🔧 Under Maintenance" },
  { value: "Degraded Performance", label: "⚠️ Degraded Performance" },
  { value: "Partial Outage", label: "🟠 Partial Outage" },
  { value: "Major Outage", label: "🔴 Major Outage" },
];

function EditIncidentPage() {
  const { data: user } = useUser(); // This will redirect to login if not authenticated
  const { id } = useParams({ from: "/admin/incident/$id" });
  const navigate = useNavigate();
  
  const { data: result, isLoading, error } = useGetIncident(id);
  const updateIncident = useUpdateIncident();
  const addTimelineEvent = useAddTimelineEvent();

  // Form state
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("INVESTIGATING");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [commitments, setCommitments] = useState("");
  const [affectedResources, setAffectedResources] = useState<Array<{resource: string, severity: string}>>([]);
  
  // Timeline event state
  const [newEvent, setNewEvent] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Initialize form when incident loads
  useEffect(() => {
    if (result?.incident) {
      const incident = result.incident;
      setTitle(incident.title);
      setStatus(incident.status);
      setVisibility(incident.visibility);
      setCommitments(incident.commitments || "");
      setAffectedResources(incident.affectedResources || []);
    }
  }, [result]);

  const handleSave = async () => {
    try {
      await updateIncident.mutateAsync({
        id,
        title,
        status,
        visibility,
        commitments: commitments || undefined,
        affectedResources,
      });
      toast.success("Incident updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update incident: ${error.message}`);
    }
  };

  const handleAddTimelineEvent = async () => {
    if (!newEvent.trim()) return;
    
    try {
      await addTimelineEvent.mutateAsync({
        incidentId: id,
        event: newEvent,
      });
      setNewEvent("");
      setIsAddingEvent(false);
      toast.success("Timeline event added!");
    } catch (error: any) {
      toast.error(`Failed to add timeline event: ${error.message}`);
    }
  };

  const addResource = () => {
    setAffectedResources([...affectedResources, { resource: "", severity: "Operational" }]);
  };

  const updateResource = (index: number, field: "resource" | "severity", value: string) => {
    const updated = [...affectedResources];
    updated[index][field] = value;
    setAffectedResources(updated);
  };

  const removeResource = (index: number) => {
    setAffectedResources(affectedResources.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading incident...</p>
        </div>
      </div>
    );
  }

  if (error || !result?.success || !result.incident) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--destructive)' }} />
          <p style={{ color: 'var(--destructive)' }}>Failed to load incident</p>
          <Button 
            asChild 
            className="mt-4"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
          >
            <a href="/admin">Back to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const incident = result.incident;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
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
                Edit Incident
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                ID: {id.slice(0, 8)}... • Created {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <DecoButton />
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Visibility</label>
                    <button
                      onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')}
                      className="w-full flex items-center justify-center gap-2 border rounded-md p-2 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    >
                      {visibility === 'private' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {visibility === 'private' ? 'Private' : 'Public'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Commitments</label>
                  <textarea
                    value={commitments}
                    onChange={(e) => setCommitments(e.target.value)}
                    placeholder="Optional commitments or next steps..."
                    className="w-full border rounded-md p-2 text-sm resize-none"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Affected Resources */}
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Affected Resources</h3>
                <Button 
                  onClick={addResource}
                  size="sm"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Resource
                </Button>
              </div>

              <div className="space-y-3">
                {affectedResources.map((resource, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={resource.resource}
                      onChange={(e) => updateResource(index, "resource", e.target.value)}
                      placeholder="Resource name (e.g., API, Dashboard)"
                      className="flex-1 border rounded-md p-2 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    />
                    <select
                      value={resource.severity}
                      onChange={(e) => updateResource(index, "severity", e.target.value)}
                      className="border rounded-md p-2 text-sm"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    >
                      {severityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => removeResource(index)}
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--destructive)'
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {affectedResources.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                    No affected resources yet. Click "Add Resource" to add one.
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={updateIncident.isPending}
              className="w-full"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {updateIncident.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Timeline Sidebar */}
          <div className="space-y-6">
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Timeline</h3>
                <Button 
                  onClick={() => setIsAddingEvent(true)}
                  size="sm"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </div>

              {/* Add Event Form */}
              {isAddingEvent && (
                <div className="mb-4 p-3 border rounded-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
                  <textarea
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    placeholder="Describe what happened..."
                    className="w-full border rounded-md p-2 text-sm mb-2 resize-none"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTimelineEvent}
                      disabled={!newEvent.trim() || addTimelineEvent.isPending}
                      size="sm"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}
                    >
                      {addTimelineEvent.isPending ? "Adding..." : "Add"}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingEvent(false);
                        setNewEvent("");
                      }}
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incident.timeline && incident.timeline.length > 0 ? (
                  incident.timeline
                    .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((event: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 pt-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                          </p>
                          <p className="text-sm">{event.event}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                    No timeline events yet.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div 
              className="border rounded-lg p-6"
              style={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {incident.visibility === 'public' && (
                  <Button 
                    asChild 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <a href={`/incident/${id}`} target="_blank">
                      <Eye className="w-4 h-4 mr-2" />
                      View Public Page
                    </a>
                  </Button>
                )}
                <Button 
                  asChild 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  <a href="/admin/new-incident">
                    Create Another Incident
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/admin/incident/$id",
    component: EditIncidentPage,
    getParentRoute: () => parentRoute,
  });
