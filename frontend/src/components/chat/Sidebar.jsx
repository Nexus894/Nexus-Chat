/**
 * Sidebar — Chat list, user search, vibe status
 */

import { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { userAPI, chatAPI } from "../../services/api";
import { formatDistanceToNow } from "date-fns";

// ── Avatar Helper ─────────────────────────────────────────
const Avatar = ({ user, size = 40 }) => {
  if (!user) return null;
  const displayUser = user.isAnonymous ? { ...user, avatar: user.anonymousPersona?.avatar } : user;
  const name = user.isAnonymous
    ? user.anonymousPersona?.name
    : user.displayName || user.username;

  if (displayUser.avatar) {
    return <img src={displayUser.avatar} alt={name} className="avatar"
      style={{ width: size, height: size }} />;
  }
  return (
    <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

// ── Online Indicator ──────────────────────────────────────
const OnlineDot = ({ isOnline, style }) => (
  <div className={`online-dot ${isOnline ? "" : "offline"}`} style={style} />
);

// ── Chat Preview Row ──────────────────────────────────────
const ChatRow = ({ chat, isActive, onClick, onlineUsers, currentUserId }) => {
  const isGroup = chat.type === "group";
  const otherMember = !isGroup
    ? chat.members?.find((m) => m.user?._id !== currentUserId)?.user
    : null;

  const displayName = isGroup
    ? chat.name
    : otherMember?.displayName || otherMember?.username || "Unknown";

  const avatar = isGroup ? null : otherMember;
  const isOnline = !isGroup && onlineUsers.has(otherMember?._id);

  const lastMsg = chat.lastMessage;
  const preview = lastMsg?.isDeleted
    ? "Message deleted"
    : lastMsg?.type === "voice"
    ? "🎙 Voice message"
    : lastMsg?.content || "No messages yet";

  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      background: isActive ? "var(--accent-dim)" : "transparent",
      border: isActive ? "1px solid var(--border-accent)" : "1px solid transparent",
      transition: "all var(--transition)",
      margin: "2px 8px",
    }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-glass)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Avatar with online indicator */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {isGroup ? (
          <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: 18 }}>
            {chat.name?.[0]?.toUpperCase() || "G"}
          </div>
        ) : (
          <Avatar user={avatar} size={44} />
        )}
        {!isGroup && (
          <OnlineDot isOnline={isOnline}
            style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11 }} />
        )}
      </div>

      {/* Name + Preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}
            className="truncate">
            {isGroup && <span style={{ marginRight: 4, opacity: 0.6 }}>👥</span>}
            {displayName}
          </span>
          {chat.lastActivity && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
              {formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: false })}
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}
          className="truncate">
          {lastMsg?.sender?._id === currentUserId ? "You: " : ""}
          {preview}
        </p>
      </div>
    </div>
  );
};

// ── Search Results ────────────────────────────────────────
const SearchResults = ({ results, onStartDM, loading }) => {
  if (loading) return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <div className="spinner" style={{ margin: "0 auto" }} />
    </div>
  );
  if (!results.length) return (
    <p style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
      No users found
    </p>
  );
  return (
    <div>
      {results.map((u) => (
        <div key={u._id} onClick={() => onStartDM(u._id)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", cursor: "pointer", margin: "2px 8px",
            borderRadius: "var(--radius-md)",
            transition: "background var(--transition)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-glass)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ position: "relative" }}>
            <Avatar user={u} size={40} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u.displayName || u.username}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>@{u.username}</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--accent)" }}>
            Message →
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Sidebar ──────────────────────────────────────────
const Sidebar = () => {
  const { user, logout } = useAuth();
  const { chats, activeChat, openChat, onlineUsers, loadingChats, setActiveChat, setChats } = useChat();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    clearTimeout(searchTimeout);
    if (value.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await userAPI.search(value);
        setSearchResults(data.users);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    setSearchTimeout(t);
  }, [searchTimeout]);

  const handleStartDM = async (userId) => {
    try {
      const { data } = await chatAPI.createDM(userId);
      if (data.isNew) {
        setChats((prev) => [data.chat, ...prev]);
      }
      openChat(data.chat);
      setSearch(""); setSearchResults([]);
    } catch (err) {
      console.error("DM failed:", err);
    }
  };

  const vibeEmoji = user?.vibeStatus?.emoji || "😊";
  const vibe = user?.vibeStatus;

  return (
    <div style={{
      width: "var(--sidebar-width)", flexShrink: 0,
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
    }}>
      {/* ── Header: Self ──────────────────────────────── */}
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ position: "relative" }}>
          <Avatar user={user} size={40} />
          {/* Aura ring */}
          <div style={{
            position: "absolute", inset: -3,
            borderRadius: "50%",
            border: `2px solid ${vibe?.auraColor || "var(--accent)"}`,
            opacity: 0.7,
            animation: "auraGlow 3s ease-in-out infinite",
          }} />
          <OnlineDot isOnline style={{ position: "absolute", bottom: 0, right: 0 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem" }} className="truncate">
            {user?.displayName || user?.username}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vibeEmoji} {vibe?.label || "Online"}
          </p>
        </div>

        <button className="btn-icon" onClick={logout} title="Sign out"
          style={{ fontSize: 16 }}>⏏</button>
      </div>

      {/* ── Search ────────────────────────────────────── */}
      <div style={{ padding: "12px 16px" }}>
        <input className="input" placeholder="🔍  Search users..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ fontSize: "0.85rem", padding: "8px 14px" }}
        />
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {search.length >= 2 ? (
          <SearchResults results={searchResults} onStartDM={handleStartDM} loading={searching} />
        ) : (
          <>
            <p style={{ padding: "4px 24px 8px", fontSize: "0.72rem",
              color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Messages
            </p>
            {loadingChats ? (
              <div style={{ padding: 20, textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : chats.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "2rem", marginBottom: 8 }}>💬</p>
                <p style={{ fontSize: "0.85rem" }}>No chats yet.</p>
                <p style={{ fontSize: "0.8rem", marginTop: 4 }}>Search for a user above to start.</p>
              </div>
            ) : (
              chats.map((chat) => (
                <ChatRow
                  key={chat._id}
                  chat={chat}
                  isActive={activeChat?._id === chat._id}
                  onClick={() => openChat(chat)}
                  onlineUsers={onlineUsers}
                  currentUserId={user?._id}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* ── Footer Nav ────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
        display: "flex", gap: 4,
      }}>
        {[
          { icon: "💬", label: "Chats" },
          { icon: "⚡", label: "Pulse Rooms" },
          { icon: "⚙️", label: "Settings" },
        ].map(({ icon, label }) => (
          <button key={label} className="btn-icon"
            style={{ flex: 1, flexDirection: "column", gap: 2, padding: "8px 4px", fontSize: 18 }}
            title={label}>
            {icon}
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
