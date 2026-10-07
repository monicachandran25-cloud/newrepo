import {
  getLeads,
  findLeadByName,
  getFollowUps,
  getSiteVisits,
  scheduleSiteVisit,
  updateLeadNextAction,
  updateLeadStage,
} from '../tools/crmTools.js'

const KNOWN_NAMES = [
  'rahul',
  'anjali',
  'karan',
  'divya',
  'meera',
  'vivek',
  'sana',
  'rohit',
  'priya',
  'arun',
]

/**
 * Sales Agent Decision Engine
 * 
 * Takes a natural language query from the user, decides which CRM tool
 * to invoke (read or write action), executes the tool, and formats the response.
 */
export function processAgentMessage(userQuery) {
  const query = (userQuery || '').trim().toLowerCase()

  // 1. GREETING / HELP
  if (/^(hi|hello|hey|help|who are you|what can you do)/i.test(query)) {
    return {
      text: "Hello! I'm your Zevro Sales Copilot. I can query leads, check site visits, and execute sales actions.",
      suggestions: [
        "Show me Vivek's details",
        'Upcoming site visits',
        'Follow-ups due today',
        'Schedule visit for Meera on Friday',
      ],
      toolCalled: null,
    }
  }

  // -------------------------------------------------------------
  // ACTION TOOLS (WRITE OPERATIONS)
  // -------------------------------------------------------------

  // Action: Schedule a site visit (e.g., "Schedule visit for Meera on Friday", "Book visit for Rahul tomorrow")
  if (
    (query.includes('schedule') || query.includes('book')) &&
    query.includes('visit')
  ) {
    const matchedName = KNOWN_NAMES.find((name) => query.includes(name))
    if (matchedName) {
      // Extract time/day if present
      let when = 'this week'
      if (query.includes('tomorrow')) when = 'tomorrow'
      else if (query.includes('today')) when = 'today'
      else if (query.includes('friday')) when = 'Friday'
      else if (query.includes('saturday')) when = 'Saturday'
      else if (query.includes('sunday')) when = 'Sunday'
      else if (query.includes('monday')) when = 'Monday'
      else if (query.includes('next week')) when = 'next week'

      const result = scheduleSiteVisit(matchedName, when)
      if (result.success) {
        return {
          text: `✅ ${result.message}`,
          toolCalled: `scheduleSiteVisit('${result.lead.name}', '${when}')`,
          items: [
            {
              title: result.lead.name,
              detail: `${result.lead.project} • ${result.lead.propertyType} (${result.lead.value}) • Stage: ${result.lead.stage}`,
              action: result.lead.nextAction,
              phone: result.lead.phone,
              email: result.lead.email,
              rm: result.lead.rm,
            },
          ],
          suggestions: [
            `Show me ${result.lead.name}'s details`,
            'Upcoming site visits',
          ],
        }
      }
    }
  }

  // Action: Update next action / mark task (e.g., "Mark Rahul as called", "Update Vivek next action to Send brochure")
  if (
    query.includes('mark') ||
    query.includes('update action') ||
    query.includes('change action')
  ) {
    const matchedName = KNOWN_NAMES.find((name) => query.includes(name))
    if (matchedName) {
      let newAction = 'Call completed'
      if (query.includes('called')) newAction = 'Call completed'
      else if (query.includes('brochure')) newAction = 'Brochure sent'
      else if (query.includes('quote') || query.includes('pricing')) newAction = 'Quote shared'
      else if (query.includes('follow up')) newAction = 'Follow up next week'

      const result = updateLeadNextAction(matchedName, newAction)
      if (result.success) {
        return {
          text: `✅ ${result.message}`,
          toolCalled: `updateLeadNextAction('${result.lead.name}', '${newAction}')`,
          items: [
            {
              title: result.lead.name,
              detail: `${result.lead.project} • ${result.lead.propertyType} (${result.lead.value})`,
              action: result.lead.nextAction,
              phone: result.lead.phone,
              email: result.lead.email,
              rm: result.lead.rm,
            },
          ],
          suggestions: [`Show me ${result.lead.name}`, 'Follow-ups due today'],
        }
      }
    }
  }

  // Action: Move stage (e.g., "Move Sana to negotiation", "Move Priya to booking")
  if (query.includes('move') || query.includes('stage')) {
    const matchedName = KNOWN_NAMES.find((name) => query.includes(name))
    if (matchedName) {
      let targetStage = 'Negotiation'
      if (query.includes('negotiation')) targetStage = 'Negotiation'
      else if (query.includes('booking')) targetStage = 'Booking'
      else if (query.includes('closed')) targetStage = 'Closed'
      else if (query.includes('site visit')) targetStage = 'Site Visit'

      const result = updateLeadStage(matchedName, targetStage)
      if (result.success) {
        return {
          text: `✅ ${result.message}`,
          toolCalled: `updateLeadStage('${result.lead.name}', '${targetStage}')`,
          items: [
            {
              title: result.lead.name,
              detail: `${result.lead.project} • ${result.lead.propertyType} (${result.lead.value}) • Stage: ${result.lead.stage}`,
              action: result.lead.nextAction,
              phone: result.lead.phone,
              email: result.lead.email,
              rm: result.lead.rm,
            },
          ],
        }
      }
    }
  }

  // -------------------------------------------------------------
  // LEAD NAME SEARCH INTENT (e.g. "Show me Vivek's details", "Who is Rahul?", "Find Anjali")
  // -------------------------------------------------------------
  const matchedLeadName = KNOWN_NAMES.find((name) => query.includes(name))
  if (
    matchedLeadName &&
    (query.includes('detail') ||
      query.includes('show') ||
      query.includes('who') ||
      query.includes('find') ||
      query.includes('tell') ||
      query.includes('about') ||
      query.includes('lead') ||
      query.trim() === matchedLeadName)
  ) {
    const lead = findLeadByName(matchedLeadName)
    if (lead) {
      return {
        text: `Here are the CRM details for ${lead.name}:`,
        toolCalled: `findLeadByName('${lead.name}')`,
        items: [
          {
            title: `${lead.name} (${lead.stage})`,
            detail: `${lead.project} • ${lead.propertyType} • Value: ${lead.value} • RM: ${lead.rm}`,
            action: lead.nextAction,
            phone: lead.phone,
            email: lead.email,
            rm: lead.rm,
          },
        ],
        suggestions: [
          `Schedule visit for ${lead.name} on Friday`,
          `Mark ${lead.name} as called`,
          `All ${lead.project} leads`,
        ],
      }
    }
  }

  // -------------------------------------------------------------
  // SITE VISITS INTENT
  // -------------------------------------------------------------
  if (query.includes('visit') || query.includes('tour') || query.includes('schedule')) {
    let visits = getSiteVisits()
    let timeFilterText = ''

    if (query.includes('tomorrow')) {
      visits = visits.filter((v) => v.visitSchedule?.toLowerCase().includes('tomorrow'))
      timeFilterText = ' scheduled for tomorrow'
    } else if (query.includes('today')) {
      visits = visits.filter((v) => v.visitSchedule?.toLowerCase().includes('today'))
      timeFilterText = ' scheduled for today'
    }

    if (!visits.length) {
      return {
        text: `No site visits are currently${timeFilterText || ' scheduled'} in the pipeline.`,
        toolCalled: 'getSiteVisits()',
      }
    }

    const countText = visits.length === 1 ? '1 site visit' : `${visits.length} site visits`
    return {
      text: `Found ${countText}${timeFilterText}:`,
      toolCalled: 'getSiteVisits()',
      items: visits.map((v) => ({
        title: v.leadName,
        detail: `${v.project} • ${v.propertyType} (${v.value})`,
        action: v.visitSchedule,
        phone: v.phone,
        email: v.email,
        rm: v.rm,
      })),
    }
  }

  // -------------------------------------------------------------
  // FOLLOW-UPS & CALLS INTENT
  // -------------------------------------------------------------
  if (
    query.includes('follow') ||
    query.includes('call') ||
    query.includes('due') ||
    query.includes('urgent') ||
    query.includes('today')
  ) {
    const dueTodayOnly = query.includes('today') || query.includes('urgent')
    const followUps = getFollowUps({ dueTodayOnly })
    const label = dueTodayOnly ? 'due today' : 'pending'

    if (!followUps.length) {
      return {
        text: `No follow-ups are marked as ${label}.`,
        toolCalled: 'getFollowUps()',
      }
    }

    return {
      text: `Here are ${followUps.length} follow-ups ${label}:`,
      toolCalled: 'getFollowUps()',
      items: followUps.map((f) => ({
        title: f.leadName,
        detail: `${f.project} • RM: ${f.rm}`,
        action: f.action,
        phone: f.phone,
        email: f.email,
      })),
    }
  }

  // -------------------------------------------------------------
  // LEADS & DEALS (with project/stage filters)
  // -------------------------------------------------------------
  let projectFilter = null
  if (query.includes('green valley')) projectFilter = 'Green Valley'
  else if (query.includes('urban heights')) projectFilter = 'Urban Heights'
  else if (query.includes('palm county')) projectFilter = 'Palm County'

  let stageFilter = null
  if (query.includes('new enquiry') || query.includes('new lead') || query.includes('enquiry')) stageFilter = 'New Enquiry'
  else if (query.includes('negotiation')) stageFilter = 'Negotiation'
  else if (query.includes('booking')) stageFilter = 'Booking'
  else if (query.includes('closed')) stageFilter = 'Closed'

  const leads = getLeads({ project: projectFilter, stage: stageFilter })

  // Sort by highest value if asked
  if (
    query.includes('top') ||
    query.includes('highest') ||
    query.includes('high value') ||
    query.includes('value')
  ) {
    leads.sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
  }

  if (
    query.includes('lead') ||
    query.includes('deal') ||
    query.includes('pipeline') ||
    query.includes('buyer') ||
    projectFilter ||
    stageFilter
  ) {
    const filterDesc = [projectFilter, stageFilter].filter(Boolean).join(' • ')
    return {
      text: filterDesc
        ? `Found ${leads.length} leads matching "${filterDesc}":`
        : `Here are ${leads.length} leads in the sales pipeline:`,
      toolCalled: 'getLeads()',
      items: leads.slice(0, 5).map((l) => ({
        title: l.name,
        detail: `${l.project} • ${l.propertyType} (${l.value}) • Stage: ${l.stage}`,
        action: l.nextAction,
        phone: l.phone,
        email: l.email,
        rm: l.rm,
      })),
    }
  }

  // -------------------------------------------------------------
  // DEFAULT FALLBACK
  // -------------------------------------------------------------
  return {
    text: `I'm not sure how to answer "${userQuery}". You can ask about a lead by name (e.g., "Show me Vivek"), check site visits, or schedule a tour.`,
    suggestions: [
      "Show me Vivek's details",
      'Upcoming site visits',
      'Follow-ups due today',
    ],
    toolCalled: null,
  }
}
