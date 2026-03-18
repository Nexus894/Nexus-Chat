/**
 * ChatContext
 * Global chat state: chats list, active chat, messages, socket events
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from "react";
import { chatAPI, messageAPI } from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({}); // chatId → Message[]
  const [typingUsers, setTypingUsers] = useState({}); // chatId → { userId: username }
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const typingTimeouts = useRef({});

  // ── Fetch all chats ─────────────────────────────────────
  const loadChats = useCallback(async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const { data } = await chatAPI.getMyChats();
      setChats(data.chats);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [user]);

  // ── Fetch messages for a chat ───────────────────────────
  const loadMessages = useCallback(async (chatId, page = 1) => {
    setLoadingMessages(true);
    try {
      const { data } = await messageAPI.getMessages(chatId, page);
      setMessages((prev) => ({
        ...prev,
        [chatId]: page === 1 ? data.messages : [...data.messages, ...(prev[chatId] || [])],
      }));
      return data.pagination;
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Open a chat ─────────────────────────────────────────
  const openChat = useCallback((chat) => {
    setActiveChat(chat);
    if (!messages[chat._id]) loadMessages(chat._id);

    // Join socket room
    const socket = getSocket();
    socket.emit("join_chat", { chatId: chat._id });
  }, [messages, loadMessages]);

  // ── Send a message ──────────────────────────────────────
  const sendMessage = useCallback(async (chatId, content, options = {}) => {
    try {
      // Stop typing indicator
      const socket = getSocket();
      socket.emit("typing_stop", { chatId });

      await messageAPI.sendMessage(chatId, { content, ...options });
      // Message will arrive via socket event "new_message"
    } catch (err) {
      console.error("Failed to send:", err);
      throw err;
    }
  }, []);

  // ── React to message ────────────────────────────────────
  const reactToMessage = useCallback(async (messageId, emoji, chatId) => {
    try {
      await messageAPI.reactToMessage(messageId, emoji);
      // Updates arrive via socket "reaction_update"
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  }, []);

  // ── Update last message in sidebar ─────────────────────
  const updateChatLastMessage = useCallback((msg) => {
    setChats((prev) =>
      prev
        .map((c) =>
          c._id === msg.chatId?.toString()
            ? { ...c, lastMessage: msg, lastActivity: msg.createdAt }
            : c
        )
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    );
  }, []);

  // ── Socket Events ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket.connected) return;

    loadChats();

    // ── New message received ──────────────────────────────
    const onNewMessage = (msg) => {
      const cId = msg.chatId?.toString() || msg.chatId;
      setMessages((prev) => ({
        ...prev,
        [cId]: [...(prev[cId] || []), msg],
      }));
      updateChatLastMessage({ ...msg, chatId: cId });

      // Mark delivered
      socket.emit("message_delivered", { messageId: msg._id });
    };

    // ── Reaction update ───────────────────────────────────
    const onReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        for (const chatId in updated) {
          updated[chatId] = updated[chatId].map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          );
        }
        return updated;
      });
    };

    // ── Message deleted ───────────────────────────────────
    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        for (const chatId in updated) {
          updated[chatId] = updated[chatId].map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, content: "This message was deleted" }
              : m
          );
        }
        return updated;
      });
    };

    // ── Typing ────────────────────────────────────────────
    const onTyping = ({ chatId, userId, username, isTyping }) => {
      if (userId === user._id) return; // Ignore self

      setTypingUsers((prev) => {
        const chatTyping = { ...(prev[chatId] || {}) };
        if (isTyping) {
          chatTyping[userId] = username;
        } else {
          delete chatTyping[userId];
        }
        return { ...prev, [chatId]: chatTyping };
      });

      // Auto-clear after 5s
      const key = `${chatId}_${userId}`;
      clearTimeout(typingTimeouts.current[key]);
      if (isTyping) {
        typingTimeouts.current[key] = setTimeout(() => {
          setTypingUsers((prev) => {
            const chatTyping = { ...(prev[chatId] || {}) };
            delete chatTyping[userId];
            return { ...prev, [chatId]: chatTyping };
          });
        }, 5000);
      }
    };

    // ── Online presence ───────────────────────────────────
    const onOnlineUsers = (userIds) => setOnlineUsers(new Set(userIds));
    const onStatusChange = ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    // ── New chat created ──────────────────────────────────
    const onNewChat = (chat) => {
      setChats((prev) => {
        const exists = prev.find((c) => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });
    };

    socket.on("new_message", onNewMessage);
    socket.on("reaction_update", onReactionUpdate);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("user_typing", onTyping);
    socket.on("online_users", onOnlineUsers);
    socket.on("user_status_change", onStatusChange);
    socket.on("new_chat", onNewChat);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("reaction_update", onReactionUpdate);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("user_typing", onTyping);
      socket.off("online_users", onOnlineUsers);
      socket.off("user_status_change", onStatusChange);
      socket.off("new_chat", onNewChat);
    };
  }, [user, loadChats, updateChatLastMessage]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, messages, typingUsers, onlineUsers,
      loadingChats, loadingMessages,
      loadChats, loadMessages, openChat, sendMessage, reactToMessage,
      setChats, setActiveChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
};
