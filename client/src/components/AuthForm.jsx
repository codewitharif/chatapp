// src/components/AuthForm.jsx
import React, { useState } from "react";

// const API_BASE_URL = "http://localhost:5000";

export default function AuthForm({ setToken, setCurrentUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const endpoint = isLogin
      ? `${import.meta.env.VITE_API_BASE_URL}/login`
      : `${import.meta.env.VITE_API_BASE_URL}/register`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("my auth data is ", data);

      if (res.ok) {
        if (isLogin) {
          setToken(data.token);
          setCurrentUser(data.username);
          localStorage.setItem("chatToken", data.token);
          alert("login successfully");
        } else {
          setSuccess("Registration successful! Please login.");
          setIsLogin(true);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      alert(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? "Login to Chat" : "Register for Chat"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        <div className="switch-auth">
          <span>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <a onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
            {isLogin ? "Register here" : "Login here"}
          </a>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
}
