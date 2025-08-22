// src/components/Sidebar.jsx - Updated with search functionality
import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000";

export default function Sidebar({
  currentUser,
  onlineUsers,
  recentChats,
  selectedUser,
  onSelectUser,
  onLogout,
  isSidebarOpen,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const truncate = (str, len) =>
    str.length > len ? str.substring(0, len) + "..." : str;

  // Search users function
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/search?q=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("chatToken")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      } else {
        setSearchError(data.error || "Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Network error. Please try again.");
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  // Debounced search - search after user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUserSelect = (username) => {
    onSelectUser(username);
    // Keep search results visible for easy access
    // setSearchQuery(""); // Uncomment if you want to clear search after selection
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError("");
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? "mobile-show" : ""}`}>
      <div className="user-info">
        <h3>Welcome, {currentUser}!</h3>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>

        {isSearching && <div className="search-status">Searching...</div>}

        {searchError && <div className="search-error">{searchError}</div>}
      </div>

      <div className="online-users">
        {/* Show Search Results */}
        {showSearchResults && (
          <>
            <h4>Search Results ({searchResults.length})</h4>
            {searchResults.length === 0 ? (
              <div className="no-results">
                No users found for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={`search-${user.username}`}
                  className={`user-item ${
                    selectedUser === user.username ? "active" : ""
                  }`}
                  onClick={() => handleUserSelect(user.username)}
                >
                  <div className="user-name">{user.username}</div>
                  <div className="user-status">
                    {user.isOnline ? "Online" : "Offline"}
                  </div>
                  <div
                    className={
                      user.isOnline ? "online-indicator" : "offline-indicator"
                    }
                  ></div>
                </div>
              ))
            )}
            <div className="section-divider"></div>
          </>
        )}

        {/* Recent Chats */}
        <h4>Recent Chats</h4>
        {recentChats.length === 0 ? (
          <div className="no-items">No recent chats</div>
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

        {/* Online Users */}
        <h4>Online Users</h4>
        {onlineUsers.length === 0 ? (
          <div className="no-items">No other users online</div>
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
