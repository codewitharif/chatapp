// src/App.js
import React, { useState, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import ChatInterface from "./components/ChatInterface";
import "./App.css";

// const API_BASE_URL = "http://localhost:5000";
// const WS_URL = "ws://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("chatToken"));
  console.log("i got token in app.jsx", token);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);

  // WebSocket connect on token
  // useEffect(() => {
  //   if (token && !socket) {
  //     const ws = new WebSocket(WS_URL);
  //     ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));
  //     ws.onmessage = (e) => {
  //       const data = JSON.parse(e.data);
  //       if (data.type === "auth" && data.status === "success") {
  //         setCurrentUser(data.username);
  //       }
  //     };
  //     ws.onclose = () => setSocket(null);
  //     setSocket(ws);

  //     return () => ws.close();
  //   }
  // }, [token]);

  // useEffect(() => {
  //   if (token) {
  //     const ws = new WebSocket(WS_URL);

  //     ws.onopen = () => {
  //       ws.send(JSON.stringify({ type: "auth", token }));
  //     };

  //     ws.onmessage = (e) => {
  //       const data = JSON.parse(e.data);
  //       if (data.type === "auth" && data.status === "success") {
  //         setCurrentUser(data.username);
  //       }
  //     };

  //     ws.onclose = () => {
  //       console.log("WebSocket closed");
  //       setSocket(null);
  //     };

  //     setSocket(ws);

  //     // ✅ cleanup only on unmount
  //     return () => {
  //       if (ws.readyState === WebSocket.OPEN) {
  //         ws.close();
  //       }
  //     };
  //   }
  // }, [token]);
  console.log("Current state:", { token, currentUser, socket });
  useEffect(() => {
    let reconnectTimeout;

    const connectWebSocket = () => {
      if (token && !socket) {
        const ws = new WebSocket(import.meta.env.VITE_WS_URL);

        ws.onopen = () => {
          console.log("WebSocket connected");
          ws.send(JSON.stringify({ type: "auth", token }));
          clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.type === "auth" && data.status === "success") {
            setCurrentUser(data.username);
          } else if (data.type === "error") {
            console.error("WebSocket auth error:", data.message);
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          setSocket(null);
        };

        ws.onclose = () => {
          console.log("WebSocket closed, retrying in 5 seconds...");
          setSocket(null);
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };

        setSocket(ws);
      } else {
        console.error("gettong error");
      }
    };

    connectWebSocket();

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token]);
  const handleLogout = () => {
    localStorage.removeItem("chatToken");
    setToken(null);
    setCurrentUser(null);
    if (socket) socket.close();
    setSocket(null);
  };

  return (
    <div className="container">
      {!token || !currentUser ? (
        <AuthForm setToken={setToken} setCurrentUser={setCurrentUser} />
      ) : (
        <ChatInterface
          currentUser={currentUser}
          socket={socket}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
