import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Posts({ adminRole, session }) {
  var postsS = useState([]);
  var posts = postsS[0];
  var setPosts = postsS[1];

  var filteredS = useState([]);
  var filtered = filteredS[0];
  var setFiltered = filteredS[1];

  var searchS = useState('');
  var search = searchS[0];
  var setSearch = searchS[1];

  var filterS = useState('all'); // all, flagged, recent
  var filter = filterS[0];
  var setFilter = filterS[1];

  var pageS = useState(1);
  var page = pageS[0];
  var setPage = pageS[1];

  var expandedS = useState(null);
  var expanded = expandedS[0];
  var setExpanded = expandedS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var deletingS = useState(null);
  var deleting = deletingS[0];
  var setDeleting = deletingS[1];

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        var query = sb.from('posts').select('*').order('created_at', { ascending: false });
        var { data, error } = await query;
        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Filter and search
  useEffect(() => {
    var result = posts;

    // Apply filter
    if (filter === 'flagged') {
      result = result.filter(p => p.flagged);
    } else if (filter === 'recent') {
      result = result.slice(0, 20);
    }

    // Apply search
    if (search.trim()) {
      var q = search.toLowerCase();
      result = result.filter(p =>
        (p.content && p.content.toLowerCase().includes(q))
      );
    }

    setFiltered(result);
    setPage(1);
  }, [posts, search, filter]);

  // Pagination
  var itemsPerPage = 20;
  var totalPages = Math.ceil(filtered.length / itemsPerPage);
  var start = (page - 1) * itemsPerPage;
  var paginatedPosts = filtered.slice(start, start + itemsPerPage);

  var handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(postId);
    try {
      var { error } = await sb.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
    setDeleting(null);
  };

  var handleFlag = async (postId) => {
    try {
      var { error } = await sb.from('posts').update({ flagged: true }).eq('id', postId);
      if (error) throw error;
      setPosts(posts.map(p => p.id === postId ? { ...p, flagged: true } : p));
    } catch (err) {
      console.error('Error flagging post:', err);
    }
  };

  var getUserInitials = (displayName) => {
    if (!displayName) return 'U';
    return displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  var formatDate = (date) => {
    var d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'var(--bg)',
      minHeight: '100vh',
      color: 'var(--text)'
    }
  },
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('h1', null, 'Posts Moderation'),
      React.createElement('p', { style: { color: 'var(--t3)' } }, `Total posts: ${filtered.length}`)
    ),

    // Search
    React.createElement('div', { style: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' } },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search posts...',
        value: search,
        onChange: (e) => setSearch(e.target.value),
        style: {
          padding: '8px 12px',
          background: 'var(--bg2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          flex: 1,
          minWidth: '200px'
        }
      }),
      React.createElement('div', { style: { display: 'flex', gap: '8px' } },
        ['all', 'flagged', 'recent'].map(f =>
          React.createElement('button', {
            key: f,
            onClick: () => setFilter(f),
            style: {
              padding: '8px 16px',
              background: filter === f ? 'var(--ac)' : 'var(--bg2)',
              color: filter === f ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }
          }, f)
        )
      )
    ),

    // Posts Grid
    loading ? React.createElement('p', null, 'Loading posts...') :
      paginatedPosts.length === 0 ? React.createElement('p', { style: { color: 'var(--t3)' } }, 'No posts found') :
        React.createElement('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }
        },
          paginatedPosts.map(post =>
            React.createElement('div', {
              key: post.id,
              style: {
                background: 'var(--bg2)',
                border: post.flagged ? '2px solid var(--red)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '15px',
                position: 'relative'
              }
            },
              // Header with avatar
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
                      fontWeight: '600',
                      color: 'var(--text)'
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

              // Content
              React.createElement('div', {
                style: {
                  background: 'var(--bg3)',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '10px'
                }
              },
                expanded === post.id ?
                  React.createElement('p', { style: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, post.content) :
                  React.createElement('p', { style: { margin: 0, color: 'var(--t2)' } },
                    (post.content && post.content.length > 120) ?
                      post.content.substring(0, 120) + '...' :
                      post.content || 'No content'
                  ),
                post.content && post.content.length > 120 &&
                  React.createElement('button', {
                    onClick: () => setExpanded(expanded === post.id ? null : post.id),
                    style: {
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--ac)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textDecoration: 'underline'
                    }
                  }, expanded === post.id ? 'Show less' : 'Show more')
              ),

              // Stats
              React.createElement('div', {
                style: {
                  display: 'flex',
                  gap: '15px',
                  fontSize: '12px',
                  color: 'var(--t3)',
                  marginBottom: '10px'
                }
              },
                React.createElement('span', null, '❤️ ' + (post.likes_count || 0)),
                React.createElement('span', null, '💬 ' + (post.comments_count || 0))
              ),

              // Actions
              React.createElement('div', {
                style: {
                  display: 'flex',
                  gap: '8px'
                }
              },
                React.createElement('button', {
                  onClick: () => setExpanded(expanded === post.id ? null : post.id),
                  style: {
                    flex: 1,
                    padding: '6px 8px',
                    background: 'var(--blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }
                }, '👁 View'),
                React.createElement('button', {
                  onClick: () => handleFlag(post.id),
                  disabled: post.flagged,
                  style: {
                    flex: 1,
                    padding: '6px 8px',
                    background: post.flagged ? 'var(--border)' : 'var(--amber)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: post.flagged ? 'default' : 'pointer',
                    fontSize: '12px',
                    opacity: post.flagged ? 0.6 : 1
                  }
                }, '🚩 ' + (post.flagged ? 'Flagged' : 'Flag')),
                React.createElement('button', {
                  onClick: () => handleDelete(post.id),
                  disabled: deleting === post.id,
                  style: {
                    flex: 1,
                    padding: '6px 8px',
                    background: 'var(--red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: deleting === post.id ? 0.6 : 1
                  }
                }, deleting === post.id ? 'Deleting...' : '🗑 Delete')
              )
            )
          )
        ),

    // Pagination
    totalPages > 1 && React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '20px'
      }
    },
      page > 1 && React.createElement('button', {
        onClick: () => setPage(page - 1),
        style: {
          padding: '8px 12px',
          background: 'var(--bg2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, '← Prev'),
      React.createElement('span', { style: { padding: '8px 12px', color: 'var(--t3)' } },
        `Page ${page} of ${totalPages}`
      ),
      page < totalPages && React.createElement('button', {
        onClick: () => setPage(page + 1),
        style: {
          padding: '8px 12px',
          background: 'var(--bg2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, 'Next →')
    )
  );
}
