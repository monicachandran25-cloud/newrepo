/**
 * Zevro CRM AI Agent Tools
 * 
 * These functions act as executable tools for the Sales Agent.
 * They extract and structure CRM lead, follow-up, and site-visit data,
 * and provide actionable write operations to update leads and schedule visits.
 */

// Baseline CRM dataset matching the pipeline in page.html
export const INITIAL_LEADS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    stage: 'New Enquiry',
    rm: 'Arjun',
    propertyType: '3 BHK',
    project: 'Green Valley',
    value: '₹86L',
    numericValue: 8600000,
    nextAction: 'Call today',
    urgency: 'high',
    phone: '+1 202-555-0101',
    email: 'rahul.sharma@example.com',
  },
  {
    id: 2,
    name: 'Anjali Nair',
    stage: 'New Enquiry',
    rm: 'Meena',
    propertyType: '2 BHK',
    project: 'Urban Heights',
    value: '₹58L',
    numericValue: 5800000,
    nextAction: 'Qualify',
    urgency: 'medium',
    phone: '+1 202-555-0102',
    email: 'anjali.nair@example.com',
  },
  {
    id: 3,
    name: 'Karan Shah',
    stage: 'Contacted',
    rm: 'Karthik',
    propertyType: '3 BHK',
    project: 'Palm County',
    value: '₹1.10Cr',
    numericValue: 11000000,
    nextAction: 'Share options',
    urgency: 'medium',
    phone: '+1 202-555-0103',
    email: 'karan.shah@example.com',
  },
  {
    id: 4,
    name: 'Divya Rao',
    stage: 'Contacted',
    rm: 'Arjun',
    propertyType: '2 BHK',
    project: 'Green Valley',
    value: '₹62L',
    numericValue: 6200000,
    nextAction: 'Follow up',
    urgency: 'high',
    phone: '+1 202-555-0104',
    email: 'divya.rao@example.com',
  },
  {
    id: 5,
    name: 'Meera Krishnan',
    stage: 'Qualified',
    rm: 'Meena',
    propertyType: '2 BHK',
    project: 'Urban Heights',
    value: '₹64L',
    numericValue: 6400000,
    nextAction: 'Book visit',
    urgency: 'high',
    phone: '+1 202-555-0105',
    email: 'meera.krishnan@example.com',
  },
  {
    id: 6,
    name: 'Vivek Kumar',
    stage: 'Site Visit',
    rm: 'Karthik',
    propertyType: 'Villa',
    project: 'Palm County',
    value: '₹1.42Cr',
    numericValue: 14200000,
    nextAction: 'Visit tomorrow',
    urgency: 'high',
    phone: '+1 202-555-0106',
    email: 'vivek.kumar@example.com',
  },
  {
    id: 7,
    name: 'Sana Qureshi',
    stage: 'Site Visit',
    rm: 'Arjun',
    propertyType: '3 BHK',
    project: 'Green Valley',
    value: '₹88L',
    numericValue: 8800000,
    nextAction: 'Visit today',
    urgency: 'high',
    phone: '+1 202-555-0107',
    email: 'sana.qureshi@example.com',
  },
  {
    id: 8,
    name: 'Rohit Verma',
    stage: 'Negotiation',
    rm: 'Meena',
    propertyType: '3 BHK',
    project: 'Urban Heights',
    value: '₹72L',
    numericValue: 7200000,
    nextAction: 'Revise offer',
    urgency: 'high',
    phone: '+1 202-555-0108',
    email: 'rohit.verma@example.com',
  },
  {
    id: 9,
    name: 'Priya Menon',
    stage: 'Booking',
    rm: 'Karthik',
    propertyType: '2 BHK',
    project: 'Green Valley',
    value: '₹61L',
    numericValue: 6100000,
    nextAction: 'Confirm booking',
    urgency: 'medium',
    phone: '+1 202-555-0109',
    email: 'priya.menon@example.com',
  },
  {
    id: 10,
    name: 'Arun Pillai',
    stage: 'Closed',
    rm: 'Arjun',
    propertyType: 'Villa',
    project: 'Palm County',
    value: '₹1.38Cr',
    numericValue: 13800000,
    nextAction: 'Handover',
    urgency: 'low',
    phone: '+1 202-555-0110',
    email: 'arun.pillai@example.com',
  },
]

// Mutable state store for in-memory CRM updates
let activeLeads = INITIAL_LEADS.map((l) => ({ ...l }))

/**
 * Helper to update live DOM card if visible
 */
function syncDomCard(leadName, nextActionText) {
  if (typeof document === 'undefined') return
  const cards = document.querySelectorAll('.plx-track .lead-card')
  cards.forEach((card) => {
    const name = card.querySelector('.lc-nm')?.textContent.trim()
    if (name && name.toLowerCase().includes(leadName.toLowerCase())) {
      const nextElem = card.querySelector('.lc-next b')
      if (nextElem) {
        nextElem.textContent = nextActionText
      }
    }
  })
}

/**
 * TOOL 1: getLeads
 * Retrieves all leads in the sales pipeline.
 * Optionally filters by project, stage, relationship manager, or name substring.
 */
export function getLeads(filters = {}) {
  let leads = activeLeads.map((l) => ({ ...l }))

  if (filters.name) {
    const term = filters.name.toLowerCase().trim()
    leads = leads.filter((l) => l.name.toLowerCase().includes(term))
  }
  if (filters.project) {
    leads = leads.filter(
      (l) => l.project.toLowerCase() === filters.project.toLowerCase()
    )
  }
  if (filters.stage) {
    leads = leads.filter(
      (l) => l.stage.toLowerCase() === filters.stage.toLowerCase()
    )
  }
  if (filters.rm) {
    leads = leads.filter(
      (l) => l.rm.toLowerCase() === filters.rm.toLowerCase()
    )
  }

  return leads
}

/**
 * TOOL 2: findLeadByName
 * Looks up a specific lead by their first or full name.
 */
export function findLeadByName(nameQuery) {
  if (!nameQuery) return null
  const term = nameQuery.trim().toLowerCase()
  return (
    activeLeads.find((l) => l.name.toLowerCase().includes(term)) || null
  )
}

/**
 * TOOL 3: getFollowUps
 * Retrieves pending follow-up tasks across leads.
 * Can filter for today's urgent actions.
 */
export function getFollowUps(options = {}) {
  const allLeads = getLeads()

  let followUps = allLeads
    .filter((lead) => Boolean(lead.nextAction))
    .map((lead) => ({
      leadId: lead.id,
      leadName: lead.name,
      project: lead.project,
      stage: lead.stage,
      rm: lead.rm,
      action: lead.nextAction,
      isDueToday:
        lead.nextAction.toLowerCase().includes('today') ||
        lead.nextAction.toLowerCase() === 'follow up' ||
        lead.nextAction.toLowerCase() === 'call today',
      phone: lead.phone,
      email: lead.email,
    }))

  if (options.dueTodayOnly) {
    followUps = followUps.filter((f) => f.isDueToday)
  }

  return followUps
}

/**
 * TOOL 4: getSiteVisits
 * Retrieves leads that are currently scheduled for a property site visit
 * or are in the 'Site Visit' stage.
 */
export function getSiteVisits() {
  const allLeads = getLeads()

  return allLeads
    .filter((lead) => {
      const stageMatch = lead.stage.toLowerCase() === 'site visit'
      const actionMatch = lead.nextAction?.toLowerCase().includes('visit')
      return stageMatch || actionMatch
    })
    .map((lead) => ({
      leadId: lead.id,
      leadName: lead.name,
      project: lead.project,
      propertyType: lead.propertyType,
      value: lead.value,
      rm: lead.rm,
      stage: lead.stage,
      visitSchedule: lead.nextAction,
      phone: lead.phone,
      email: lead.email,
    }))
}

/**
 * ACTION TOOL 5: scheduleSiteVisit
 * Schedules or reschedules a site visit for a lead.
 * Updates stage to 'Site Visit' and sets the next action schedule.
 */
export function scheduleSiteVisit(nameOrId, dateOrTime) {
  const term = String(nameOrId).toLowerCase().trim()
  const leadIndex = activeLeads.findIndex(
    (l) => l.id === Number(nameOrId) || l.name.toLowerCase().includes(term)
  )

  if (leadIndex === -1) {
    return {
      success: false,
      message: `Could not find lead matching "${nameOrId}".`,
    }
  }

  const lead = activeLeads[leadIndex]
  const newAction = `Visit ${dateOrTime}`
  lead.stage = 'Site Visit'
  lead.nextAction = newAction

  // Update in browser DOM
  syncDomCard(lead.name, newAction)

  return {
    success: true,
    lead: { ...lead },
    message: `Site visit scheduled for ${lead.name} (${dateOrTime}) at ${lead.project}.`,
  }
}

/**
 * ACTION TOOL 6: updateLeadNextAction
 * Updates a lead's next follow-up task or notes.
 */
export function updateLeadNextAction(nameOrId, newAction) {
  const term = String(nameOrId).toLowerCase().trim()
  const leadIndex = activeLeads.findIndex(
    (l) => l.id === Number(nameOrId) || l.name.toLowerCase().includes(term)
  )

  if (leadIndex === -1) {
    return {
      success: false,
      message: `Could not find lead matching "${nameOrId}".`,
    }
  }

  const lead = activeLeads[leadIndex]
  lead.nextAction = newAction

  // Update in browser DOM
  syncDomCard(lead.name, newAction)

  return {
    success: true,
    lead: { ...lead },
    message: `Updated next action for ${lead.name} to "${newAction}".`,
  }
}

/**
 * ACTION TOOL 7: updateLeadStage
 * Moves a lead to a new sales pipeline stage.
 */
export function updateLeadStage(nameOrId, newStage) {
  const term = String(nameOrId).toLowerCase().trim()
  const leadIndex = activeLeads.findIndex(
    (l) => l.id === Number(nameOrId) || l.name.toLowerCase().includes(term)
  )

  if (leadIndex === -1) {
    return {
      success: false,
      message: `Could not find lead matching "${nameOrId}".`,
    }
  }

  const lead = activeLeads[leadIndex]
  lead.stage = newStage

  return {
    success: true,
    lead: { ...lead },
    message: `Moved ${lead.name} to "${newStage}" stage.`,
  }
}

/**
 * Agent Tool Declarations (Schema definition)
 * Used when connecting to an LLM function-calling engine (Gemini, OpenAI, etc.)
 */
export const crmToolDeclarations = [
  {
    name: 'getLeads',
    description: 'Get all property buyer leads from the CRM pipeline, optionally filtered by project, stage, RM, or name.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Search leads by buyer name' },
        project: { type: 'string', description: 'Filter by project name (e.g., Green Valley, Urban Heights, Palm County)' },
        stage: { type: 'string', description: 'Filter by pipeline stage (e.g., New Enquiry, Contacted, Qualified, Site Visit, Negotiation, Booking, Closed)' },
        rm: { type: 'string', description: 'Filter by Relationship Manager name (e.g., Arjun, Meena, Karthik)' },
      },
    },
    execute: getLeads,
  },
  {
    name: 'findLeadByName',
    description: 'Find a specific lead by their first or full name.',
    parameters: {
      type: 'object',
      properties: {
        nameQuery: { type: 'string', description: 'The buyer name to look up' },
      },
      required: ['nameQuery'],
    },
    execute: findLeadByName,
  },
  {
    name: 'getFollowUps',
    description: 'Get pending sales follow-ups and calls that need attention.',
    parameters: {
      type: 'object',
      properties: {
        dueTodayOnly: { type: 'boolean', description: 'Whether to return only follow-ups due today' },
      },
    },
    execute: getFollowUps,
  },
  {
    name: 'getSiteVisits',
    description: 'Get upcoming and scheduled site visits for properties.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: getSiteVisits,
  },
  {
    name: 'scheduleSiteVisit',
    description: 'Schedule a property site visit for a lead.',
    parameters: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'The lead name or ID' },
        dateOrTime: { type: 'string', description: 'When the visit should take place (e.g., Friday, Tomorrow 3 PM, Saturday)' },
      },
      required: ['nameOrId', 'dateOrTime'],
    },
    execute: scheduleSiteVisit,
  },
  {
    name: 'updateLeadNextAction',
    description: 'Update the next follow-up action for a lead.',
    parameters: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'The lead name or ID' },
        newAction: { type: 'string', description: 'The new next action (e.g., Call completed, Send quotation)' },
      },
      required: ['nameOrId', 'newAction'],
    },
    execute: updateLeadNextAction,
  },
  {
    name: 'updateLeadStage',
    description: 'Move a lead to a new pipeline stage.',
    parameters: {
      type: 'object',
      properties: {
        nameOrId: { type: 'string', description: 'The lead name or ID' },
        newStage: { type: 'string', description: 'The new stage (e.g., Negotiation, Booking)' },
      },
      required: ['nameOrId', 'newStage'],
    },
    execute: updateLeadStage,
  },
]
