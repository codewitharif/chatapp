// src/components/ChatArea.jsx
import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import "../App.css";

export default function ChatArea({
  selectedUser,
  messages,
  socket,
  currentUser,
  setIsSidebarOpen,
  isSidebarOpen, // Add this prop
}) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  console.log(selectedUser, messages, socket, currentUser);

  const sendMessage = () => {
    if (!messageText.trim() || !selectedUser || !socket) return;
    socket.send(
      JSON.stringify({
        type: "message",
        text: messageText,
        receiver: selectedUser,
      })
    );
    setMessageText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!selectedUser) {
    return (
      <div className="chat-area">
        <div className="chat-header">
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          Select a user to start chatting
        </div>

        <div className="messages">
          <div className="no-chat">
            <h3>Welcome to Chat App!</h3>
            <p>Select a user from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <button
          className="mobile-menu-btn"
          onClick={toggleSidebar}
        >
          ☰
        </button>
        Chatting with {selectedUser}
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <p style={{ color: "#7f8c8d" }}>No messages yet. Say hello!</p>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={i}
              sender={msg.sender}
              text={msg.text}
              time={new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              isSent={msg.sender === currentUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength="500"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}