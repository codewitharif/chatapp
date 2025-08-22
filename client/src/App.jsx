// src/App.js - Updated with token verification
import React, { useState, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import ChatInterface from "./components/ChatInterface";
import "./App.css";

// const API_BASE_URL = "http://localhost:5000";
// const WS_URL = "ws://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("chatToken"));
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for token verification
  const [isTokenValid, setIsTokenValid] = useState(false);

  console.log("Current state:", {
    token,
    currentUser,
    socket,
    isLoading,
    isTokenValid,
  });

  // 🔹 Token verification on app load
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("chatToken");
      const storedUser = localStorage.getItem("chatUser");

      if (!storedToken) {
        setIsLoading(false);
        setIsTokenValid(false);
        return;
      }

      try {
        console.log("Verifying token...");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Token is valid
          console.log("Token verified successfully:", data.username);
          setToken(storedToken);
          setCurrentUser(data.username);
          setIsTokenValid(true);

          // Store username if not already stored
          if (!storedUser) {
            localStorage.setItem("chatUser", data.username);
          }
        } else {
          // Token is invalid
          console.log("Token verification failed:", data.error);
          localStorage.removeItem("chatToken");
          localStorage.removeItem("chatUser");
          setToken(null);
          setCurrentUser(null);
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error("Token verification error:", error);
        // On network error, clear token to be safe
        localStorage.removeItem("chatToken");
        localStorage.removeItem("chatUser");
        setToken(null);
        setCurrentUser(null);
        setIsTokenValid(false);
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []); // Run only once on app load

  // 🔹 WebSocket connection (only when token is valid)
  useEffect(() => {
    let reconnectTimeout;

    const connectWebSocket = () => {
      if (token && isTokenValid && currentUser && !socket) {
        console.log("Connecting WebSocket...");
        const ws = new WebSocket(import.meta.env.VITE_WS_URL);

        ws.onopen = () => {
          console.log("WebSocket connected");
          ws.send(JSON.stringify({ type: "auth", token }));
          clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.type === "auth" && data.status === "success") {
            console.log("WebSocket auth successful");
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
          if (isTokenValid && token) {
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };

        setSocket(ws);
      }
    };

    connectWebSocket();

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token, isTokenValid, currentUser]); // Depend on token validity

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");
    setToken(null);
    setCurrentUser(null);
    setIsTokenValid(false);
    if (socket) {
      socket.close();
    }
    setSocket(null);
  };

  // Handle successful login from AuthForm
  const handleLoginSuccess = (userData) => {
    console.log("Login successful:", userData);
    localStorage.setItem("chatToken", userData.token);
    localStorage.setItem("chatUser", userData.username);
    setToken(userData.token);
    setCurrentUser(userData.username);
    setIsTokenValid(true);
  };

  // Show loading screen while verifying token
  if (isLoading) {
    return (
      <div className="container">
        <div className="auth-container">
          <div className="auth-form" style={{ textAlign: "center" }}>
            <h2>Loading...</h2>
            <p>Verifying your session, please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {!token || !currentUser || !isTokenValid ? (
        <AuthForm
          setToken={setToken}
          setCurrentUser={setCurrentUser}
          onLoginSuccess={handleLoginSuccess}
        />
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
