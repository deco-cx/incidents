# 🚨 Incident Management System - Plano de Desenvolvimento

## 📋 Visão Geral

Sistema de gestão de incidentes para a Deco, permitindo comunicação transparente sobre o status de serviços e incidentes operacionais. O sistema terá uma área administrativa privada e uma interface pública para visualização de status.

## 🎯 Objetivos

1. **Gestão de Incidentes**: Interface administrativa para criar, editar e gerenciar incidentes
2. **Transparência**: Página pública para clientes acompanharem status dos serviços
3. **AI-Powered**: Criação assistida por IA para facilitar documentação de incidentes
4. **Timeline**: Histórico detalhado de eventos durante um incidente
5. **Multi-severidade**: Suporte para diferentes níveis de impacto por recurso

## 📊 Modelo de Dados

### Incident
```typescript
interface Incident {
  id: string; // UUID
  createdAt: Date;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  visibility: 'public' | 'private';
  affectedResources: Array<{
    resource: string;
    severity: 
      | 'Operational' 
      | 'Under Maintenance' 
      | 'Degraded Performance'
      | 'Partial Outage' 
      | 'Major Outage';
  }>;
  timeline?: Array<{
    time: Date;
    event: string;
    attachmentUrl?: string;
  }>;
  commitments?: string;
}
```

## 🗺️ Estrutura de Rotas

### Rotas Públicas
- `/` - Redirect para status.deco.cx (página pública de status)
- `/incident/:id` - Visualização pública de incidente específico

### Rotas Administrativas (Protegidas)
- `/admin` - Dashboard com lista de incidentes
- `/admin/new-incident` - Criação de novo incidente (com AI assistant)
- `/admin/incident/:id` - Edição de incidente existente

## 🔧 Componentes Principais

### 1. Database Schema (`server/schema.ts`)
- Tabela `incidents` com todos os campos do modelo
- Tabela `incident_resources` para recursos afetados (relação 1-N)
- Tabela `incident_timeline` para eventos da timeline (relação 1-N)

### 2. Server Tools (`server/tools/incidents.ts`)
- `CREATE_INCIDENT` - Criar novo incidente
- `UPDATE_INCIDENT` - Atualizar incidente existente
- `GET_INCIDENT` - Buscar incidente por ID
- `LIST_INCIDENTS` - Listar incidentes (com filtros)
- `ADD_TIMELINE_EVENT` - Adicionar evento à timeline
- `UPDATE_INCIDENT_STATUS` - Atualizar status do incidente
- `AI_GENERATE_INCIDENT` - Gerar incidente via AI com schema

### 3. Frontend Components

#### Páginas (`view/src/routes/`)
- `home.tsx` - Redirect para status público
- `admin.tsx` - Dashboard administrativo
- `admin-new-incident.tsx` - Criação com AI
- `admin-edit-incident.tsx` - Edição de incidente
- `public-incident.tsx` - Visualização pública

#### Componentes UI (`view/src/components/`)
- `IncidentList.tsx` - Lista de incidentes no admin
- `IncidentForm.tsx` - Formulário de criação/edição
- `IncidentTimeline.tsx` - Visualização da timeline
- `AIChatInterface.tsx` - Interface chat-like para criação com AI
- `ResourceSeverityBadge.tsx` - Badge de severidade
- `StatusIndicator.tsx` - Indicador de status do incidente

### 4. Hooks (`view/src/hooks/`)
- `useIncidents.ts` - CRUD operations para incidentes
- `useAIIncidentGeneration.ts` - Hook para geração via AI
- `useIncidentTimeline.ts` - Gerenciar timeline

## 🚀 Fases de Implementação

### Fase 1: Setup Inicial e Database ✅
1. [x] Configurar schema do banco de dados
2. [ ] Criar migrations
3. [ ] Implementar tools básicos de CRUD

### Fase 2: Backend Core
1. [ ] Tool CREATE_INCIDENT com validação
2. [ ] Tool UPDATE_INCIDENT com verificações
3. [ ] Tool LIST_INCIDENTS com filtros e paginação
4. [ ] Tool GET_INCIDENT com joins
5. [ ] Tool ADD_TIMELINE_EVENT
6. [ ] Tool UPDATE_INCIDENT_STATUS com validações de transição

### Fase 3: AI Integration
1. [ ] Configurar AI_GENERATE_OBJECT no server
2. [ ] Criar schema JSON para incidentes
3. [ ] Tool AI_GENERATE_INCIDENT
4. [ ] Validação e sanitização de output AI

### Fase 4: Frontend Admin
1. [ ] Setup React Router com rotas protegidas
2. [ ] Página admin com lista de incidentes
3. [ ] Formulário tradicional de criação/edição
4. [ ] Componente de timeline interativo
5. [ ] Sistema de filtros e busca

### Fase 5: AI-Powered Creation
1. [ ] Interface chat-like para criação
2. [ ] Integração com AI_GENERATE_INCIDENT
3. [ ] Preview e edição do resultado gerado
4. [ ] Sugestões contextuais

### Fase 6: Public Interface
1. [ ] Página pública de visualização
2. [ ] Design focado em clareza para clientes
3. [ ] Timeline pública simplificada
4. [ ] Indicadores visuais de status

### Fase 7: Polish & Deploy
1. [ ] Autenticação e autorização
2. [ ] Testes end-to-end
3. [ ] Otimizações de performance
4. [ ] Deploy para incidents.deco.page

## 🎨 Design Guidelines

### Admin Interface
- Layout clean e funcional
- Foco em eficiência para operadores
- Ações rápidas e atalhos de teclado
- Feedback visual imediato

### Public Interface
- Design minimalista e profissional
- Hierarquia visual clara
- Cores indicativas de severidade
- Mobile-first responsive design

### AI Chat Interface
- Interface conversacional intuitiva
- Sugestões e exemplos contextuais
- Preview em tempo real
- Possibilidade de edição manual

## 🔐 Segurança e Autenticação

1. **Admin Routes**: Protegidas com autenticação (inicialmente @leandro)
2. **Public Routes**: Acesso livre para transparência
3. **Visibilidade**: Respeitar flag `visibility` dos incidentes
4. **Rate Limiting**: Para AI generation endpoints

## 📝 Campos Especiais

### Severity Levels (por recurso)
- **Operational**: ✅ Funcionando normalmente
- **Under Maintenance**: 🔧 Em manutenção programada
- **Degraded Performance**: ⚠️ Performance degradada
- **Partial Outage**: 🟠 Interrupção parcial
- **Major Outage**: 🔴 Interrupção total

### Status Flow
```
INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED
```

### Timeline Events
- Timestamp automático
- Descrição textual do evento
- Anexos opcionais (logs, screenshots)
- Autor do evento (futuro)

## 🤖 AI Generation Schema

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Título conciso do incidente"
    },
    "status": {
      "type": "string",
      "enum": ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]
    },
    "affectedResources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "resource": { "type": "string" },
          "severity": {
            "type": "string",
            "enum": ["Operational", "Under Maintenance", "Degraded Performance", "Partial Outage", "Major Outage"]
          }
        }
      }
    },
    "timeline": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "event": { "type": "string" }
        }
      }
    },
    "commitments": {
      "type": "string",
      "description": "Compromissos e próximos passos"
    }
  },
  "required": ["title", "status", "affectedResources"]
}
```

## 🎯 Métricas de Sucesso

1. **Tempo de criação**: < 2 minutos com AI, < 5 minutos manual
2. **Clareza**: Clientes entendem status sem contato ao suporte
3. **Confiabilidade**: 99.9% uptime da página de status
4. **Adoção**: 100% dos incidentes documentados no sistema

## 🚦 Próximos Passos

1. **Imediato**: Implementar schema do banco de dados
2. **Hoje**: Criar tools básicos de CRUD
3. **Amanhã**: Começar interface administrativa
4. **Semana**: MVP funcional com AI generation

## 📚 Referências

- [Statuspage.io](https://www.atlassian.com/software/statuspage) - Inspiração de UX
- [Incident.io](https://incident.io/) - Melhores práticas
- [GitHub Status](https://www.githubstatus.com/) - Design público clean

---

## Perguntas para Refinamento

1. **Autenticação**: Como será feita a autenticação dos admins? OAuth? Email/senha?
2. **Notificações**: Precisamos de sistema de notificações (email, webhook, etc)?
3. **API Pública**: Precisamos expor API para integração com outros sistemas?
4. **Métricas**: Quais KPIs devemos trackear (MTTR, frequência, etc)?
5. **Idiomas**: Sistema será multi-idioma ou apenas português/inglês?
6. **Integração Status.deco.cx**: Como será a integração com a página existente?

---

*Documento criado em: 23/01/2025*
*Última atualização: 23/01/2025*
