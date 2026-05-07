import React, { useState, useEffect } from 'react';
import { sb } from '../supabase';

const Users = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Banned, Experts
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !user.banned) ||
      (filterStatus === 'Banned' && user.banned) ||
      (filterStatus === 'Experts' && user.is_expert);

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Fetch user details for modal
  const fetchUserDetails = async (userId) => {
    try {
      setDetailLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', userId).single(),
        sb
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (profileRes.error) throw profileRes.error;

      setUserDetails({
        profile: profileRes.data,
        posts: postsRes.data || [],
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open user detail modal
  const openUserDetail = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  // Close modal
  const closeModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  // Ban/Unban user
  const toggleBan = async (userId, currentBanStatus) => {
    try {
      const optimisticUsers = users.map((u) =>
        u.id === userId ? { ...u, banned: !currentBanStatus } : u
      );
      setUsers(optimisticUsers);

      const { error } = await sb
        .from('profiles')
        .update({ banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update modal if user is selected
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, banned: !currentBanStatus });
        if (userDetails) {
          setUserDetails({
            ...userDetails,
            profile: { ...userDetails.profile, banned: !currentBanStatus },
          });
        }
      }
    } catch (err) {
      console.error('Error toggling ban status:', err);
      // Revert optimistic update on error
      fetchUsersOnError();
    }
  };

  // Verify expert
  const verifyExpert = async (userId) => {
    try {
      const optimisticUsers = users.map((u) =>
        u.id === userId ? { ...u, is_expert: true } : u
      );
      setUsers(optimisticUsers);

      const { error } = await sb
        .from('profiles')
        .update({ is_expert: true })
        .eq('id', userId);

      if (error) throw error;

      // Update modal if user is selected
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_expert: true });
        if (userDetails) {
          setUserDetails({
            ...userDetails,
            profile: { ...userDetails.profile, is_expert: true },
          });
        }
      }
    } catch (err) {
      console.error('Error verifying expert:', err);
      fetchUsersOnError();
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const optimisticUsers = users.filter((u) => u.id !== userId);
      setUsers(optimisticUsers);
      if (selectedUser?.id === userId) {
        closeModal();
      }

      const { error } = await sb.from('profiles').delete().eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting user:', err);
      fetchUsersOnError();
    }
  };

  // Refetch users on error for optimistic updates
  const fetchUsersOnError = async () => {
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error refetching users:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // JSX using React.createElement
  return React.createElement(
    'div',
    { style: styles.container },
    // Header
    React.createElement(
      'div',
      { style: styles.header },
      React.createElement('h1', { style: styles.title }, 'User Management'),
      React.createElement(
        'div',
        { style: styles.headerControls },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search by name or email...',
          value: searchTerm,
          onChange: (e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          },
          style: styles.searchInput,
        }),
        React.createElement(
          'select',
          {
            value: filterStatus,
            onChange: (e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            },
            style: styles.filterSelect,
          },
          React.createElement('option', null, 'All'),
          React.createElement('option', null, 'Active'),
          React.createElement('option', null, 'Banned'),
          React.createElement('option', null, 'Experts')
        ),
        React.createElement(
          'div',
          { style: styles.countBadge },
          filteredUsers.length,
          ' user',
          filteredUsers.length !== 1 ? 's' : ''
        )
      )
    ),

    // Loading state
    loading
      ? React.createElement(
          'div',
          { style: styles.loadingContainer },
          React.createElement('p', { style: styles.loadingText }, 'Loading users...')
        )
      : null,

    // Error state
    error
      ? React.createElement(
          'div',
          { style: styles.errorContainer },
          React.createElement('p', { style: styles.errorText }, 'Error: ', error)
        )
      : null,

    // Users table
    !loading && !error
      ? React.createElement(
          'div',
          { style: styles.tableWrapper },
          React.createElement(
            'table',
            { style: styles.table },
            React.createElement(
              'thead',
              null,
              React.createElement(
                'tr',
                null,
                React.createElement('th', { style: styles.th }, 'Avatar'),
                React.createElement('th', { style: styles.th }, 'Name'),
                React.createElement('th', { style: styles.th }, 'Role'),
                React.createElement('th', { style: styles.th }, 'Status'),
                React.createElement('th', { style: styles.th }, 'Joined'),
                React.createElement('th', { style: styles.th }, 'Posts'),
                React.createElement('th', { style: styles.th }, 'Actions')
              )
            ),
            React.createElement(
              'tbody',
              null,
              paginatedUsers.map((user) =>
                React.createElement(
                  'tr',
                  { key: user.id, style: styles.tr },
                  React.createElement(
                    'td',
                    { style: styles.td },
                    React.createElement(
                      'div',
                      { style: styles.avatar },
                      user.avatar_url
                        ? React.createElement('img', {
                            src: user.avatar_url,
                            alt: user.full_name,
                            style: styles.avatarImg,
                          })
                        : React.createElement(
                            'div',
                            { style: styles.avatarInitials },
                            getInitials(user.full_name)
                          )
                    )
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    React.createElement(
                      'div',
                      null,
                      React.createElement('div', { style: styles.userName }, user.full_name || 'Unknown'),
                      React.createElement('div', { style: styles.userEmail }, user.email || 'No email')
                    )
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    user.is_expert
                      ? React.createElement('span', { style: styles.badgeExpert }, 'Expert')
                      : React.createElement('span', { style: styles.badgeUser }, 'User')
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    React.createElement(
                      'div',
                      { style: styles.statusContainer },
                      user.banned
                        ? React.createElement(
                            'span',
                            { style: styles.statusBanned },
                            '🔴 Banned'
                          )
                        : React.createElement(
                            'span',
                            { style: styles.statusActive },
                            '🟢 Active'
                          )
                    )
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    formatDate(user.created_at)
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    user.posts_count || 0
                  ),
                  React.createElement(
                    'td',
                    { style: styles.td },
                    React.createElement(
                      'div',
                      { style: styles.actions },
                      React.createElement(
                        'button',
                        {
                          onClick: () => openUserDetail(user),
                          style: styles.btnView,
                        },
                        'View'
                      ),
                      React.createElement(
                        'button',
                        {
                          onClick: () => toggleBan(user.id, user.banned),
                          style: user.banned ? styles.btnUnban : styles.btnBan,
                        },
                        user.banned ? 'Unban' : 'Ban'
                      ),
                      !user.is_expert
                        ? React.createElement(
                            'button',
                            {
                              onClick: () => verifyExpert(user.id),
                              style: styles.btnVerify,
                            },
                            'Verify'
                          )
                        : null,
                      React.createElement(
                        'button',
                        {
                          onClick: () => deleteUser(user.id),
                          style: styles.btnDelete,
                        },
                        'Delete'
                      )
                    )
                  )
                )
              )
            )
          ),
          paginatedUsers.length === 0
            ? React.createElement(
                'div',
                { style: styles.emptyState },
                React.createElement('p', { style: styles.emptyText }, 'No users found')
              )
            : null
        )
      : null,

    // Pagination
    !loading && filteredUsers.length > 0
      ? React.createElement(
          'div',
          { style: styles.pagination },
          React.createElement(
            'button',
            {
              onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
              disabled: currentPage === 1,
              style: currentPage === 1 ? styles.btnPageDisabled : styles.btnPage,
            },
            'Previous'
          ),
          React.createElement(
            'span',
            { style: styles.pageIndicator },
            'Page ',
            currentPage,
            ' of ',
            totalPages
          ),
          React.createElement(
            'button',
            {
              onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)),
              disabled: currentPage === totalPages,
              style: currentPage === totalPages ? styles.btnPageDisabled : styles.btnPage,
            },
            'Next'
          )
        )
      : null,

    // User Detail Modal
    selectedUser
      ? React.createElement(
          'div',
          { style: styles.modalOverlay, onClick: closeModal },
          React.createElement(
            'div',
            { style: styles.modalContent, onClick: (e) => e.stopPropagation() },
            React.createElement(
              'button',
              { onClick: closeModal, style: styles.modalClose },
              '✕'
            ),
            detailLoading
              ? React.createElement(
                  'div',
                  { style: styles.detailLoading },
                  React.createElement('p', null, 'Loading user details...')
                )
              : userDetails
              ? React.createElement(
                  'div',
                  { style: styles.detailContent },
                  React.createElement(
                    'div',
                    { style: styles.detailHeader },
                    React.createElement(
                      'div',
                      { style: styles.detailAvatar },
                      userDetails.profile.avatar_url
                        ? React.createElement('img', {
                            src: userDetails.profile.avatar_url,
                            alt: userDetails.profile.full_name,
                            style: styles.detailAvatarImg,
                          })
                        : React.createElement(
                            'div',
                            { style: styles.detailAvatarInitials },
                            getInitials(userDetails.profile.full_name)
                          )
                    ),
                    React.createElement(
                      'div',
                      { style: styles.detailHeaderInfo },
                      React.createElement('h2', { style: styles.detailName }, userDetails.profile.full_name),
                      React.createElement('p', { style: styles.detailEmail }, userDetails.profile.email),
                      React.createElement(
                        'div',
                        { style: styles.detailRoles },
                        userDetails.profile.is_expert
                          ? React.createElement('span', { style: styles.badgeExpert }, 'Expert')
                          : null,
                        userDetails.profile.banned
                          ? React.createElement('span', { style: styles.badgeBanned }, 'Banned')
                          : null
                      )
                    )
                  ),
                  React.createElement(
                    'div',
                    { style: styles.detailBio },
                    React.createElement('h3', null, 'Bio'),
                    React.createElement('p', null, userDetails.profile.bio || 'No bio provided')
                  ),
                  React.createElement(
                    'div',
                    { style: styles.detailStats },
                    React.createElement(
                      'div',
                      { style: styles.detailStat },
                      React.createElement('span', { style: styles.statLabel }, 'Posts'),
                      React.createElement('span', { style: styles.statValue }, userDetails.posts.length)
                    ),
                    React.createElement(
                      'div',
                      { style: styles.detailStat },
                      React.createElement('span', { style: styles.statLabel }, 'Followers'),
                      React.createElement('span', { style: styles.statValue }, userDetails.profile.followers_count || 0)
                    ),
                    React.createElement(
                      'div',
                      { style: styles.detailStat },
                      React.createElement('span', { style: styles.statLabel }, 'Following'),
                      React.createElement('span', { style: styles.statValue }, userDetails.profile.following_count || 0)
                    )
                  ),
                  userDetails.posts.length > 0
                    ? React.createElement(
                        'div',
                        { style: styles.detailPosts },
                        React.createElement('h3', null, 'Recent Posts'),
                        React.createElement(
                          'div',
                          { style: styles.postsList },
                          userDetails.posts.map((post) =>
                            React.createElement(
                              'div',
                              { key: post.id, style: styles.postItem },
                              React.createElement('p', { style: styles.postTitle }, post.content || 'Untitled'),
                              React.createElement(
                                'p',
                                { style: styles.postDate },
                                formatDate(post.created_at)
                              )
                            )
                          )
                        )
                      )
                    : React.createElement(
                        'div',
                        { style: styles.detailPosts },
                        React.createElement('p', { style: styles.noPostsText }, 'No posts yet')
                      ),
                  React.createElement(
                    'div',
                    { style: styles.detailActions },
                    React.createElement(
                      'button',
                      {
                        onClick: () => toggleBan(selectedUser.id, selectedUser.banned),
                        style: selectedUser.banned ? styles.btnModalUnban : styles.btnModalBan,
                      },
                      selectedUser.banned ? 'Unban User' : 'Ban User'
                    )
                  )
                )
              : null
          )
        )
      : null
  );
};

// Styles object
const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0a0e27',
    minHeight: '100vh',
    color: '#e4e4e7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: '20px',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 14px',
    backgroundColor: '#18182b',
    border: '1px solid #27272e',
    borderRadius: '8px',
    color: '#e4e4e7',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  filterSelect: {
    padding: '10px 12px',
    backgroundColor: '#18182b',
    border: '1px solid #27272e',
    borderRadius: '8px',
    color: '#e4e4e7',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  countBadge: {
    padding: '8px 12px',
    backgroundColor: '#27272e',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#a1a1a6',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  loadingText: {
    color: '#a1a1a6',
    fontSize: '16px',
  },
  errorContainer: {
    padding: '16px',
    backgroundColor: '#7f1d1d',
    border: '1px solid #dc2626',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  errorText: {
    color: '#fecaca',
    fontSize: '14px',
    margin: 0,
  },
  tableWrapper: {
    backgroundColor: '#18182b',
    borderRadius: '12px',
    border: '1px solid #27272e',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '14px',
    textAlign: 'left',
    backgroundColor: '#0f0f23',
    color: '#a1a1a6',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #27272e',
  },
  tr: {
    borderBottom: '1px solid #27272e',
    transition: 'backgroundColor 0.2s',
    ':hover': {
      backgroundColor: '#27272e',
    },
  },
  td: {
    padding: '14px',
    color: '#e4e4e7',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#27272e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarInitials: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#a1a1a6',
    backgroundColor: '#27272e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontWeight: '500',
    color: '#fafafa',
  },
  userEmail: {
    fontSize: '12px',
    color: '#a1a1a6',
    marginTop: '2px',
  },
  badgeExpert: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#6d28d9',
    color: '#f3e8ff',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeUser: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#3f3f46',
    color: '#e4e4e7',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  badgeBanned: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '4px',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  statusActive: {
    fontSize: '13px',
    color: '#86efac',
  },
  statusBanned: {
    fontSize: '13px',
    color: '#fca5a5',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  btnView: {
    padding: '6px 10px',
    backgroundColor: '#1e40af',
    color: '#e0e7ff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnBan: {
    padding: '6px 10px',
    backgroundColor: '#dc2626',
    color: '#fee2e2',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnUnban: {
    padding: '6px 10px',
    backgroundColor: '#059669',
    color: '#d1fae5',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnVerify: {
    padding: '6px 10px',
    backgroundColor: '#7c3aed',
    color: '#ede9fe',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnDelete: {
    padding: '6px 10px',
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1px solid #dc2626',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#a1a1a6',
    fontSize: '14px',
    margin: 0,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  btnPage: {
    padding: '8px 16px',
    backgroundColor: '#1e40af',
    color: '#e0e7ff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnPageDisabled: {
    padding: '8px 16px',
    backgroundColor: '#3f3f46',
    color: '#71717a',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  pageIndicator: {
    color: '#a1a1a6',
    fontSize: '14px',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#18182b',
    borderRadius: '12px',
    border: '1px solid #27272e',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px',
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#a1a1a6',
    fontSize: '24px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  detailLoading: {
    textAlign: 'center',
    padding: '40px 0',
  },
  detailContent: {
    color: '#e4e4e7',
  },
  detailHeader: {
    display: 'flex',
    gap: '20px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #27272e',
  },
  detailAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#27272e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  detailAvatarInitials: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#a1a1a6',
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fafafa',
    margin: '0 0 4px 0',
  },
  detailEmail: {
    fontSize: '14px',
    color: '#a1a1a6',
    margin: '0 0 12px 0',
  },
  detailRoles: {
    display: 'flex',
    gap: '8px',
  },
  detailBio: {
    marginBottom: '24px',
  },
  detailStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#0f0f23',
    borderRadius: '8px',
  },
  detailStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#a1a1a6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fafafa',
    marginTop: '4px',
  },
  detailPosts: {
    marginBottom: '24px',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  postItem: {
    padding: '12px',
    backgroundColor: '#0f0f23',
    borderRadius: '6px',
    borderLeft: '3px solid #1e40af',
  },
  postTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#e4e4e7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  postDate: {
    margin: 0,
    fontSize: '12px',
    color: '#a1a1a6',
  },
  noPostsText: {
    color: '#a1a1a6',
    fontSize: '14px',
    fontStyle: 'italic',
    margin: 0,
  },
  detailActions: {
    display: 'flex',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #27272e',
  },
  btnModalBan: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#dc2626',
    color: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnModalUnban: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#059669',
    color: '#d1fae5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default Users;
