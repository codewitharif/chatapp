// src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import "../App.css";

export default function ChatInterface({ currentUser, socket, onLogout }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //   const API_BASE_URL = "http://localhost:5000";

  console.log(
    "ChatInterface rendered with:",
    "currentUser",
    currentUser,
    "socket",
    socket
  );

  // 🔹 yeh function ab har jagah se accessible hai
  const fetchRecentChats = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/recent`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("chatToken")}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRecentChats(data);
      }
    } catch (err) {
      console.error("Failed to load recent chats", err);
    }
  };

  useEffect(() => {
    if (currentUser) fetchRecentChats();
  }, [currentUser]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "onlineUsers") {
          setOnlineUsers(data.users.filter((u) => u !== currentUser));
        }
        if (data.type === "message") {
          if (
            (data.sender === selectedUser && data.receiver === currentUser) ||
            (data.sender === currentUser && data.receiver === selectedUser)
          ) {
            setChatHistory((prev) => [...prev, data]);
          }
          // ✅ ab yeh chalega kyunki function scope me hai
          setTimeout(fetchRecentChats, 100);
        }
      };
    }

    const interval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "getOnlineUsers" }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [socket, selectedUser, currentUser]);

  const selectUser = async (username) => {
    setSelectedUser(username);
    setChatHistory([]);
    setIsSidebarOpen(false); // Close sidebar when user is selected on mobile
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/messages/${username}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("chatToken")}`,
          },
        }
      );
      if (res.ok) {
        const history = await res.json();
        setChatHistory(history);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  return (
    <div
      className={`chat-container ${isSidebarOpen ? "sidebar-open" : ""}`}
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Sidebar
        currentUser={currentUser}
        onlineUsers={onlineUsers}
        recentChats={recentChats}
        selectedUser={selectedUser}
        onSelectUser={selectUser}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
      />

      <ChatArea
        selectedUser={selectedUser}
        messages={chatHistory}
        socket={socket}
        currentUser={currentUser}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}
