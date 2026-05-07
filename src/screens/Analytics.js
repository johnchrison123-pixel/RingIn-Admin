import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

export default function Analytics({ adminRole, session }) {
  var statsS = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalExperts: 0
  });
  var stats = statsS[0];
  var setStats = statsS[1];

  var growthS = useState([]);
  var growth = growthS[0];
  var setGrowth = growthS[1];

  var topExpertsS = useState([]);
  var topExperts = topExpertsS[0];
  var setTopExperts = topExpertsS[1];

  var hoursS = useState([]);
  var hours = hoursS[0];
  var setHours = hoursS[1];

  var loadingS = useState(true);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Count stats
        var [usersRes, postsRes, messagesRes, expertsRes] = await Promise.all([
          sb.from('profiles').select('*', { count: 'exact', head: true }),
          sb.from('posts').select('*', { count: 'exact', head: true }),
          sb.from('messages').select('*', { count: 'exact', head: true }),
          sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_expert', true)
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalPosts: postsRes.count || 0,
          totalMessages: messagesRes.count || 0,
          totalExperts: expertsRes.count || 0
        });

        // Growth: users joined per day last 7 days
        var now = new Date();
        var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        var { data: recentUsers } = await sb
          .from('profiles')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        // Group by date
        var growthMap = {};
        for (var i = 0; i < 7; i++) {
          var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          var dateStr = d.toISOString().split('T')[0];
          growthMap[dateStr] = 0;
        }

        if (recentUsers) {
          recentUsers.forEach(u => {
            var dateStr = new Date(u.created_at).toISOString().split('T')[0];
            if (growthMap.hasOwnProperty(dateStr)) {
              growthMap[dateStr]++;
            }
          });
        }

        var growthData = Object.entries(growthMap)
          .reverse()
          .map(([date, count]) => ({ date: date.split('-')[2], count }));
        setGrowth(growthData);

        // Top experts
        var { data: experts } = await sb
          .from('profiles')
          .select('*')
          .eq('is_expert', true)
          .order('calls', { ascending: false })
          .limit(5);
        setTopExperts(experts || []);

        // Mock active hours data
        var mockHours = [
          { hour: '00:00', activity: 5 },
          { hour: '04:00', activity: 3 },
          { hour: '08:00', activity: 15 },
          { hour: '12:00', activity: 28 },
          { hour: '16:00', activity: 32 },
          { hour: '20:00', activity: 25 }
        ];
        setHours(mockHours);

      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  var StatCard = function(props) {
    return React.createElement('div', {
      style: {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }
    },
      React.createElement('p', { style: { color: 'var(--t3)', margin: '0 0 10px 0', fontSize: '14px' } }, props.label),
      React.createElement('p', {
        style: {
          margin: 0,
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--ac)'
        }
      }, props.value),
      props.subtext && React.createElement('p', { style: { color: 'var(--t3)', margin: '5px 0 0 0', fontSize: '12px' } }, props.subtext)
    );
  };

  var BarChart = function(props) {
    var max = Math.max(...props.data.map(d => d.count), 1);
    return React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '12px'
      }
    },
      props.data.map((item, idx) =>
        React.createElement('div', {
          key: idx,
          style: { textAlign: 'center' }
        },
          React.createElement('div', {
            style: {
              background: 'var(--ac)',
              height: (item.count / max) * 150 + 'px',
              borderRadius: '4px 4px 0 0',
              marginBottom: '8px',
              minHeight: '20px'
            }
          }),
          React.createElement('p', {
            style: {
              margin: 0,
              fontSize: '12px',
              color: 'var(--t3)'
            }
          }, item.label || item.hour),
          React.createElement('p', {
            style: {
              margin: '4px 0 0 0',
              fontSize: '11px',
              color: 'var(--t2)',
              fontWeight: '600'
            }
          }, item.count)
        )
      )
    );
  };

  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'var(--bg)',
      minHeight: '100vh',
      color: 'var(--text)'
    }
  },
    React.createElement('h1', null, 'Analytics Dashboard'),

    loading ? React.createElement('p', null, 'Loading analytics...') : React.createElement('div', null,
      // Stat Cards
      React.createElement('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }
      },
        React.createElement(StatCard, {
          label: 'Total Users',
          value: stats.totalUsers.toLocaleString()
        }),
        React.createElement(StatCard, {
          label: 'Total Posts',
          value: stats.totalPosts.toLocaleString()
        }),
        React.createElement(StatCard, {
          label: 'Total Messages',
          value: stats.totalMessages.toLocaleString()
        }),
        React.createElement(StatCard, {
          label: 'Expert Profiles',
          value: stats.totalExperts
        })
      ),

      // Growth Section
      React.createElement('div', {
        style: {
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }
      },
        React.createElement('h2', { style: { margin: '0 0 20px 0' } }, 'Users Joined (Last 7 Days)'),
        React.createElement(BarChart, { data: growth })
      ),

      // Top Experts
      React.createElement('div', {
        style: {
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }
      },
        React.createElement('h2', { style: { margin: '0 0 15px 0' } }, 'Top Experts by Calls'),
        topExperts.length === 0 ? React.createElement('p', { style: { color: 'var(--t3)' } }, 'No experts yet') :
          React.createElement('div', {
            style: { display: 'grid', gap: '10px' }
          },
            topExperts.map((expert, idx) =>
              React.createElement('div', {
                key: expert.id,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  background: 'var(--bg3)',
                  borderRadius: '6px'
                }
              },
                React.createElement('span', {
                  style: {
                    marginRight: '12px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--ac)',
                    minWidth: '30px'
                  }
                }, '#' + (idx + 1)),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('p', { style: { margin: '0 0 2px 0', fontWeight: '600' } }, expert.display_name || 'Unknown'),
                  React.createElement('p', { style: { margin: 0, fontSize: '12px', color: 'var(--t3)' } }, expert.expertise || 'No specialty')
                ),
                React.createElement('div', { style: { textAlign: 'right' } },
                  React.createElement('p', { style: { margin: '0 0 2px 0', fontWeight: '700', color: 'var(--ac)' } }, expert.calls || '0'),
                  React.createElement('p', { style: { margin: 0, fontSize: '11px', color: 'var(--t3)' } }, 'calls')
                )
              )
            )
          )
      ),

      // Most Active Hours
      React.createElement('div', {
        style: {
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px'
        }
      },
        React.createElement('h2', { style: { margin: '0 0 20px 0' } }, 'Most Active Hours'),
        React.createElement(BarChart, { data: hours.map(h => ({ ...h, label: h.hour })) })
      )
    )
  );
}
