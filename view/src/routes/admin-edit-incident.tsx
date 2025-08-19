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
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventDescription, setEventDescription] = useState("");
  const [eventAttachments, setEventAttachments] = useState<Array<{ type: "file" | "link"; url: string; name?: string; mimeType?: string }>>([]);
  const descriptionLimit = 600;

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
    if (!eventDescription.trim()) return;
    try {
      await addTimelineEvent.mutateAsync({
        incidentId: id,
        event: eventDescription,
        attachments: eventAttachments,
      });
      setEventDescription("");
      setEventAttachments([]);
      setShowEventModal(false);
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
                  onClick={() => { setIsAddingEvent(true); setShowEventModal(true); }}
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

              {/* Add Event Modal */}
              {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  {/* Backdrop */}
                  <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowEventModal(false)} />
                  {/* Modal */}
                  <div className="relative w-full max-w-xl mx-4 border rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">Add Timeline Event</h4>
                      <button onClick={() => setShowEventModal(false)} className="p-1 border rounded" style={{ borderColor: 'var(--border)' }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <label className="block text-sm font-medium mb-1">Description <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>({eventDescription.length}/{descriptionLimit})</span></label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, descriptionLimit);
                        setEventDescription(value);
                      }}
                      placeholder="Describe what happened (max 600 characters)..."
                      className="w-full border rounded-md p-2 text-sm mb-3 resize-none"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                      rows={5}
                      maxLength={descriptionLimit}
                    />

                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Add evidences</label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="file"
                          accept="image/png,application/pdf"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });
                            const newItems: Array<{ type: "file"; url: string; name?: string; mimeType?: string }> = [];
                            for (const f of files) {
                              try {
                                const dataUrl = await toDataUrl(f);
                                newItems.push({ type: "file", url: dataUrl, name: f.name, mimeType: f.type });
                              } catch {
                                // ignore individual file failures
                              }
                            }
                            if (newItems.length > 0) setEventAttachments((prev) => [...prev, ...newItems]);
                          }}
                          className="text-sm"
                        />
                        <input
                          type="url"
                          placeholder="https://evidence-link"
                          className="flex-1 border rounded-md p-2 text-sm"
                          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value) {
                                setEventAttachments((prev) => [...prev, { type: 'link', url: target.value }]);
                                target.value = '';
                              }
                            }
                          }}
                        />
                      </div>

                      {eventAttachments.length > 0 && (
                        <div className="border rounded p-2 max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                          {eventAttachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 text-sm">
                              <span className="truncate mr-2">{att.type === 'link' ? att.url : (att.name || att.url)}</span>
                              <button onClick={() => setEventAttachments(eventAttachments.filter((_, i) => i !== idx))} className="text-xs underline">Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setShowEventModal(false)}
                        variant="outline"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddTimelineEvent}
                        disabled={!eventDescription.trim() || addTimelineEvent.isPending}
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      >
                        {addTimelineEvent.isPending ? 'Adding...' : 'Add Event'}
                      </Button>
                    </div>
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
