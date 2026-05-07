import React, {useState, useEffect} from "react";
import {sb} from "../supabase";

export default function Layout({tab, setTab, adminRole, session, children}) {
  var timeS = useState(new Date().toLocaleTimeString());
  var time = timeS[0];
  var setTime = timeS[1];

  useEffect(function() {
    var interval = setInterval(function() {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return function() { clearInterval(interval); };
  }, []);

  var navItems = [
    {id: "dashboard", label: "Dashboard", icon: "🏠"},
    {id: "users", label: "Users", icon: "👥"},
    {id: "posts", label: "Posts", icon: "📝"},
    {id: "messages", label: "Messages", icon: "💬"},
    {id: "experts", label: "Experts", icon: "🔍"},
    {id: "reports", label: "Reports", icon: "🚩"},
    {id: "analytics", label: "Analytics", icon: "📊"},
    {id: "settings", label: "Settings", icon: "⚙️"},
  ];

  var handleSignOut = async function() {
    await sb.auth.signOut();
    window.location.reload();
  };

  var pageTitle = navItems.find(function(item) { return item.id === tab; })?.label || "Dashboard";

  return React.createElement("div", {style: {
    display: "flex",
    height: "100vh",
    background: "var(--bg)",
  }},
    React.createElement("div", {style: {
      width: "220px",
      background: "var(--bg2)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }},
      React.createElement("div", {style: {
        padding: "24px 16px",
        borderBottom: "1px solid var(--border)",
      }},
        React.createElement("div", {style: {
          fontSize: "20px",
          fontWeight: "bold",
          background: "linear-gradient(135deg, var(--ac) 0%, var(--ac2) 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "4px",
        }}, "RingIn"),
        React.createElement("div", {style: {
          fontSize: "12px",
          color: "var(--t2)",
          fontWeight: "500",
        }}, "Admin Panel"),
      ),

      React.createElement("nav", {style: {
        flex: 1,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }},
        navItems.map(function(item) {
          var isActive = tab === item.id;
          return React.createElement("button", {
            key: item.id,
            onClick: function() { setTab(item.id); },
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "12px 16px",
              background: isActive ? "var(--bg4)" : "transparent",
              border: "none",
              borderLeft: isActive ? "3px solid var(--ac)" : "3px solid transparent",
              borderRadius: "6px",
              color: isActive ? "var(--text)" : "var(--t2)",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            },
            onMouseEnter: function(e) {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(123, 110, 255, 0.05)";
                e.currentTarget.style.color = "var(--text)";
              }
            },
            onMouseLeave: function(e) {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--t2)";
              }
            },
          },
            React.createElement("span", {style: {fontSize: "16px"}}, item.icon),
            React.createElement("span", {}, item.label),
          );
        }),
      ),

      React.createElement("div", {style: {
        padding: "16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }},
        React.createElement("div", {style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }},
          React.createElement("div", {style: {
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--ac) 0%, var(--ac2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "bold",
          }}, session.user.email.charAt(0).toUpperCase()),
          React.createElement("div", {style: {flex: 1, minWidth: 0}},
            React.createElement("div", {style: {
              fontSize: "12px",
              color: "var(--text)",
              fontWeight: "500",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}, session.user.email),
            React.createElement("div", {style: {
              fontSize: "10px",
              color: adminRole === "master" ? "var(--amber)" : "var(--ac)",
              fontWeight: "600",
              textTransform: "uppercase",
              marginTop: "2px",
            }}, adminRole === "master" ? "MASTER" : "ADMIN"),
          ),
        ),
        React.createElement("button", {
          onClick: handleSignOut,
          style: {
            padding: "8px 12px",
            background: "rgba(255, 71, 87, 0.1)",
            border: "1px solid var(--red)",
            borderRadius: "6px",
            color: "var(--red)",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          },
          onMouseEnter: function(e) {
            e.target.style.background = "rgba(255, 71, 87, 0.2)";
          },
          onMouseLeave: function(e) {
            e.target.style.background = "rgba(255, 71, 87, 0.1)";
          },
        }, "Sign Out"),
      ),
    ),

    React.createElement("div", {style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    }},
      React.createElement("div", {style: {
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }},
        React.createElement("h1", {style: {
          fontSize: "24px",
          fontWeight: "600",
          color: "var(--text)",
          margin: 0,
        }}, pageTitle),
        React.createElement("div", {style: {
          fontSize: "13px",
          color: "var(--t2)",
        }}, time),
      ),

      React.createElement("div", {style: {
        flex: 1,
        overflowY: "auto",
        padding: "24px",
      }},
        children,
      ),
    ),
  );
}
