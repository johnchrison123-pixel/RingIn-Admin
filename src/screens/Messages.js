import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Messages({ adminRole, session }) {
  var messagesS = useState([]);
  var messages = messagesS[0];
  var setMessages = messagesS[1];

  var searchS = useState('');
  var search = searchS[0];
  var setSearch = searchS[1];

  var filteredS = useState([]);
  var filtered = filteredS[0];
  var setFiltered = filteredS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var deletingS = useState(null);
  var deleting = deletingS[0];
  var setDeleting = deletingS[1];

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        var { data, error } = await sb
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
      setLoading(false);
    };
    fetchMessages();
  }, []);

  // Filter on search
  useEffect(() => {
    var result = messages;
    if (search.trim()) {
      var q = search.toLowerCase();
      result = result.filter(m =>
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.sender_id && m.sender_id.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [messages, search]);

  var handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    setDeleting(messageId);
    try {
      var { error } = await sb.from('messages').delete().eq('id', messageId);
      if (error) throw error;
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
    setDeleting(null);
  };

  var formatDate = (date) => {
    var d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  var truncate = (str, length) => {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'var(--bg)',
      minHeight: '100vh',
      color: 'var(--text)'
    }
  },
    // Header
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('div', {
        style: {
          padding: '10px 12px',
          background: 'var(--amber)',
          color: 'white',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '14px'
        }
      }, '⚠️ Message monitoring — handle with privacy care'),
      React.createElement('h1', { style: { margin: '0 0 5px 0' } }, 'Message Monitoring'),
      React.createElement('p', { style: { color: 'var(--t3)', margin: 0 } }, `Last 50 messages (${filtered.length} shown)`)
    ),

    // Search
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search by content or sender...',
        value: search,
        onChange: (e) => setSearch(e.target.value),
        style: {
          width: '100%',
          maxWidth: '400px',
          padding: '8px 12px',
          background: 'var(--bg2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '6px'
        }
      })
    ),

    // Messages Table
    loading ? React.createElement('p', null, 'Loading messages...') :
      filtered.length === 0 ? React.createElement('p', { style: { color: 'var(--t3)' } }, 'No messages found') :
        React.createElement('div', {
          style: {
            overflowX: 'auto',
            background: 'var(--bg2)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }
        },
          React.createElement('table', {
            style: {
              width: '100%',
              borderCollapse: 'collapse'
            }
          },
            React.createElement('thead', null,
              React.createElement('tr', {
                style: {
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg3)'
                }
              },
                React.createElement('th', { style: { padding: '12px', textAlign: 'left', minWidth: '120px' } }, 'Sender'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left', minWidth: '300px' } }, 'Content'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left', minWidth: '150px' } }, 'Conversation'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left', minWidth: '160px' } }, 'Date'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left', minWidth: '80px' } }, 'Actions')
              )
            ),
            React.createElement('tbody', null,
              filtered.map((msg, idx) =>
                React.createElement('tr', {
                  key: msg.id,
                  style: {
                    borderBottom: '1px solid var(--border)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg3)'
                  }
                },
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('code', {
                      style: {
                        fontSize: '11px',
                        background: 'var(--bg)',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        color: 'var(--ac)',
                        maxWidth: '120px',
                        display: 'inline-block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }, truncate(msg.sender_id, 12))
                  ),
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('p', {
                      style: {
                        margin: 0,
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }, truncate(msg.content, 50))
                  ),
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('code', {
                      style: {
                        fontSize: '11px',
                        background: 'var(--bg)',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        color: 'var(--t3)',
                        maxWidth: '150px',
                        display: 'inline-block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }, truncate(msg.conversation_id, 16))
                  ),
                  React.createElement('td', { style: { padding: '12px', fontSize: '12px', color: 'var(--t3)' } },
                    formatDate(msg.created_at)
                  ),
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('button', {
                      onClick: () => handleDelete(msg.id),
                      disabled: deleting === msg.id,
                      style: {
                        padding: '4px 10px',
                        background: 'var(--red)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }
                    }, deleting === msg.id ? 'Deleting...' : '🗑')
                  )
                )
              )
            )
          )
        )
  );
}
