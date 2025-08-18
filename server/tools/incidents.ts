/**
 * Incident-related tools for incident management system.
 * 
 * This file contains all tools related to incident operations including:
 * - Creating new incidents
 * - Updating existing incidents
 * - Listing incidents (admin and public)
 * - Getting incident details
 * - Adding timeline events
 * - AI-powered incident generation
 */
import { createTool, createPrivateTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db.ts";
import { incidentsTable } from "../schema.ts";
import type { Env } from "../main.ts";

// Zod schemas for validation
const IncidentStatus = z.enum(["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]);
const IncidentVisibility = z.enum(["public", "private"]);
const SeverityLevel = z.enum([
  "Operational", 
  "Under Maintenance", 
  "Degraded Performance", 
  "Partial Outage", 
  "Major Outage"
]);

const AffectedResourceSchema = z.object({
  resource: z.string(),
  severity: SeverityLevel,
});

const TimelineEventSchema = z.object({
  time: z.string().transform((str) => new Date(str)), // ISO string to Date
  event: z.string(),
  attachmentUrl: z.string().optional(),
  createdBy: z.string(),
});

const IncidentSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  title: z.string(),
  status: IncidentStatus,
  visibility: IncidentVisibility,
  commitments: z.string().nullable(),
  createdBy: z.string(),
  affectedResources: z.array(AffectedResourceSchema).nullable(),
  timeline: z.array(TimelineEventSchema).nullable(),
});

// Generate UUID helper
const generateId = () => crypto.randomUUID();

/**
 * Create a new incident (Admin only)
 */
export const createCreateIncidentTool = (env: Env) =>
  createPrivateTool({
    id: "CREATE_INCIDENT",
    description: "Create a new incident",
    inputSchema: z.object({
      title: z.string().min(1, "Title is required"),
      status: IncidentStatus.default("INVESTIGATING"),
      visibility: IncidentVisibility.default("private"),
      commitments: z.string().optional(),
      affectedResources: z.array(AffectedResourceSchema).optional(),
      initialEvent: z.string().optional(), // Initial timeline event
    }),
    outputSchema: z.object({
      incident: IncidentSchema,
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
      if (!user) {
        throw new Error("Authentication required");
      }

      const db = await getDb(env);
      const now = new Date();
      const incidentId = generateId();

      // Prepare timeline with initial event
      const timeline = context.initialEvent ? [{
        time: now,
        event: context.initialEvent,
        createdBy: user.id,
      }] : [];

      try {
        const [newIncident] = await db.insert(incidentsTable).values({
          id: incidentId,
          createdAt: now,
          updatedAt: now,
          title: context.title,
          status: context.status,
          visibility: context.visibility,
          commitments: context.commitments || null,
          createdBy: user.id,
          affectedResources: context.affectedResources || null,
          timeline,
        }).returning();

        return {
          incident: {
            ...newIncident,
            affectedResources: newIncident.affectedResources as any,
            timeline: newIncident.timeline as any,
          },
          success: true,
        };
      } catch (error) {
        console.error("Error creating incident:", error);
        throw new Error("Failed to create incident");
      }
    },
  });

/**
 * Update an existing incident (Admin only)
 */
export const createUpdateIncidentTool = (env: Env) =>
  createPrivateTool({
    id: "UPDATE_INCIDENT",
    description: "Update an existing incident",
    inputSchema: z.object({
      id: z.string(),
      title: z.string().optional(),
      status: IncidentStatus.optional(),
      visibility: IncidentVisibility.optional(),
      commitments: z.string().optional(),
      affectedResources: z.array(AffectedResourceSchema).optional(),
    }),
    outputSchema: z.object({
      incident: IncidentSchema,
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
      if (!user) {
        throw new Error("Authentication required");
      }

      const db = await getDb(env);

      // Check if incident exists
      const existing = await db.select()
        .from(incidentsTable)
        .where(eq(incidentsTable.id, context.id))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Incident not found");
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (context.title !== undefined) updateData.title = context.title;
      if (context.status !== undefined) updateData.status = context.status;
      if (context.visibility !== undefined) updateData.visibility = context.visibility;
      if (context.commitments !== undefined) updateData.commitments = context.commitments;
      if (context.affectedResources !== undefined) updateData.affectedResources = context.affectedResources;

      try {
        const [updatedIncident] = await db.update(incidentsTable)
          .set(updateData)
          .where(eq(incidentsTable.id, context.id))
          .returning();

        return {
          incident: {
            ...updatedIncident,
            affectedResources: updatedIncident.affectedResources as any,
            timeline: updatedIncident.timeline as any,
          },
          success: true,
        };
      } catch (error) {
        console.error("Error updating incident:", error);
        throw new Error("Failed to update incident");
      }
    },
  });

/**
 * Get incident by ID (Public for public incidents, Admin for all)
 */
export const createGetIncidentTool = (env: Env) =>
  createTool({
    id: "GET_INCIDENT",
    description: "Get incident by ID",
    inputSchema: z.object({
      id: z.string(),
    }),
    outputSchema: z.object({
      incident: IncidentSchema.nullable(),
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);
      
      // Check if user is authenticated (for private incidents)
      let isAdmin = false;
      try {
        const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
        isAdmin = !!user;
      } catch {
        // Not authenticated, can only see public incidents
      }

      const incidents = await db.select()
        .from(incidentsTable)
        .where(eq(incidentsTable.id, context.id))
        .limit(1);

      if (incidents.length === 0) {
        return { incident: null, success: false };
      }

      const incident = incidents[0];

      // Check visibility permissions
      if (incident.visibility === "private" && !isAdmin) {
        return { incident: null, success: false };
      }

      return {
        incident: {
          ...incident,
          affectedResources: incident.affectedResources as any,
          timeline: incident.timeline as any,
        },
        success: true,
      };
    },
  });

/**
 * List incidents (Admin sees all, public sees only public ones)
 */
export const createListIncidentsTool = (env: Env) =>
  createTool({
    id: "LIST_INCIDENTS",
    description: "List incidents with optional filters",
    inputSchema: z.object({
      status: IncidentStatus.optional(),
      visibility: IncidentVisibility.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }),
    outputSchema: z.object({
      incidents: z.array(IncidentSchema),
      total: z.number(),
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // Check if user is authenticated
      let isAdmin = false;
      try {
        const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
        isAdmin = !!user;
      } catch {
        // Not authenticated, can only see public incidents
      }

      // Build query
      let query = db.select().from(incidentsTable);

      // Apply visibility filter
      if (!isAdmin) {
        // Public users only see public incidents
        query = query.where(eq(incidentsTable.visibility, "public"));
      } else if (context.visibility) {
        // Admin can filter by visibility
        query = query.where(eq(incidentsTable.visibility, context.visibility));
      }

      // Apply status filter
      if (context.status) {
        query = query.where(eq(incidentsTable.status, context.status));
      }

      // Apply ordering and pagination
      const incidents = await query
        .orderBy(desc(incidentsTable.createdAt))
        .limit(context.limit)
        .offset(context.offset);

      // TODO: Implement proper total count query
      const total = incidents.length;

      return {
        incidents: incidents.map(incident => ({
          ...incident,
          affectedResources: incident.affectedResources as any,
          timeline: incident.timeline as any,
        })),
        total,
        success: true,
      };
    },
  });

/**
 * Add timeline event to incident (Admin only)
 */
export const createAddTimelineEventTool = (env: Env) =>
  createPrivateTool({
    id: "ADD_TIMELINE_EVENT",
    description: "Add a timeline event to an incident",
    inputSchema: z.object({
      incidentId: z.string(),
      event: z.string().min(1, "Event description is required"),
      attachmentUrl: z.string().optional(),
    }),
    outputSchema: z.object({
      incident: IncidentSchema,
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
      if (!user) {
        throw new Error("Authentication required");
      }

      const db = await getDb(env);

      // Get existing incident
      const existing = await db.select()
        .from(incidentsTable)
        .where(eq(incidentsTable.id, context.incidentId))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Incident not found");
      }

      const incident = existing[0];
      const currentTimeline = (incident.timeline as any) || [];

      // Add new timeline event
      const newEvent = {
        time: new Date(),
        event: context.event,
        attachmentUrl: context.attachmentUrl,
        createdBy: user.id,
      };

      const updatedTimeline = [...currentTimeline, newEvent];

      try {
        const [updatedIncident] = await db.update(incidentsTable)
          .set({
            timeline: updatedTimeline,
            updatedAt: new Date(),
          })
          .where(eq(incidentsTable.id, context.incidentId))
          .returning();

        return {
          incident: {
            ...updatedIncident,
            affectedResources: updatedIncident.affectedResources as any,
            timeline: updatedIncident.timeline as any,
          },
          success: true,
        };
      } catch (error) {
        console.error("Error adding timeline event:", error);
        throw new Error("Failed to add timeline event");
      }
    },
  });

/**
 * AI-powered incident generation (Admin only)
 */
export const createAIGenerateIncidentTool = (env: Env) =>
  createPrivateTool({
    id: "AI_GENERATE_INCIDENT",
    description: "Generate incident data using AI based on description",
    inputSchema: z.object({
      description: z.string().min(1, "Description is required"),
      context: z.string().optional(), // Additional context about the incident
    }),
    outputSchema: z.object({
      incident: z.object({
        title: z.string(),
        status: IncidentStatus,
        affectedResources: z.array(AffectedResourceSchema),
        timeline: z.array(z.object({
          event: z.string(),
        })),
        commitments: z.string().optional(),
      }),
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();
      if (!user) {
        throw new Error("Authentication required");
      }

      // AI Schema for incident generation
      const incidentSchema = {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Concise, clear title for the incident"
          },
          status: {
            type: "string",
            enum: ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"],
            description: "Current status of the incident"
          },
          affectedResources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                resource: {
                  type: "string",
                  description: "Name of the affected resource (e.g., API, Dashboard, Database)"
                },
                severity: {
                  type: "string",
                  enum: [
                    "Operational", 
                    "Under Maintenance", 
                    "Degraded Performance", 
                    "Partial Outage", 
                    "Major Outage"
                  ],
                  description: "Severity level of the impact on this resource"
                }
              },
              required: ["resource", "severity"]
            },
            description: "List of affected resources and their severity levels"
          },
          timeline: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event: {
                  type: "string",
                  description: "Description of what happened at this point in time"
                }
              },
              required: ["event"]
            },
            description: "Chronological sequence of events for this incident"
          },
          commitments: {
            type: "string",
            description: "Optional commitments, next steps, or promises to users"
          }
        },
        required: ["title", "status", "affectedResources", "timeline"]
      };

      const prompt = `You are an expert incident manager for a technology company. 
Based on the following incident description, generate a well-structured incident report.

INCIDENT DESCRIPTION:
${context.description}

${context.context ? `ADDITIONAL CONTEXT:\n${context.context}` : ''}

Please generate:
1. A clear, concise title
2. Appropriate status (usually INVESTIGATING for new incidents)
3. List of affected resources with realistic severity levels
4. A timeline with 2-4 initial events showing the progression
5. Optional commitments if appropriate

Be professional, clear, and focus on customer communication. Use realistic resource names like "API", "Dashboard", "Database", "CDN", etc.`;

      try {
        const result = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
          messages: [{
            role: 'user',
            content: prompt
          }],
          schema: incidentSchema,
          model: 'gpt-4o-mini',
          temperature: 0.3, // Lower temperature for more consistent results
        });

        if (!result.object) {
          throw new Error("AI did not generate incident data");
        }

        return {
          incident: result.object as any,
          success: true,
        };
      } catch (error) {
        console.error("Error generating incident with AI:", error);
        throw new Error("Failed to generate incident with AI");
      }
    },
  });

// TODO: Implement notification system for incident updates
// TODO: Add incident search functionality
// TODO: Add incident metrics and analytics
// TODO: Add incident templates for common scenarios
// TODO: Add incident escalation rules
// TODO: Add incident resolution workflows

// Export all incident-related tools
export const incidentTools = [
  createCreateIncidentTool,
  createUpdateIncidentTool,
  createGetIncidentTool,
  createListIncidentsTool,
  createAddTimelineEventTool,
  createAIGenerateIncidentTool,
];
