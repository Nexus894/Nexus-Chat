/**
 * MessageBubble — Single message with reactions, thread count, delete
 */

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "⚡", "🎉"];

const MessageBubble = ({ message, showAvatar = true }) => {
  const { user } = useAuth();
  const { reactToMessage, activeChat } = useChat();
  const [showReactions, setShowReactions] = useState(false);
  const [storming, setStorming] = useState(false);

  const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
  const isDeleted = message.isDeleted;

  const senderName = message.sentAsAnonymous
    ? message.anonymousPersonaSnapshot?.name || "Anonymous"
    : message.sender?.displayName || message.sender?.username || "Unknown";

  const senderAvatar = message.sentAsAnonymous
    ? null
    : message.sender?.avatar;

  const handleReact = async (emoji) => {
    setShowReactions(false);
    await reactToMessage(message._id, emoji, activeChat?._id);

    // Check if this triggers a storm
    const reaction = message.reactions?.find((r) => r.emoji === emoji);
    if (reaction && reaction.count >= 4) {
      setStorming(true);
      setTimeout(() => setStorming(false), 800);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 4,
      animation: "fadeIn 0.2s ease",
      position: "relative",
    }}
      onMouseEnter={() => !isDeleted && setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar (other users only) */}
      {!isOwn && showAvatar && (
        <div style={{ flexShrink: 0, marginBottom: 4 }}>
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName}
              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: message.sentAsAnonymous
                ? (message.anonymousPersonaSnapshot?.color || "var(--accent)")
                : "var(--accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "var(--accent)",
            }}>
              {senderName[0]?.toUpperCase()}
            </div>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}

      {/* Bubble */}
      <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start" }}>

        {/* Sender name (groups, not own) */}
        {!isOwn && activeChat?.type === "group" && showAvatar && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)",
            marginBottom: 2, paddingLeft: 12 }}>
            {message.sentAsAnonymous && "🎭 "}{senderName}
            {message.aiGenerated && " · 🤖 AI"}
          </span>
        )}

        <div style={{
          background: isDeleted
            ? "transparent"
            : isOwn
            ? "var(--accent)"
            : "var(--bg-tertiary)",
          color: isDeleted ? "var(--text-muted)" : "var(--text-primary)",
          borderRadius: isOwn
            ? "18px 18px 4px 18px"
            : "18px 18px 18px 4px",
          padding: isDeleted ? "6px 14px" : "10px 14px",
          fontSize: "0.9rem",
          lineHeight: 1.5,
          border: isDeleted ? "1px dashed var(--border)" : "none",
          fontStyle: isDeleted ? "italic" : "normal",
          position: "relative",
          animation: storming ? "reactionStorm 0.6s ease" : "none",
        }}>
          {message.type === "voice" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎙</span>
              <audio controls src={message.mediaUrl}
                style={{ height: 32, maxWidth: 200 }} />
              {message.mediaMeta?.duration && (
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  {Math.round(message.mediaMeta.duration)}s
                </span>
              )}
            </div>
          ) : (
            message.content
          )}
        </div>

        {/* Reactions row */}
        {message.reactions?.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap",
            justifyContent: isOwn ? "flex-end" : "flex-start" }}>
            {message.reactions.map((r) => (
              <button key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                style={{
                  background: r.users?.includes(user?._id) ? "var(--accent-dim)" : "var(--bg-tertiary)",
                  border: r.users?.includes(user?._id) ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-full)",
                  padding: "2px 8px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: "0.8rem",
                  animation: r.isStorming ? "reactionStorm 0.5s ease" : "none",
                  transition: "all var(--transition)",
                }}>
                <span>{r.emoji}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread count */}
        {message.threadCount > 0 && (
          <button style={{
            background: "none", border: "none", color: "var(--accent)",
            cursor: "pointer", fontSize: "0.75rem", marginTop: 4,
            padding: "2px 12px",
          }}>
            💬 {message.threadCount} {message.threadCount === 1 ? "reply" : "replies"}
          </button>
        )}

        {/* Timestamp */}
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 3,
          paddingRight: isOwn ? 4 : 0, paddingLeft: isOwn ? 0 : 4 }}>
          {format(new Date(message.createdAt), "HH:mm")}
          {message.isEdited && " · edited"}
          {isOwn && message.readBy?.length > 1 && (
            <span style={{ marginLeft: 4, color: "var(--accent)" }}>✓✓</span>
          )}
        </span>
      </div>

      {/* Quick Reaction picker (hover) */}
      {showReactions && !isDeleted && (
        <div style={{
          position: "absolute",
          [isOwn ? "left" : "right"]: "calc(100% + 4px)",
          bottom: 24,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-full)",
          padding: "4px 8px",
          display: "flex", gap: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          zIndex: 10,
          animation: "fadeIn 0.15s ease",
        }}>
          {QUICK_EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => handleReact(emoji)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, padding: "2px 3px", borderRadius: 6,
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.3)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
