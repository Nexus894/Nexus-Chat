/**
 * MessageInput — Text input with typing indicators, emoji, AI smart replies
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { aiAPI } from "../../services/api";
import { getSocket } from "../../services/socket";

const EMOJI_LIST = [
  "😀","😂","🥰","😎","🤔","😮","😢","😡","🎉","🔥",
  "❤️","👍","👎","🙌","🤝","✨","💯","🎯","⚡","🌟",
];

const MessageInput = ({ chatId, lastMessage }) => {
  const { user } = useAuth();
  const { sendMessage } = useChat();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const inputRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeout = useRef(null);

  // ── Typing indicator ────────────────────────────────────
  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit("typing_start", { chatId });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit("typing_stop", { chatId });
    }, 2000);
  }, [chatId]);

  // ── Fetch AI suggestions when last message changes ──────
  useEffect(() => {
    if (!user?.settings?.aiSuggestions || !lastMessage || lastMessage.sender?._id === user._id) {
      setAiSuggestions([]);
      return;
    }

    setLoadingAI(true);
    aiAPI
      .getSmartReplies(chatId, lastMessage._id)
      .then(({ data }) => setAiSuggestions(data.suggestions || []))
      .catch(() => setAiSuggestions([]))
      .finally(() => setLoadingAI(false));
  }, [lastMessage?._id, chatId, user]);

  // ── Send message ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;

    setText("");
    setAiSuggestions([]);
    setSending(true);

    // Stop typing indicator
    clearTimeout(typingTimeout.current);
    typingRef.current = false;
    getSocket().emit("typing_stop", { chatId });

    try {
      await sendMessage(chatId, content);
    } catch (err) {
      setText(content); // Restore on failure
      console.error("Send failed:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, sending, chatId, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const useSuggestion = (suggestion) => {
    setText(suggestion);
    setAiSuggestions([]);
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      padding: "12px 16px",
    }}>
      {/* ── AI Smart Replies ─────────────────────────── */}
      {(aiSuggestions.length > 0 || loadingAI) && (
        <div style={{
          display: "flex", gap: 8, marginBottom: 10,
          alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
            🤖 Quick reply:
          </span>
          {loadingAI ? (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Thinking...
            </span>
          ) : (
            aiSuggestions.map((s, i) => (
              <button key={i} onClick={() => useSuggestion(s)}
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-accent)",
                  color: "var(--text-secondary)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-dim)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-tertiary)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Input Row ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>

        {/* Emoji button + picker */}
        <div style={{ position: "relative" }}>
          <button className="btn-icon" onClick={() => setShowEmoji(!showEmoji)}
            style={{ fontSize: 20, padding: 8 }}>
            😊
          </button>
          {showEmoji && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: 0,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 10,
              display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4,
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              zIndex: 20,
              animation: "fadeIn 0.15s ease",
            }}>
              {EMOJI_LIST.map((e) => (
                <button key={e} onClick={() => insertEmoji(e)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 20, padding: 4, borderRadius: 4,
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(el) => el.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={(el) => el.currentTarget.style.transform = "scale(1)"}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text area */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-main)",
            fontSize: "0.9rem",
            padding: "10px 16px",
            resize: "none",
            outline: "none",
            transition: "border-color var(--transition)",
            maxHeight: 140,
            overflowY: "auto",
            lineHeight: 1.5,
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />

        {/* Send button */}
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", flexShrink: 0 }}
        >
          {sending
            ? <span className="spinner" style={{ width: 16, height: 16 }} />
            : <span style={{ fontSize: 16 }}>↑</span>
          }
        </button>
      </div>

      {/* Anonymous mode indicator */}
      {user?.isAnonymous && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6, textAlign: "center" }}>
          🎭 Sending as <strong style={{ color: "var(--text-secondary)" }}>
            {user.anonymousPersona?.name}
          </strong> · Anonymous mode on
        </p>
      )}
    </div>
  );
};

export default MessageInput;
