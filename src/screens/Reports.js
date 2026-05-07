import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Reports({ adminRole, session }) {
  var flaggedPostsS = useState([]);
  var flaggedPosts = flaggedPostsS[0];
  var setFlaggedPosts = flaggedPostsS[1];

  var tabS = useState('posts'); // posts, users, messages
  var tab = tabS[0];
  var setTab = tabS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var processingS = useState(null);
  var processing = processingS[0];
  var setProcessing = processingS[1];

  // Fetch flagged posts
  useEffect(() => {
    const fetchFlaggedPosts = async () => {
      setLoading(true);
      try {
        var { data, error } = await sb
          .from('posts')
          .select('*')
          .eq('flagged', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setFlaggedPosts(data || []);
      } catch (err) {
        console.error('Error fetching flagged posts:', err);
      }
      setLoading(false);
    };

    if (tab === 'posts') {
      fetchFlaggedPosts();
    }
  }, [tab]);

  var handleDismissFlag = async (postId) => {
    setProcessing(postId);
    try {
      var { error } = await sb.from('posts').update({ flagged: false }).eq('id', postId);
      if (error) throw error;
      setFlaggedPosts(flaggedPosts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error dismissing flag:', err);
    }
    setProcessing(null);
  };

  var handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    setProcessing(postId);
    try {
      var { error } = await sb.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setFlaggedPosts(flaggedPosts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
    setProcessing(null);
  };

  var handleBanUser = async (userId) => {
    if (!window.confirm('Ban this user?')) return;
    setProcessing(userId);
    try {
      var { error } = await sb.from('profiles').update({ banned: true }).eq('id', userId);
      if (error) throw error;
      setFlaggedPosts(flaggedPosts.filter(p => p.user_id !== userId));
    } catch (err) {
      console.error('Error banning user:', err);
    }
    setProcessing(null);
  };

  var formatDate = (date) => {
    var d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  var getUserInitials = (displayName) => {
    if (!displayName) return 'U';
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
    React.createElement('h1', null, 'Reports & Flags'),

    // Tab buttons
    React.createElement('div', {
      style: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '10px'
      }
    },
      ['posts', 'users', 'messages'].map(t =>
        React.createElement('button', {
          key: t,
          onClick: () => setTab(t),
          style: {
            padding: '8px 16px',
            background: tab === t ? 'var(--ac)' : 'transparent',
            color: tab === t ? 'white' : 'var(--text)',
            border: tab === t ? 'none' : '1px solid var(--border)',
            borderRadius: tab === t ? '4px' : '0',
            cursor: 'pointer',
            textTransform: 'capitalize',
            fontWeight: tab === t ? '600' : 'normal'
          }
        }, t)
      )
    ),

    // Posts Tab
    tab === 'posts' && React.createElement('div', null,
      React.createElement('p', { style: { color: 'var(--t3)', marginTop: 0 } }, `${flaggedPosts.length} flagged posts`),
      loading ? React.createElement('p', null, 'Loading...') :
        flaggedPosts.length === 0 ? React.createElement('div', {
          style: {
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg2)',
            borderRadius: '8px'
          }
        },
          React.createElement('p', { style: { fontSize: '32px', margin: '0 0 10px 0' } }, '🎉'),
          React.createElement('p', { style: { margin: 0, color: 'var(--t2)' } }, 'No active reports')
        ) :
          React.createElement('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '15px'
            }
          },
            flaggedPosts.map(post =>
              React.createElement('div', {
                key: post.id,
                style: {
                  background: 'var(--bg2)',
                  border: '2px solid var(--red)',
                  borderRadius: '8px',
                  padding: '15px'
                }
              },
                // Header
                React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '10px' } },
                  React.createElement('div', {
                    style: {
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--ac)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0
                    }
                  }, post.user_display_name ? getUserInitials(post.user_display_name) : 'U'),
                  React.createElement('div', { style: { flex: 1 } },
                    React.createElement('p', {
                      style: {
                        margin: '0 0 4px 0',
                        fontWeight: '600'
                      }
                    }, post.user_display_name || 'Unknown User'),
                    React.createElement('p', {
                      style: {
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--t3)'
                      }
                    }, formatDate(post.created_at))
                  )
                ),

                // Content preview
                React.createElement('div', {
                  style: {
                    background: 'var(--bg3)',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    maxHeight: '100px',
                    overflow: 'hidden'
                  }
                },
                  React.createElement('p', {
                    style: {
                      margin: 0,
                      color: 'var(--t2)',
                      fontSize: '13px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }
                  }, (post.content && post.content.substring(0, 150)) || 'No content')
                ),

                // Status badge
                React.createElement('div', {
                  style: {
                    marginBottom: '10px',
                    fontSize: '11px',
                    color: 'var(--red)',
                    fontWeight: '600'
                  }
                }, '🚩 Flagged'),

                // Actions
                React.createElement('div', {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }
                },
                  React.createElement('button', {
                    onClick: () => handleDismissFlag(post.id),
                    disabled: processing === post.id,
                    style: {
                      padding: '6px 8px',
                      background: 'var(--green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }
                  }, 'Dismiss'),
                  React.createElement('button', {
                    onClick: () => handleDeletePost(post.id),
                    disabled: processing === post.id,
                    style: {
                      padding: '6px 8px',
                      background: 'var(--red)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }
                  }, 'Delete'),
                  React.createElement('button', {
                    onClick: () => handleBanUser(post.user_id),
                    disabled: processing === post.user_id,
                    style: {
                      gridColumn: '1 / -1',
                      padding: '6px 8px',
                      background: 'var(--amber)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }
                  }, '⛔ Ban User')
                )
              )
            )
          )
    ),

    // Users Tab
    tab === 'users' && React.createElement('div', {
      style: {
        padding: '40px 20px',
        textAlign: 'center',
        background: 'var(--bg2)',
        borderRadius: '8px'
      }
    },
      React.createElement('p', { style: { color: 'var(--t3)' } }, 'User reports coming soon')
    ),

    // Messages Tab
    tab === 'messages' && React.createElement('div', {
      style: {
        padding: '40px 20px',
        textAlign: 'center',
        background: 'var(--bg2)',
        borderRadius: '8px'
      }
    },
      React.createElement('p', { style: { color: 'var(--t3)' } }, 'Message reports coming soon')
    )
  );
}
