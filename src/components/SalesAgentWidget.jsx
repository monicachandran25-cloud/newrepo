import { useState } from 'react'
import { processAgentMessage } from '../agent/salesAgent.js'

let messageCounter = 1
const createMessageId = () => {
  messageCounter += 1
  return messageCounter
}

export default function SalesAgentWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: 'Hi! I am your Zevro Sales Agent. Ask me anything about your property leads, site visits, or follow-ups.',
      suggestions: ['Upcoming site visits', 'Follow-ups due today', 'Green Valley leads'],
      toolCalled: null,
    },
  ])

  const executeQuery = (queryText) => {
    const trimmed = queryText.trim()
    if (!trimmed) return

    const userMessage = {
      id: createMessageId(),
      sender: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    // Simulate Agentic reasoning and tool invocation latency
    setTimeout(() => {
      const response = processAgentMessage(trimmed)

      const agentMessage = {
        id: createMessageId(),
        sender: 'agent',
        text: response.text,
        items: response.items || null,
        suggestions: response.suggestions || null,
        toolCalled: response.toolCalled || null,
      }

      setMessages((prev) => [...prev, agentMessage])
      setIsThinking(false)
    }, 400)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    executeQuery(inputValue)
  }

  return (
    <div style={styles.container}>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={styles.floatingButton}
          aria-label="Open Zevro Sales Agent"
        >
          <span style={styles.botIconWrapper}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <rect x="4" y="8" width="16" height="12" rx="4" />
              <circle cx="9" cy="13" r="1.25" fill="currentColor" />
              <circle cx="15" cy="13" r="1.25" fill="currentColor" />
              <path d="M9 17h6" />
            </svg>
          </span>
          <span style={styles.buttonLabel}>Sales Agent</span>
          <span style={styles.onlineDot} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={styles.chatPanel} role="dialog" aria-label="Zevro Sales Agent">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.agentAvatar}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                  <rect x="4" y="8" width="16" height="12" rx="4" />
                  <circle cx="9" cy="13" r="1.25" fill="#ffffff" />
                  <circle cx="15" cy="13" r="1.25" fill="#ffffff" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <div>
                <div style={styles.title}>Zevro Sales Agent</div>
                <div style={styles.statusText}>
                  <span style={styles.onlineDotSmall} /> Active Assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={styles.closeButton}
              aria-label="Close Sales Agent"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div style={styles.messageList}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={
                    msg.sender === 'user'
                      ? styles.userBubble
                      : styles.agentBubble
                  }
                >
                  {/* Tool execution badge */}
                  {msg.toolCalled && (
                    <div style={styles.toolBadge}>
                      ⚡ Executed: <code>{msg.toolCalled}</code>
                    </div>
                  )}

                  <div>{msg.text}</div>

                  {/* Render list items returned by tools */}
                  {msg.items && msg.items.length > 0 && (
                    <div style={styles.itemsContainer}>
                      {msg.items.map((item, idx) => (
                        <div key={idx} style={styles.itemCard}>
                          <div style={styles.itemHeader}>
                            <strong style={styles.itemName}>{item.title}</strong>
                            {item.action && (
                              <span style={styles.itemActionBadge}>{item.action}</span>
                            )}
                          </div>
                          <div style={styles.itemDetail}>{item.detail}</div>
                          {item.phone && (
                            <div style={styles.itemActions}>
                              <a
                                href={`tel:${item.phone}`}
                                style={styles.actionLink}
                                title="Call lead"
                              >
                                📞 Call
                              </a>
                              <a
                                href={`mailto:${item.email}`}
                                style={styles.actionLink}
                                title="Email lead"
                              >
                                ✉️ Email
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Quick-prompt suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={styles.suggestionsContainer}>
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => executeQuery(suggestion)}
                          style={styles.suggestionButton}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Tool Execution Indicator */}
            {isThinking && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.agentBubble, fontStyle: 'italic', color: '#5F5C52' }}>
                  <span style={styles.pulseDot} /> Checking CRM tools...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} style={styles.inputForm}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about site visits, follow-ups..."
              style={styles.inputField}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              style={{
                ...styles.sendButton,
                opacity: inputValue.trim() ? 1 : 0.6,
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              }}
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  floatingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    background: '#0e3a7a',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '999px',
    boxShadow: '0 8px 24px rgba(14, 58, 122, 0.35)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  botIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    letterSpacing: '-0.01em',
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#34d399',
    display: 'inline-block',
  },
  chatPanel: {
    width: '360px',
    maxHeight: '560px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E7E4DA',
    boxShadow: '0 16px 40px -8px rgba(24, 22, 15, 0.22)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: '#0e3a7a',
    color: '#ffffff',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  agentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statusText: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.75)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '2px',
  },
  onlineDotSmall: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#34d399',
    display: 'inline-block',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
    opacity: 0.8,
  },
  messageList: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto',
    maxHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#F5F3EB',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  agentBubble: {
    backgroundColor: '#ffffff',
    color: '#18160F',
    padding: '12px 14px',
    borderRadius: '12px 12px 12px 2px',
    fontSize: '13.5px',
    lineHeight: '1.45',
    maxWidth: '90%',
    border: '1px solid #E7E4DA',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  userBubble: {
    backgroundColor: '#1c71e7',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '12px 12px 2px 12px',
    fontSize: '13.5px',
    lineHeight: '1.45',
    maxWidth: '85%',
    boxShadow: '0 1px 3px rgba(28,113,231,0.2)',
  },
  toolBadge: {
    fontSize: '10.5px',
    color: '#0e3a7a',
    backgroundColor: '#e7effc',
    padding: '3px 7px',
    borderRadius: '5px',
    display: 'inline-block',
    marginBottom: '6px',
    fontWeight: 600,
    border: '1px solid #d3e2fb',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '10px',
  },
  itemCard: {
    backgroundColor: '#FAF9F5',
    border: '1px solid #E7E4DA',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '12.5px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
  },
  itemName: {
    color: '#18160F',
    fontSize: '13px',
  },
  itemActionBadge: {
    fontSize: '10.5px',
    backgroundColor: '#e7effc',
    color: '#1c71e7',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  itemDetail: {
    color: '#5F5C52',
    fontSize: '11.5px',
    marginBottom: '6px',
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  actionLink: {
    fontSize: '11px',
    color: '#1c71e7',
    textDecoration: 'none',
    fontWeight: 600,
    backgroundColor: '#ffffff',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #E7E4DA',
  },
  suggestionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  },
  suggestionButton: {
    backgroundColor: '#F1EFE6',
    border: '1px solid #E7E4DA',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '11px',
    color: '#18160F',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  pulseDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#1c71e7',
    marginRight: '6px',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 14px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #E7E4DA',
  },
  inputField: {
    flex: 1,
    border: '1px solid #E7E4DA',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: '#FAF9F5',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#1c71e7',
    color: '#ffffff',
    border: 'none',
    transition: 'opacity 0.2s',
  },
}
