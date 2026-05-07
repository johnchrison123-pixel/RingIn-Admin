import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Experts({ adminRole, session }) {
  var expertsS = useState([]);
  var experts = expertsS[0];
  var setExperts = expertsS[1];

  var applicationsS = useState([]);
  var applications = applicationsS[0];
  var setApplications = applicationsS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var processingS = useState(null);
  var processing = processingS[0];
  var setProcessing = processingS[1];

  // Fetch experts
  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        var { data, error } = await sb.from('profiles').select('*').eq('is_expert', true);
        if (error) throw error;
        setExperts(data || []);
      } catch (err) {
        console.error('Error fetching experts:', err);
      }
      setLoading(false);
    };
    fetchExperts();
  }, []);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        var { data, error } = await sb
          .from('profiles')
          .select('*')
          .not('expert_application', 'is', null)
          .eq('is_expert', false);
        if (error) throw error;
        setApplications(data || []);
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };
    fetchApplications();
  }, []);

  var handleApproveApplication = async (profileId) => {
    setProcessing(profileId);
    try {
      var { error } = await sb.from('profiles').update({ is_expert: true }).eq('id', profileId);
      if (error) throw error;
      setApplications(applications.filter(a => a.id !== profileId));
      var updated = applications.find(a => a.id === profileId);
      if (updated) {
        setExperts([...experts, { ...updated, is_expert: true }]);
      }
    } catch (err) {
      console.error('Error approving application:', err);
    }
    setProcessing(null);
  };

  var handleRejectApplication = async (profileId) => {
    setProcessing(profileId);
    try {
      var { error } = await sb.from('profiles').update({ expert_application: null }).eq('id', profileId);
      if (error) throw error;
      setApplications(applications.filter(a => a.id !== profileId));
    } catch (err) {
      console.error('Error rejecting application:', err);
    }
    setProcessing(null);
  };

  var handleSuspend = async (profileId) => {
    if (!window.confirm('Suspend this expert?')) return;
    try {
      var { error } = await sb.from('profiles').update({ is_expert: false }).eq('id', profileId);
      if (error) throw error;
      setExperts(experts.filter(e => e.id !== profileId));
    } catch (err) {
      console.error('Error suspending expert:', err);
    }
  };

  var formatDate = (date) => {
    if (!date) return '';
    var d = new Date(date);
    return d.toLocaleDateString();
  };

  var getUserInitials = (displayName) => {
    if (!displayName) return 'E';
    return displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
    React.createElement('h1', null, 'Expert Management'),

    // Pending Applications Section
    React.createElement('div', {
      style: {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '30px'
      }
    },
      React.createElement('h2', {
        style: {
          margin: '0 0 15px 0',
          fontSize: '18px'
        }
      }, `Pending Applications (${applications.length})`),
      applications.length === 0 ?
        React.createElement('p', { style: { color: 'var(--t3)', margin: 0 } }, 'No pending applications') :
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px'
          }
        },
          applications.map(app =>
            React.createElement('div', {
              key: app.id,
              style: {
                background: 'var(--bg3)',
                border: '1px solid var(--amber)',
                borderRadius: '6px',
                padding: '12px'
              }
            },
              React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '10px' } },
                React.createElement('div', {
                  style: {
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--ac)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    flexShrink: 0
                  }
                }, getUserInitials(app.display_name)),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('p', { style: { margin: '0 0 2px 0', fontWeight: '600' } }, app.display_name || 'Unknown'),
                  React.createElement('p', {
                    style: {
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--t3)'
                    }
                  }, app.expertise || 'No specialty specified')
                )
              ),
              React.createElement('div', {
                style: {
                  background: 'var(--bg)',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: 'var(--t2)',
                  minHeight: '40px'
                }
              }, app.expert_application || 'No application text'),
              React.createElement('div', {
                style: {
                  marginBottom: '10px',
                  fontSize: '12px',
                  color: 'var(--t3)'
                }
              }, 'Requested rate: ' + (app.expert_rate || 'Not specified')),
              React.createElement('div', {
                style: {
                  display: 'flex',
                  gap: '8px'
                }
              },
                React.createElement('button', {
                  onClick: () => handleApproveApplication(app.id),
                  disabled: processing === app.id,
                  style: {
                    flex: 1,
                    padding: '6px 8px',
                    background: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }
                }, processing === app.id ? 'Approving...' : '✓ Approve'),
                React.createElement('button', {
                  onClick: () => handleRejectApplication(app.id),
                  disabled: processing === app.id,
                  style: {
                    flex: 1,
                    padding: '6px 8px',
                    background: 'var(--red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }
                }, processing === app.id ? 'Rejecting...' : '✗ Reject')
              )
            )
          )
        )
    ),

    // Experts Table
    React.createElement('h2', { style: { margin: '20px 0 15px 0' } }, `Active Experts (${experts.length})`),
    loading ? React.createElement('p', null, 'Loading experts...') :
      experts.length === 0 ? React.createElement('p', { style: { color: 'var(--t3)' } }, 'No experts yet') :
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
                React.createElement('th', { style: { padding: '12px', textAlign: 'left' } }, 'Name'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left' } }, 'Specialty'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left' } }, 'Rating'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left' } }, 'Calls'),
                React.createElement('th', { style: { padding: '12px', textAlign: 'left' } }, 'Actions')
              )
            ),
            React.createElement('tbody', null,
              experts.map((expert, idx) =>
                React.createElement('tr', {
                  key: expert.id,
                  style: {
                    borderBottom: '1px solid var(--border)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg3)'
                  }
                },
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
                      React.createElement('div', {
                        style: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--ac)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          flexShrink: 0
                        }
                      }, getUserInitials(expert.display_name)),
                      expert.display_name || 'Unknown'
                    )
                  ),
                  React.createElement('td', { style: { padding: '12px' } }, expert.expertise || '-'),
                  React.createElement('td', { style: { padding: '12px' } }, expert.expert_rating ? expert.expert_rating.toFixed(1) + '⭐' : 'N/A'),
                  React.createElement('td', { style: { padding: '12px' } }, expert.calls || '0'),
                  React.createElement('td', { style: { padding: '12px' } },
                    React.createElement('button', {
                      onClick: () => handleSuspend(expert.id),
                      style: {
                        padding: '4px 10px',
                        background: 'var(--red)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }
                    }, 'Suspend')
                  )
                )
              )
            )
          )
        )
  );
}
