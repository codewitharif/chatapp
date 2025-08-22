// src/components/AuthForm.jsx - Updated version
import React, { useState } from "react";

// const API_BASE_URL = "http://localhost:5000";

export default function AuthForm({ setToken, setCurrentUser, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username.trim(), password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Login successful
        console.log("Login response:", data);

        // Call the new onLoginSuccess callback if provided
        if (onLoginSuccess) {
          onLoginSuccess({
            token: data.token,
            username: data.username,
          });
        } else {
          // Fallback to old props (backward compatibility)
          setToken(data.token);
          setCurrentUser(data.username);
        }

        setSuccess("Login successful!");
      } else {
        // Registration successful
        setSuccess("Registration successful! Please login.");
        setIsLogin(true);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Network error. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="switch-auth">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
              setUsername("");
              setPassword("");
            }}
            style={{ pointerEvents: isLoading ? "none" : "auto" }}
          >
            {isLogin ? "Register" : "Login"}
          </a>
        </div>
      </form>
    </div>
  );
}
