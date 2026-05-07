/* eslint-disable */
import React,{useState,useEffect} from 'react';
import {sb} from './supabase';
import LoginScreen from './screens/LoginScreen';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import Users from './screens/Users';
import Posts from './screens/Posts';
import Experts from './screens/Experts';
import Reports from './screens/Reports';
import Messages from './screens/Messages';
import Analytics from './screens/Analytics';
import Settings from './screens/Settings';

export default function App(){
  var sessionS=useState(null); var session=sessionS[0]; var setSession=sessionS[1];
  var tabS=useState('dashboard'); var tab=tabS[0]; var setTab=tabS[1];
  var adminRoleS=useState(null); var adminRole=adminRoleS[0]; var setAdminRole=adminRoleS[1];
  var loadingS=useState(true); var loading=loadingS[0]; var setLoading=loadingS[1];

  useEffect(function(){
    sb.auth.getSession().then(function(r){
      var sess = r.data&&r.data.session ? r.data.session : null;
      setSession(sess);
      if(sess){
        sb.from('admins').select('role').eq('email', sess.user.email).single().then(function(res){
          if(res.data) setAdminRole(res.data.role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    var listener = sb.auth.onAuthStateChange(function(event, sess){
      setSession(sess);
      if(sess){
        sb.from('admins').select('role').eq('email', sess.user.email).single().then(function(res){
          if(res.data) setAdminRole(res.data.role);
        });
      } else {
        setAdminRole(null);
      }
    });
    return function(){ if(listener&&listener.data&&listener.data.subscription) listener.data.subscription.unsubscribe(); };
  },[]);

  if(loading) return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0A0A0F',color:'#7B6EFF',fontSize:'18px',fontFamily:'DM Sans,sans-serif'}},'Loading...');
  if(!session) return React.createElement(LoginScreen,{onLogin:function(sess){setSession(sess);}});

  var screens = {
    dashboard: React.createElement(Dashboard,{onNavigate:setTab}),
    users: React.createElement(Users,{adminRole:adminRole,session:session}),
    posts: React.createElement(Posts,{adminRole:adminRole,session:session}),
    experts: React.createElement(Experts,{adminRole:adminRole,session:session}),
    reports: React.createElement(Reports,{adminRole:adminRole,session:session}),
    messages: React.createElement(Messages,{adminRole:adminRole,session:session}),
    analytics: React.createElement(Analytics,{adminRole:adminRole,session:session}),
    settings: React.createElement(Settings,{adminRole:adminRole,session:session}),
  };

  return React.createElement(Layout,{tab:tab,setTab:setTab,adminRole:adminRole,session:session},
    screens[tab] || screens.dashboard
  );
}
