import React, { useState } from 'react';
import { sb } from '../supabase';

export default function LoginScreen({ onLogin }) {
  var emailS = useState('');
  var email = emailS[0];
  var setEmail = emailS[1];

  var passwordS = useState('');
  var password = passwordS[0];
  var setPassword = passwordS[1];

  var loadingS = useState(false);
  var loading = loadingS[0];
  var setLoading = loadingS[1];

  var errorS = useState('');
  var error = errorS[0];
  var setError = errorS[1];

  var handleLogin = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      var { data, error: loginError } = await sb.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (loginError) throw loginError;
      if (data.session) {
        onLogin(data.session);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return React.createElement('div', {
    style: {
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif'
    }
  },
    React.createElement('div', {
      style: {
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        background: 'var(--bg2)',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }
    },
      React.createElement('div', {
        style: {
          marginBottom: '32px',
          textAlign: 'center'
        }
      },
        React.createElement('div', {
          style: {
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, var(--ac) 0%, var(--ac2) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }
        }, 'RingIn'),
        React.createElement('p', {
          style: {
            color: 'var(--t2)',
            margin: 0,
            fontSize: '14px'
          }
        }, 'Admin Panel')
      ),

      React.createElement('form', {
        onSubmit: handleLogin,
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }
      },
        error && React.createElement('div', {
          style: {
            padding: '12px',
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid var(--red)',
            borderRadius: '6px',
            color: 'var(--red)',
            fontSize: '13px'
          }
        }, error),

        React.createElement('div', null,
          React.createElement('label', {
            style: {
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: '500'
            }
          }, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: function(e) { setEmail(e.target.value); },
            placeholder: 'your@email.com',
            style: {
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }
          })
        ),

        React.createElement('div', null,
          React.createElement('label', {
            style: {
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: '500'
            }
          }, 'Password'),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: function(e) { setPassword(e.target.value); },
            placeholder: 'Enter password',
            style: {
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }
          })
        ),

        React.createElement('button', {
          type: 'submit',
          disabled: loading,
          style: {
            padding: '10px 16px',
            background: 'linear-gradient(135deg, var(--ac) 0%, var(--ac2) 100%)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s'
          }
        }, loading ? 'Signing in...' : 'Sign In')
      ),

      React.createElement('p', {
        style: {
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--t3)',
          fontSize: '12px'
        }
      }, 'Admin access only')
    )
  );
}
