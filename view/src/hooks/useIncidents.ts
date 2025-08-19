/**
 * React Query hooks for incident management operations.
 * 
 * This file contains all hooks for interacting with incident-related tools
 * including CRUD operations and AI-powered generation.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/rpc";

// Types for incident data
export interface AffectedResource {
  resource: string;
  severity: "Operational" | "Under Maintenance" | "Degraded Performance" | "Partial Outage" | "Major Outage";
}

export interface AttachmentEvidence {
  type: "file" | "link";
  url: string;
  name?: string;
  mimeType?: string;
}

export interface TimelineEvent {
  time: Date;
  event: string;
  attachments?: AttachmentEvidence[];
  createdBy: string;
}

export interface Incident {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";
  visibility: "public" | "private";
  commitments?: string;
  createdBy: string;
  affectedResources?: AffectedResource[];
  timeline?: TimelineEvent[];
}

// Query Keys
const QUERY_KEYS = {
  incidents: ['incidents'] as const,
  incident: (id: string) => ['incidents', id] as const,
  listIncidents: (filters?: any) => ['incidents', 'list', filters] as const,
};

/**
 * Hook to list incidents with optional filters
 */
export const useListIncidents = (filters?: {
  status?: string;
  visibility?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.listIncidents(filters),
    queryFn: () => client.LIST_INCIDENTS(filters || {}),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get a single incident by ID
 */
export const useGetIncident = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.incident(id),
    queryFn: () => client.GET_INCIDENT({ id }),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to create a new incident
 */
export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      status?: string;
      visibility?: string;
      commitments?: string;
      affectedResources?: AffectedResource[];
      initialEvent?: string;
    }) => client.CREATE_INCIDENT(data),
    onSuccess: () => {
      // Invalidate and refetch incidents list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents });
    },
  });
};

/**
 * Hook to update an existing incident
 */
export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      title?: string;
      status?: string;
      visibility?: string;
      commitments?: string;
      affectedResources?: AffectedResource[];
    }) => client.UPDATE_INCIDENT(data),
    onSuccess: (data, variables) => {
      // Invalidate specific incident and list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incident(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents });
    },
  });
};

/**
 * Hook to add a timeline event to an incident
 */
export const useAddTimelineEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      incidentId: string;
      event: string;
      attachments?: AttachmentEvidence[];
    }) => client.ADD_TIMELINE_EVENT(data),
    onSuccess: (data, variables) => {
      // Invalidate specific incident and list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incident(variables.incidentId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents });
    },
  });
};

/**
 * Hook to generate incident data using AI
 */
export const useAIGenerateIncident = () => {
  return useMutation({
    mutationFn: (data: {
      description: string;
      context?: string;
    }) => client.AI_GENERATE_INCIDENT(data),
  });
};

/**
 * Hook to create incident from AI-generated data
 */
export const useCreateIncidentFromAI = () => {
  const createIncident = useCreateIncident();
  const generateIncident = useAIGenerateIncident();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      context?: string;
      visibility?: string;
    }) => {
      // First, generate incident data with AI
      const aiResult = await generateIncident.mutateAsync({
        description: data.description,
        context: data.context,
      });

      if (!aiResult.success || !aiResult.incident) {
        throw new Error("Failed to generate incident data");
      }

      // Then create the incident with the AI-generated data
      const createResult = await createIncident.mutateAsync({
        title: aiResult.incident.title,
        status: aiResult.incident.status,
        visibility: data.visibility || "private",
        commitments: aiResult.incident.commitments,
        affectedResources: aiResult.incident.affectedResources,
        initialEvent: aiResult.incident.timeline?.[0]?.event,
      });

      return {
        aiGenerated: aiResult.incident,
        created: createResult.incident,
      };
    },
  });
};

/**
 * Helper hook for getting incident status display info
 */
export const useIncidentStatusInfo = (status: string) => {
  const statusInfo = {
    INVESTIGATING: {
      label: "Investigating",
      className: "status-investigating",
      icon: "🔍",
      description: "We are currently investigating this issue"
    },
    IDENTIFIED: {
      label: "Identified", 
      className: "status-identified",
      icon: "🎯",
      description: "The issue has been identified and we are working on a fix"
    },
    MONITORING: {
      label: "Monitoring",
      className: "status-monitoring", 
      icon: "👁️",
      description: "A fix has been implemented and we are monitoring the results"
    },
    RESOLVED: {
      label: "Resolved",
      className: "status-resolved",
      icon: "✅", 
      description: "This issue has been resolved"
    }
  };

  return statusInfo[status as keyof typeof statusInfo] || statusInfo.INVESTIGATING;
};

/**
 * Helper hook for getting severity display info
 */
export const useSeverityInfo = (severity: string) => {
  const severityInfo = {
    "Operational": {
      label: "Operational",
      className: "severity-operational",
      icon: "✅",
      description: "Service is operating normally"
    },
    "Under Maintenance": {
      label: "Under Maintenance", 
      className: "severity-maintenance",
      icon: "🔧",
      description: "Service is undergoing scheduled maintenance"
    },
    "Degraded Performance": {
      label: "Degraded Performance",
      className: "severity-degraded",
      icon: "⚠️", 
      description: "Service is experiencing performance issues"
    },
    "Partial Outage": {
      label: "Partial Outage",
      className: "severity-partial",
      icon: "🟠",
      description: "Some service functionality is unavailable"
    },
    "Major Outage": {
      label: "Major Outage", 
      className: "severity-major",
      icon: "🔴",
      description: "Service is completely unavailable"
    }
  };

  return severityInfo[severity as keyof typeof severityInfo] || severityInfo["Operational"];
};
