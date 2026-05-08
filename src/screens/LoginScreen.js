import React, { useState, useEffect } from 'react';
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

  var attemptsS = useState(0);
  var attempts = attemptsS[0];
  var setAttempts = attemptsS[1];

  var lockedUntilS = useState(null);
  var lockedUntil = lockedUntilS[0];
  var setLockedUntil = lockedUntilS[1];

  var countdownS = useState('');
  var countdown = countdownS[0];
  var setCountdown = countdownS[1];

  // Load saved attempts on mount
  useEffect(function(){
    try{
      var saved = localStorage.getItem('ringin_admin_attempts');
      if(saved){
        var data = JSON.parse(saved);
        var now = Date.now();
        if(data.count >= 5){
          var unlockTime = data.lastAttempt + (15 * 60 * 1000);
          if(now < unlockTime){
            setAttempts(data.count);
            setLockedUntil(unlockTime);
          } else {
            // Lockout expired — reset
            localStorage.removeItem('ringin_admin_attempts');
          }
        } else {
          setAttempts(data.count);
        }
      }
    }catch(e){}
  },[]);

  // Countdown timer
  useEffect(function(){
    if(!lockedUntil) return;
    var timer = setInterval(function(){
      var remaining = lockedUntil - Date.now();
      if(remaining <= 0){
        clearInterval(timer);
        setLockedUntil(null);
        setAttempts(0);
        setCountdown('');
        localStorage.removeItem('ringin_admin_attempts');
      } else {
        var mins = Math.floor(remaining / 60000);
        var secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(mins + 'm ' + secs + 's');
      }
    }, 1000);
    return function(){ clearInterval(timer); };
  }, [lockedUntil]);

  var handleLogin = async function(e) {
    e.preventDefault();

    // Check if locked out
    if(lockedUntil){
      setError('Account locked. Try again in ' + countdown);
      return;
    }

    setLoading(true);
    setError('');
    try {
      var { data, error: loginError } = await sb.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (loginError) throw loginError;
      if (data.session) {
        // Successful login — reset attempts
        localStorage.removeItem('ringin_admin_attempts');
        setAttempts(0);
        onLogin(data.session);
      }
    } catch (err) {
      // Failed login — increment attempts
      var newCount = attempts + 1;
      var now = Date.now();
      try{ localStorage.setItem('ringin_admin_attempts', JSON.stringify({count: newCount, lastAttempt: now})); }catch(e){}
      setAttempts(newCount);
      if(newCount >= 5){
        var unlockTime = now + (15 * 60 * 1000);
        setLockedUntil(unlockTime);
        setError('Too many failed attempts. Locked for 15 minutes.');
      } else {
        setError('Invalid credentials. ' + (5 - newCount) + ' attempts remaining.');
      }
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
        // Lockout message
        lockedUntil && React.createElement('div', {
          style: {
            padding: '12px',
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid var(--red)',
            borderRadius: '6px',
            color: 'var(--red)',
            fontSize: '13px'
          }
        }, 'Account locked. Try again in ' + countdown),

        // Error message
        error && !lockedUntil && React.createElement('div', {
          style: {
            padding: '12px',
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid var(--red)',
            borderRadius: '6px',
            color: 'var(--red)',
            fontSize: '13px'
          }
        }, error),

        // Attempts warning
        !lockedUntil && attempts >= 3 && React.createElement('div', {
          style: {
            padding: '12px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid var(--warn, #ffc107)',
            borderRadius: '6px',
            color: 'var(--warn, #ffc107)',
            fontSize: '13px'
          }
        }, 'Warning: ' + (5 - attempts) + ' attempts remaining'),

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
          disabled: loading || lockedUntil,
          style: {
            padding: '10px 16px',
            background: lockedUntil ? '#999' : 'linear-gradient(135deg, var(--ac) 0%, var(--ac2) 100%)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: (loading || lockedUntil) ? 'not-allowed' : 'pointer',
            opacity: (loading || lockedUntil) ? 0.6 : 1,
            transition: 'all 0.2s'
          }
        }, loading ? 'Signing in...' : (lockedUntil ? 'Locked' : 'Sign In'))
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
