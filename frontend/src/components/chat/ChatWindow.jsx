/**
 * ChatWindow — Main message area with messages list and input
 */

import { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

// ── Typing Indicator ──────────────────────────────────────
const TypingIndicator = ({ typers }) => {
  const names = Object.values(typers);
  if (names.length === 0) return null;

  const label = names.length === 1
    ? `${names[0]} is typing`
    : `${names.slice(0, 2).join(", ")} are typing`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "0 20px 8px",
      color: "var(--text-muted)", fontSize: "0.8rem",
      animation: "fadeIn 0.2s ease",
    }}>
      <div className="typing-dots">
        <span /><span /><span />
      </div>
      {label}
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────
const EmptyState = () => (
  <div style={{
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", gap: 12,
  }}>
    <div style={{ fontSize: 64, opacity: 0.3 }}>⚡</div>
    <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>
      Select a chat to start messaging
    </p>
    <p style={{ fontSize: "0.85rem" }}>Search for users in the sidebar</p>
  </div>
);

// ── Chat Header ───────────────────────────────────────────
const ChatHeader = ({ chat, onlineUsers }) => {
  const { user } = useAuth();
  if (!chat) return null;

  const isGroup = chat.type === "group";
  const otherMember = !isGroup
    ? chat.members?.find((m) => m.user?._id !== user?._id)?.user
    : null;

  const displayName = isGroup
    ? chat.name
    : otherMember?.displayName || otherMember?.username;

  const isOnline = !isGroup && otherMember && onlineUsers.has(otherMember._id);
  const vibe = otherMember?.vibeStatus;

  return (
    <div style={{
      height: "var(--topbar-height)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 20px", gap: 12,
      background: "var(--bg-secondary)",
      flexShrink: 0,
    }}>
      {/* Avatar */}
      <div style={{ position: "relative" }}>
        {otherMember?.avatar ? (
          <img src={otherMember.avatar} alt={displayName}
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "var(--accent)",
          }}>
            {displayName?.[0]?.toUpperCase()}
          </div>
        )}
        {!isGroup && (
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: "50%",
            background: isOnline ? "var(--success)" : "var(--text-muted)",
            border: "2px solid var(--bg-secondary)",
          }} />
        )}
      </div>

      {/* Info */}
      <div>
        <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{displayName}</p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {isGroup
            ? `${chat.members?.length} members`
            : isOnline
            ? (vibe ? `${vibe.emoji} ${vibe.label}` : "Online")
            : "Offline"
          }
        </p>
      </div>

      {/* Actions */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
        <button className="btn-icon" title="Search messages" style={{ fontSize: 16 }}>🔍</button>
        <button className="btn-icon" title="More options" style={{ fontSize: 16 }}>⋮</button>
      </div>
    </div>
  );
};

// ── Main ChatWindow ───────────────────────────────────────
const ChatWindow = () => {
  const { user } = useAuth();
  const { activeChat, messages, typingUsers, onlineUsers, loadingMessages } = useChat();

  const bottomRef = useRef(null);
  const chatMessages = activeChat ? (messages[activeChat._id] || []) : [];
  const chatTypers = activeChat ? (typingUsers[activeChat._id] || {}) : {};
  const lastMessage = chatMessages[chatMessages.length - 1];

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  if (!activeChat) {
    return (
      <div style={{ flex: 1, display: "flex", background: "var(--bg-primary)" }}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "var(--bg-primary)", overflow: "hidden",
    }}>
      <ChatHeader chat={activeChat} onlineUsers={onlineUsers} />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {loadingMessages && chatMessages.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>👋</p>
            <p>This is the beginning of your conversation.</p>
            <p style={{ fontSize: "0.85rem", marginTop: 4 }}>Say hello!</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const prevMsg = chatMessages[idx - 1];
            const showAvatar = !prevMsg || prevMsg.sender?._id !== msg.sender?._id;
            return (
              <MessageBubble
                key={msg._id}
                message={msg}
                showAvatar={showAvatar}
              />
            );
          })
        )}

        <TypingIndicator typers={chatTypers} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput chatId={activeChat._id} lastMessage={lastMessage} />
    </div>
  );
};

export default ChatWindow;
