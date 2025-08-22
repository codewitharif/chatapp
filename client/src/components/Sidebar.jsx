// src/components/Sidebar.jsx
import React from "react";

export default function Sidebar({
  currentUser,
  onlineUsers,
  recentChats,
  selectedUser,
  onSelectUser,
  onLogout,
  isSidebarOpen, // Add this prop
}) {
  const truncate = (str, len) =>
    str.length > len ? str.substring(0, len) + "..." : str;

  console.log(
    currentUser,
    onlineUsers,
    recentChats,
    selectedUser,
    onSelectUser,
    onLogout
  );

  return (
    <div className={`sidebar ${isSidebarOpen ? "mobile-show" : ""}`}>
      <div className="user-info">
        <h3>Welcome, {currentUser}!</h3>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="online-users">
        <h4>Recent Chats</h4>
        {recentChats.length === 0 ? (
          <div
            style={{
              padding: "10px 20px",
              textAlign: "center",
              color: "#7f8c8d",
            }}
          >
            No recent chats
          </div>
        ) : (
          recentChats.map((chat) => (
            <div
              key={chat.username}
              className={`user-item ${!chat.isOnline ? "offline" : ""} ${
                selectedUser === chat.username ? "active" : ""
              }`}
              onClick={() => onSelectUser(chat.username)}
            >
              <div className="user-name">{chat.username}</div>
              <div className="last-message">
                {truncate(chat.lastMessage, 30)}
              </div>
              <div
                className={
                  chat.isOnline ? "online-indicator" : "offline-indicator"
                }
              ></div>
            </div>
          ))
        )}

        <h4>Online Users</h4>
        {onlineUsers.length === 0 ? (
          <div
            style={{
              padding: "10px 20px",
              textAlign: "center",
              color: "#7f8c8d",
            }}
          >
            No other users online
          </div>
        ) : (
          onlineUsers.map((username) => (
            <div
              key={username}
              className={`user-item ${
                selectedUser === username ? "active" : ""
              }`}
              onClick={() => onSelectUser(username)}
            >
              <div className="user-name">{username}</div>
              <div className="online-indicator"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
