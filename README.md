# 🚨 Deco Incidents Management System

AI-powered incident management system for tracking, documenting, and communicating service disruptions. Built with Deco MCP runtime, React, and Tailwind CSS.

## 🎯 Overview

This system provides a complete incident management solution with:
- **AI-powered incident creation** via chat interface
- **Admin dashboard** for managing incidents
- **Public incident pages** for customer transparency
- **Timeline tracking** with real-time updates
- **Multi-resource severity tracking**
- **Public/private visibility controls**

## 🏗️ Architecture

- `/server` - **MCP Server** (Cloudflare Workers + Deco runtime)
  - Database schema with JSON columns for flexible data
  - CRUD tools with authentication
  - AI integration for incident generation
- `/view` - **React Frontend** (Vite + Tailwind CSS + TanStack Router)
  - Admin interface for incident management
  - AI chat interface for creation
  - Public incident viewing pages

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure the app
npm run configure

# Start development server
npm run dev

# Generate database migrations (after schema changes)
npm run db:generate

# Deploy to production
npm run deploy
```

## 📋 Features

### 🤖 AI-Powered Creation
- **Chat Interface**: Conversational incident creation
- **Smart Generation**: AI analyzes descriptions and creates structured reports
- **Auto-formatting**: Generates timeline, affected resources, and status

### 🔐 Authentication & Security
- **Private Tools**: Admin functions require authentication
- **Public Access**: Anyone can view public incidents
- **Visibility Controls**: Public/private incident settings

### 📊 Incident Management
- **Status Flow**: INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED
- **Multi-Resource Tracking**: Track multiple services with different severity levels
- **Timeline System**: Chronological event tracking with timestamps
- **Severity Levels**: Operational, Under Maintenance, Degraded Performance, Partial Outage, Major Outage

### 🎨 Modern UI/UX
- **Deco Brand Colors**: Consistent with Deco design system
- **Responsive Design**: Mobile-first approach
- **Status Badges**: Color-coded status and severity indicators
- **Real-time Updates**: Live data with React Query

## 🗂️ Routes

### Public Routes
- `/` - Home page (redirects to status.deco.cx in production)
- `/incident/:id` - Public incident view

### Admin Routes (Authentication Required)
- `/admin` - Dashboard with incident list
- `/admin/new-incident` - AI-powered incident creation
- `/admin/incident/:id` - Edit existing incident

## 🗄️ Database Schema

```typescript
// Single table with JSON columns for flexibility
incidents {
  id: string (UUID)
  createdAt: timestamp
  updatedAt: timestamp
  title: string
  status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED"
  visibility: "public" | "private"
  commitments?: string
  createdBy: string (user ID)
  affectedResources: JSON // Array<{ resource: string, severity: string }>
  timeline: JSON // Array<{ time: Date, event: string, attachmentUrl?: string, createdBy: string }>
}
```

## 🔧 Tools & Workflows

### Server Tools
- `CREATE_INCIDENT` - Create new incident
- `UPDATE_INCIDENT` - Update existing incident
- `GET_INCIDENT` - Get incident by ID (respects visibility)
- `LIST_INCIDENTS` - List incidents with filters
- `ADD_TIMELINE_EVENT` - Add event to incident timeline
- `AI_GENERATE_INCIDENT` - Generate incident using AI

### Frontend Hooks
- `useListIncidents` - Query incidents with filters
- `useGetIncident` - Get single incident
- `useCreateIncident` - Create incident mutation
- `useUpdateIncident` - Update incident mutation
- `useAddTimelineEvent` - Add timeline event
- `useAIGenerateIncident` - AI generation
- `useCreateIncidentFromAI` - Combined AI + create flow

## 🎨 Design System

### Deco Theme Colors
```css
--background: #fcfbf6
--foreground: #262626
--primary: #d0ec1a
--primary-foreground: #07401a
--card: #f3f1e7
--border: #c4c1b1
--muted: #dedbc9
```

### Status & Severity Classes
- `.status-investigating` - Yellow badge for investigating
- `.status-identified` - Orange badge for identified
- `.status-monitoring` - Blue badge for monitoring
- `.status-resolved` - Green badge for resolved
- `.severity-operational` - Green for operational
- `.severity-major` - Red for major outages

## 🔄 Development Workflow

### Adding New Features
1. **Backend**: Add tools in `server/tools/incidents.ts`
2. **Types**: Run `npm run gen:self` to generate types
3. **Frontend**: Create hooks in `view/src/hooks/useIncidents.ts`
4. **UI**: Build components using shadcn/ui + Tailwind

### Database Changes
1. Modify `server/schema.ts`
2. Run `npm run db:generate`
3. Migrations apply automatically on next server start

### Deployment
```bash
npm run deploy
```
- Builds frontend for production
- Deploys to Cloudflare Workers
- Available at your configured domain

## 🌐 Production Behavior

- **Development**: Shows full incident management interface
- **Production**: Redirects home page to `status.deco.cx`
- **Public incidents**: Always accessible via direct URLs
- **Admin functions**: Require authentication

## 🔗 Integration

### Status Page Integration
- Home page redirects to existing `status.deco.cx`
- Public incident pages provide detailed views
- Admin can control visibility (public/private)

### AI Integration
- Uses `DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT`
- Structured schema for consistent output
- Chat-like interface for natural interaction

## 📚 Tech Stack

- **Backend**: Deco MCP Runtime, Cloudflare Workers
- **Database**: SQLite with Drizzle ORM
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Routing**: TanStack Router (type-safe)
- **State**: TanStack Query (React Query)
- **Forms**: Native HTML forms with validation
- **AI**: Deco Chat Workspace API
- **Deployment**: Cloudflare Workers

## 🚨 Usage Examples

### Creating an Incident with AI
1. Navigate to `/admin/new-incident`
2. Describe the issue: "API is returning 500 errors for authentication"
3. AI generates structured incident with timeline and affected resources
4. Review and save with chosen visibility

### Managing Incidents
1. View all incidents at `/admin`
2. Click "Edit" to modify details
3. Add timeline events as situation develops
4. Update status as incident progresses
5. Set to public when ready for customer visibility

### Public Transparency
- Customers can view public incidents directly
- Clean, professional incident pages
- Real-time status and timeline updates
- Integration with main status page

## 📝 Development History

This repository uses [Specstory](https://specstory.com/) to track the history of prompts that were used to code this repo. You can inspect the complete development history in the [`.specstory/`](.specstory/) folder.

---

This system provides complete incident lifecycle management with AI assistance, making it easy to maintain transparency during service disruptions while keeping internal processes efficient.

**Ready to manage incidents with AI?** [Deploy on Deco](https://deco.chat) 🚀