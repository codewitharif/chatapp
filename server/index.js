const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv").config();

const app = express();
// const allowedOrigins = [
//   "http://localhost:5173", // dev mode (vite)
//   "http://localhost:3000", // dev mode (CRA)
//   "https://chatappx-lyart.vercel.app", // vercel deploy
// ];

app.use(
  cors({
    origin: "https://chatappx-lyart.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public")); // Serve static files

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Database connection error:", err));

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", UserSchema);

// Message schema
const MessageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", MessageSchema);

const SECRET = process.env.SECRET_KEY;
const connectedUsers = new Map(); // Track connected users

// Register API
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, SECRET, { expiresIn: "24h" });
    res.json({ token, username });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 🔹 NEW: Token verification API
app.post("/auth/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT token
    const decoded = jwt.verify(token, SECRET);

    // Optional: Check if user still exists in database
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      username: decoded.username,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token verification failed:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    res.status(500).json({
      success: false,
      error: "Token verification failed",
    });
  }
});

// Get chat history API
app.get("/messages/:otherUser", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, SECRET);
    const { otherUser } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: decoded.username, receiver: otherUser },
        { sender: otherUser, receiver: decoded.username },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get online users API
app.get("/users/online", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, SECRET);
    const onlineUsers = Array.from(connectedUsers.keys());
    res.json(onlineUsers);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get recent chats API
app.get("/users/recent", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, SECRET);

    // Get all users this person has chatted with
    const recentChats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: decoded.username }, { receiver: decoded.username }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", decoded.username] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $last: "$text" },
          lastTimestamp: { $last: "$timestamp" },
        },
      },
      {
        $sort: { lastTimestamp: -1 },
      },
    ]);

    const recentUsers = recentChats.map((chat) => ({
      username: chat._id,
      lastMessage: chat.lastMessage,
      lastTimestamp: chat.lastTimestamp,
      isOnline: connectedUsers.has(chat._id),
    }));

    res.json(recentUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent chats" });
  }
});

// 🔹 NEW: User search API
app.get("/users/search", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, SECRET);
    const { q: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length < 1) {
      return res.status(400).json({ error: "Search query required" });
    }

    // Search users by username (case insensitive, partial match)
    // Exclude current user from results
    const users = await User.find({
      username: {
        $regex: searchQuery.trim(),
        $options: "i", // case insensitive
      },
      username: { $ne: decoded.username }, // exclude current user
    })
      .select("username createdAt") // only return username and createdAt
      .limit(10) // limit results to 10 users
      .sort({ username: 1 }); // sort alphabetically

    // Add online status to each user
    const usersWithStatus = users.map((user) => ({
      username: user.username,
      createdAt: user.createdAt,
      isOnline: connectedUsers.has(user.username),
    }));

    res.json({
      success: true,
      users: usersWithStatus,
      count: usersWithStatus.length,
    });
  } catch (error) {
    console.error("User search failed:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Search failed" });
  }
});

// Serve main page
app.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "public", "index.html"));
  res.send("server is running");
});

// HTTP + WS server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "auth") {
        const decoded = jwt.verify(data.token, SECRET);
        ws.username = decoded.username;
        connectedUsers.set(ws.username, ws);

        ws.send(
          JSON.stringify({
            type: "auth",
            status: "success",
            username: ws.username,
          })
        );

        // Broadcast updated user list
        broadcastOnlineUsers();
      }

      if (data.type === "message") {
        if (!ws.username) return;

        const newMsg = new Message({
          sender: ws.username,
          receiver: data.receiver,
          text: data.text,
        });
        await newMsg.save();

        // Send to specific receiver if online
        const receiverWs = connectedUsers.get(data.receiver);
        if (receiverWs && receiverWs.readyState === 1) {
          receiverWs.send(
            JSON.stringify({
              type: "message",
              sender: ws.username,
              receiver: data.receiver,
              text: data.text,
              timestamp: newMsg.timestamp,
            })
          );
        }

        // Echo back to sender
        ws.send(
          JSON.stringify({
            type: "message",
            sender: ws.username,
            receiver: data.receiver,
            text: data.text,
            timestamp: newMsg.timestamp,
          })
        );
      }

      if (data.type === "getOnlineUsers") {
        ws.send(
          JSON.stringify({
            type: "onlineUsers",
            users: Array.from(connectedUsers.keys()).filter(
              (u) => u !== ws.username
            ),
          })
        );
      }
    } catch (err) {
      console.log("Error:", err.message);
      ws.send(JSON.stringify({ type: "error", message: "Invalid request" }));
    }
  });

  ws.on("close", () => {
    if (ws.username) {
      connectedUsers.delete(ws.username);
      broadcastOnlineUsers();
    }
  });
});

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(connectedUsers.keys());
  connectedUsers.forEach((userWs, username) => {
    if (userWs.readyState === 1) {
      userWs.send(
        JSON.stringify({
          type: "onlineUsers",
          users: onlineUsers.filter((u) => u !== username),
        })
      );
    }
  });
}

server.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);
