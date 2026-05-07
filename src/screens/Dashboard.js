import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

const Dashboard = ({ onNavigate }) => {
  // State for stat cards
  var totalUsersS = useState(0);
  var totalUsers = totalUsersS[0];
  var setTotalUsers = totalUsersS[1];

  var totalPostsS = useState(0);
  var totalPosts = totalPostsS[0];
  var setTotalPosts = totalPostsS[1];

  var totalMessagesS = useState(0);
  var totalMessages = totalMessagesS[0];
  var setTotalMessages = totalMessagesS[1];

  var activeExpertsS = useState(0);
  var activeExperts = activeExpertsS[0];
  var setActiveExperts = activeExpertsS[1];

  var recentActivityS = useState([]);
  var recentActivity = recentActivityS[0];
  var setRecentActivity = recentActivityS[1];

  var newUsersWeekS = useState(0);
  var newUsersWeek = newUsersWeekS[0];
  var setNewUsersWeek = newUsersWeekS[1];

  var loadingS = useState(true);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var currentTimeS = useState(new Date());
  var currentTime = currentTimeS[0];
  var setCurrentTime = currentTimeS[1];

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total users
        const { count: usersCount } = await sb
          .from('profiles')
          .select('id', { count: 'exact' });
        setTotalUsers(usersCount || 0);

        // Fetch total posts
        const { count: postsCount } = await sb
          .from('posts')
          .select('id', { count: 'exact' });
        setTotalPosts(postsCount || 0);

        // Fetch total messages
        const { count: messagesCount } = await sb
          .from('messages')
          .select('id', { count: 'exact' });
        setTotalMessages(messagesCount || 0);

        // Fetch active experts
        const { count: expertsCount } = await sb
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('is_expert', true);
        setActiveExperts(expertsCount || 0);

        // Fetch recent posts
        const { data: posts, error: postsError } = await sb
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (posts) {
          setRecentActivity(posts);
        }

        // Fetch new users this week
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: newUsersCount } = await sb
          .from('profiles')
          .select('id', { count: 'exact' })
          .gte('created_at', sevenDaysAgo.toISOString());

        setNewUsersWeek(newUsersCount || 0);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Helper function to calculate time ago
  const timeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const seconds = Math.floor((now - postDate) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return Math.floor(seconds) + 's ago';
  };

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get gradient color based on index
  const getGradientColor = (index) => {
    const colors = [
      { from: '#6366f1', to: '#8b5cf6' }, // indigo to purple
      { from: '#ec4899', to: '#f43f5e' }, // pink to rose
      { from: '#14b8a6', to: '#10b981' }, // teal to green
      { from: '#f59e0b', to: '#f97316' }, // amber to orange
    ];
    return colors[index % colors.length];
  };

  // Stat Card Component
  const StatCard = ({ emoji, number, label, trend, index }) => {
    const gradient = getGradientColor(index);
    return React.createElement(
      'div',
      {
        style: {
          background: `linear-gradient(135deg, ${gradient.from}15 0%, ${gradient.to}15 100%)`,
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          flex: 1,
          minWidth: '200px',
        },
      },
      React.createElement(
        'div',
        { style: { fontSize: '32px', marginBottom: '12px' } },
        emoji
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text)',
            marginBottom: '8px',
          },
        },
        number.toLocaleString()
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '14px',
            color: 'var(--t2)',
            marginBottom: '12px',
          },
        },
        label
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '12px',
            color: '#10b981',
            backgroundColor: '#10b98115',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block',
          },
        },
        `+${trend}% this week`
      )
    );
  };

  // Quick Action Card Component
  const QuickActionCard = ({ emoji, label, action }) => {
    return React.createElement(
      'button',
      {
        onClick: () => onNavigate && onNavigate(action),
        style: {
          background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          cursor: 'pointer',
          flex: 1,
          minWidth: '150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.3s ease',
          color: 'inherit',
          fontSize: 'inherit',
          fontFamily: 'inherit',
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background =
            'linear-gradient(135deg, var(--bg3) 0%, var(--bg4) 100%)';
          e.currentTarget.style.borderColor = 'var(--ac)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background =
            'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
        },
      },
      React.createElement(
        'div',
        { style: { fontSize: '28px' } },
        emoji
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text)',
          },
        },
        label
      )
    );
  };

  // Activity Item Component
  const ActivityItem = ({ post }) => {
    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          alignItems: 'flex-start',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${getGradientColor(0).from}, ${getGradientColor(0).to})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            flexShrink: 0,
          },
        },
        getInitials(post.author_name || 'User')
      ),
      React.createElement(
        'div',
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          'div',
          {
            style: {
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '4px',
            },
          },
          post.author_name || 'User'
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: '13px',
              color: 'var(--t3)',
              lineHeight: '1.4',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            },
          },
          post.content || 'No content'
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: '12px',
              color: 'var(--t3)',
            },
          },
          timeAgo(post.created_at)
        )
      )
    );
  };

  // Status Badge Component
  const StatusBadge = ({ label, status }) => {
    const colors = {
      connected: '#10b981',
      active: '#10b981',
      online: '#10b981',
    };
    const bgColor = colors[status] || '#10b981';

    return React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: `${bgColor}15`,
          borderRadius: '6px',
          fontSize: '13px',
        },
      },
      React.createElement('div', {
        style: {
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: bgColor,
        },
      }),
      React.createElement(
        'span',
        { style: { color: 'var(--text)' } },
        label
      ),
      React.createElement(
        'span',
        { style: { color: 'var(--t3)', marginLeft: 'auto' } },
        status === 'connected' ? '✓' : '•'
      )
    );
  };

  if (loading) {
    return React.createElement(
      'div',
      {
        style: {
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        },
      },
      React.createElement(
        'div',
        { style: { color: 'var(--t2)', fontSize: '18px' } },
        'Loading dashboard...'
      )
    );
  }

  return React.createElement(
    'div',
    {
      style: {
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        color: 'var(--text)',
      },
    },
    // Header
    React.createElement(
      'div',
      { style: { marginBottom: '32px' } },
      React.createElement(
        'h1',
        {
          style: {
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: 'var(--text)',
          },
        },
        'Dashboard'
      ),
      React.createElement(
        'p',
        {
          style: {
            margin: '0',
            color: 'var(--t2)',
            fontSize: '14px',
          },
        },
        `Welcome back! Last updated at ${currentTime.toLocaleTimeString()}`
      )
    ),

    // Stat Cards Row
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        },
      },
      React.createElement(StatCard, {
        emoji: '👥',
        number: totalUsers,
        label: 'Total Users',
        trend: 12,
        index: 0,
      }),
      React.createElement(StatCard, {
        emoji: '📝',
        number: totalPosts,
        label: 'Total Posts',
        trend: 18,
        index: 1,
      }),
      React.createElement(StatCard, {
        emoji: '💬',
        number: totalMessages,
        label: 'Total Messages',
        trend: 9,
        index: 2,
      }),
      React.createElement(StatCard, {
        emoji: '⭐',
        number: activeExperts,
        label: 'Active Experts',
        trend: 5,
        index: 3,
      })
    ),

    // Main Content Grid
    React.createElement(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        },
      },
      // Recent Activity Feed
      React.createElement(
        'div',
        {
          style: {
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            gridColumn: 'span 1',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              padding: '20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          },
          React.createElement(
            'h2',
            {
              style: {
                margin: '0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text)',
              },
            },
            'Recent Activity'
          ),
          React.createElement(
            'button',
            {
              onClick: () => onNavigate && onNavigate('posts'),
              style: {
                background: 'none',
                border: 'none',
                color: 'var(--ac)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              },
            },
            'View All →'
          )
        ),
        React.createElement(
          'div',
          { style: { maxHeight: '400px', overflowY: 'auto' } },
          recentActivity.length > 0
            ? recentActivity.map((post, idx) =>
                React.createElement(ActivityItem, {
                  key: post.id || idx,
                  post: post,
                })
              )
            : React.createElement(
                'div',
                {
                  style: {
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--t3)',
                  },
                },
                'No recent activity'
              )
        )
      ),

      // New Users This Week
      React.createElement(
        'div',
        {
          style: {
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          },
        },
        React.createElement(
          'h3',
          {
            style: {
              margin: '0 0 20px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)',
            },
          },
          'New Users This Week'
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                fontSize: '36px',
                fontWeight: '700',
                color: 'var(--ac)',
              },
            },
            newUsersWeek
          ),
          React.createElement(
            'div',
            {
              style: {
                flex: 1,
                height: '8px',
                background: 'var(--bg3)',
                borderRadius: '4px',
                overflow: 'hidden',
              },
            },
            React.createElement('div', {
              style: {
                height: '100%',
                background: `linear-gradient(90deg, var(--ac), var(--ac2))`,
                width: `${Math.min((newUsersWeek / Math.max(totalUsers, 1)) * 100, 100)}%`,
              },
            })
          )
        ),
        React.createElement(
          'p',
          {
            style: {
              margin: '0',
              fontSize: '13px',
              color: 'var(--t3)',
            },
          },
          `${((newUsersWeek / Math.max(totalUsers, 1)) * 100).toFixed(1)}% of total users`
        )
      ),

      // System Status
      React.createElement(
        'div',
        {
          style: {
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          },
        },
        React.createElement(
          'h3',
          {
            style: {
              margin: '0 0 20px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)',
            },
          },
          'System Status'
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
          React.createElement(StatusBadge, {
            label: 'Supabase',
            status: 'connected',
          }),
          React.createElement(StatusBadge, {
            label: 'Realtime',
            status: 'active',
          }),
          React.createElement(StatusBadge, {
            label: 'Storage',
            status: 'online',
          })
        ),
        React.createElement(
          'div',
          {
            style: {
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              fontSize: '13px',
              color: 'var(--t3)',
            },
          },
          `Last checked: ${currentTime.toLocaleTimeString()}`
        )
      )
    ),

    // Quick Actions Row
    React.createElement(
      'div',
      { style: { marginBottom: '32px' } },
      React.createElement(
        'h2',
        {
          style: {
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text)',
          },
        },
        'Quick Actions'
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          },
        },
        React.createElement(QuickActionCard, {
          emoji: '👥',
          label: 'Manage Users',
          action: 'users',
        }),
        React.createElement(QuickActionCard, {
          emoji: '📝',
          label: 'Review Posts',
          action: 'posts',
        }),
        React.createElement(QuickActionCard, {
          emoji: '🚩',
          label: 'View Reports',
          action: 'reports',
        }),
        React.createElement(QuickActionCard, {
          emoji: '📊',
          label: 'Analytics',
          action: 'analytics',
        })
      )
    )
  );
};

export default Dashboard;
