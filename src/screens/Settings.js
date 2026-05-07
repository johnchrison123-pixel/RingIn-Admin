import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Settings({ adminRole, session }) {
  var adminsS = useState([]);
  var admins = adminsS[0];
  var setAdmins = adminsS[1];

  var newAdminEmailS = useState('');
  var newAdminEmail = newAdminEmailS[0];
  var setNewAdminEmail = newAdminEmailS[1];

  var newAdminRoleS = useState('admin');
  var newAdminRole = newAdminRoleS[0];
  var setNewAdminRole = newAdminRoleS[1];

  var maintenanceModeS = useState(localStorage.getItem('maintenance_mode') === 'true');
  var maintenanceMode = maintenanceModeS[0];
  var setMaintenanceMode = maintenanceModeS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var addingAdminS = useState(false);
  var addingAdmin = addingAdminS[0];
  var setAddingAdmin = addingAdminS[1];

  var removingAdminS = useState(null);
  var removingAdmin = removingAdminS[0];
  var setRemovingAdmin = removingAdminS[1];

  var clearingS = useState(false);
  var clearing = clearingS[0];
  var setClearing = clearingS[1];

  var supabaseStatusS = useState('Checking...');
  var supabaseStatus = supabaseStatusS[0];
  var setSupabaseStatus = supabaseStatusS[1];

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        var { data, error } = await sb.from('admins').select('*');
        if (error) throw error;
        setAdmins(data || []);
      } catch (err) {
        console.error('Error fetching admins:', err);
      }
      setLoading(false);
    };
    fetchAdmins();
  }, []);

  // Check Supabase connection
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        var { data, error } = await sb.from('profiles').select('*').limit(1);
        if (error) {
          setSupabaseStatus('Connection Error');
        } else {
          setSupabaseStatus('Connected');
        }
      } catch {
        setSupabaseStatus('Connection Error');
      }
    };
    checkSupabase();
  }, []);

  var handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert('Email is required');
      return;
    }
    setAddingAdmin(true);
    try {
      var { error } = await sb.from('admins').insert({
        email: newAdminEmail,
        role: newAdminRole
      });
      if (error) throw error;
      setNewAdminEmail('');
      setNewAdminRole('admin');
      // Refresh admins list
      var { data } = await sb.from('admins').select('*');
      setAdmins(data || []);
    } catch (err) {
      console.error('Error adding admin:', err);
      alert('Error adding admin');
    }
    setAddingAdmin(false);
  };

  var handleRemoveAdmin = async (adminId) => {
    if (!window.confirm('Remove this admin?')) return;
    setRemovingAdmin(adminId);
    try {
      var { error } = await sb.from('admins').delete().eq('id', adminId);
      if (error) throw error;
      setAdmins(admins.filter(a => a.id !== adminId));
    } catch (err) {
      console.error('Error removing admin:', err);
    }
    setRemovingAdmin(null);
  };

  var handleClearFlaggedPosts = async () => {
    if (!window.confirm('Delete ALL flagged posts? This cannot be undone.')) return;
    setClearing(true);
    try {
      var { error } = await sb.from('posts').delete().eq('flagged', true);
      if (error) throw error;
      alert('All flagged posts deleted');
    } catch (err) {
      console.error('Error clearing flagged posts:', err);
      alert('Error clearing flagged posts');
    }
    setClearing(false);
  };

  var handleMaintenanceModeToggle = (value) => {
    setMaintenanceMode(value);
    localStorage.setItem('maintenance_mode', value.toString());
  };

  var formatDate = (date) => {
    if (!date) return 'N/A';
    var d = new Date(date);
    return d.toLocaleDateString();
  };

  var getRoleBadgeColor = (role) => {
    return role === 'master' ? 'var(--red)' : 'var(--ac)';
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'var(--bg)',
      minHeight: '100vh',
      color: 'var(--text)'
    }
  },
    React.createElement('h1', null, 'Admin Settings'),

    // Admin Accounts Section
    React.createElement('div', {
      style: {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }
    },
      React.createElement('h2', { style: { margin: '0 0 20px 0' } }, 'Admin Accounts'),

      // Add Admin Form
      React.createElement('div', {
        style: {
          background: 'var(--bg3)',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px'
        }
      },
        React.createElement('p', { style: { color: 'var(--t3)', margin: '0 0 12px 0', fontSize: '13px' } }, 'Add New Admin'),
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 150px 80px',
            gap: '10px',
            alignItems: 'end'
          }
        },
          React.createElement('input', {
            type: 'email',
            placeholder: 'Admin email',
            value: newAdminEmail,
            onChange: (e) => setNewAdminEmail(e.target.value),
            style: {
              padding: '8px 12px',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '4px'
            }
          }),
          React.createElement('select', {
            value: newAdminRole,
            onChange: (e) => setNewAdminRole(e.target.value),
            style: {
              padding: '8px 12px',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '4px'
            }
          },
            React.createElement('option', { value: 'admin' }, 'Admin'),
            React.createElement('option', { value: 'master' }, 'Master')
          ),
          React.createElement('button', {
            onClick: handleAddAdmin,
            disabled: addingAdmin,
            style: {
              padding: '8px 12px',
              background: 'var(--green)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, addingAdmin ? 'Adding...' : 'Add')
        )
      ),

      // Admins List
      React.createElement('div', null,
        loading ? React.createElement('p', null, 'Loading...') :
          admins.length === 0 ? React.createElement('p', { style: { color: 'var(--t3)' } }, 'No admins') :
            React.createElement('div', {
              style: {
                overflowX: 'auto'
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
                      background: 'var(--bg)'
                    }
                  },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Email'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Role'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Joined'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left' } }, 'Action')
                  )
                ),
                React.createElement('tbody', null,
                  admins.map((admin, idx) =>
                    React.createElement('tr', {
                      key: admin.id,
                      style: {
                        borderBottom: '1px solid var(--border)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg)'
                      }
                    },
                      React.createElement('td', { style: { padding: '10px' } }, admin.email),
                      React.createElement('td', { style: { padding: '10px' } },
                        React.createElement('span', {
                          style: {
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: getRoleBadgeColor(admin.role),
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }
                        }, admin.role)
                      ),
                      React.createElement('td', { style: { padding: '10px', fontSize: '12px', color: 'var(--t3)' } }, formatDate(admin.created_at)),
                      React.createElement('td', { style: { padding: '10px' } },
                        adminRole === 'master' && React.createElement('button', {
                          onClick: () => handleRemoveAdmin(admin.id),
                          disabled: removingAdmin === admin.id,
                          style: {
                            padding: '4px 10px',
                            background: 'var(--red)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }
                        }, removingAdmin === admin.id ? 'Removing...' : 'Remove')
                      )
                    )
                  )
                )
              )
            )
      )
    ),

    // App Settings Section
    React.createElement('div', {
      style: {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }
    },
      React.createElement('h2', { style: { margin: '0 0 20px 0' } }, 'App Settings'),

      // Maintenance Mode
      React.createElement('div', {
        style: {
          padding: '15px',
          background: 'var(--bg3)',
          borderRadius: '6px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }
      },
        React.createElement('div', null,
          React.createElement('p', { style: { margin: '0 0 5px 0', fontWeight: '600' } }, 'Maintenance Mode'),
          React.createElement('p', { style: { margin: 0, fontSize: '12px', color: 'var(--t3)' } }, 'Temporarily disable app access')
        ),
        React.createElement('button', {
          onClick: () => handleMaintenanceModeToggle(!maintenanceMode),
          style: {
            padding: '6px 16px',
            background: maintenanceMode ? 'var(--red)' : 'var(--green)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }
        }, maintenanceMode ? 'ON' : 'OFF')
      ),

      // App name
      React.createElement('div', {
        style: {
          padding: '15px',
          background: 'var(--bg3)',
          borderRadius: '6px',
          marginBottom: '15px'
        }
      },
        React.createElement('p', { style: { margin: '0 0 8px 0', fontWeight: '600' } }, 'App Name'),
        React.createElement('p', { style: { margin: 0, color: 'var(--t2)' } }, 'RingIn Admin')
      ),

      // Supabase status
      React.createElement('div', {
        style: {
          padding: '15px',
          background: 'var(--bg3)',
          borderRadius: '6px'
        }
      },
        React.createElement('p', { style: { margin: '0 0 8px 0', fontWeight: '600' } }, 'Supabase Connection'),
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
          React.createElement('span', {
            style: {
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: supabaseStatus === 'Connected' ? 'var(--green)' : 'var(--red)'
            }
          }),
          React.createElement('span', {
            style: {
              color: supabaseStatus === 'Connected' ? 'var(--green)' : 'var(--red)',
              fontWeight: '600'
            }
          }, supabaseStatus)
        )
      )
    ),

    // Danger Zone
    React.createElement('div', {
      style: {
        background: 'var(--red)',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        border: '1px solid rgba(255,0,0,0.3)',
        borderRadius: '8px',
        padding: '20px'
      }
    },
      React.createElement('h2', { style: { margin: '0 0 15px 0', color: 'white' } }, '⚠️ Danger Zone'),
      React.createElement('p', { style: { color: 'rgba(255,255,255,0.9)', marginTop: 0, marginBottom: '15px', fontSize: '14px' } }, 'These actions cannot be undone'),
      React.createElement('button', {
        onClick: handleClearFlaggedPosts,
        disabled: clearing,
        style: {
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px'
        }
      }, clearing ? 'Clearing...' : 'Clear All Flagged Posts')
    )
  );
}
