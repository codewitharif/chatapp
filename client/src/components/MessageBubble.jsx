// src/components/MessageBubble.jsx
import React from "react";

export default function MessageBubble({ text, time, isSent }) {
  return (
    <div className={`message ${isSent ? "sent" : "received"}`}>
      <div>{text}</div>
      <div className="message-time">{time}</div>
    </div>
  );
}
