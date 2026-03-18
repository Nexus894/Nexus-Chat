/**
 * API Service — Axios instance + all API calls
 */

import axios from "axios";

// ── Axios Instance ────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Send cookies
  headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor: Attach JWT from localStorage ─────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor: Handle 401 globally ─────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nexus_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════
export const userAPI = {
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.patch("/users/profile", data),
  updateVibe: (data) => api.patch("/users/vibe", data),
  updateTheme: (data) => api.patch("/users/theme", data),
  toggleAnonymous: () => api.patch("/users/anonymous"),
  updateSettings: (data) => api.patch("/users/settings", data),
};

// ════════════════════════════════════════════════════════════
// CHATS
// ════════════════════════════════════════════════════════════
export const chatAPI = {
  getMyChats: () => api.get("/chats"),
  getChatById: (chatId) => api.get(`/chats/${chatId}`),
  createDM: (userId) => api.post("/chats/dm", { userId }),
  createGroup: (data) => api.post("/chats/group", data),
};

// ════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════
export const messageAPI = {
  getMessages: (chatId, page = 1) =>
    api.get(`/messages/${chatId}?page=${page}&limit=30`),
  sendMessage: (chatId, data) => api.post(`/messages/${chatId}`, data),
  reactToMessage: (messageId, emoji) =>
    api.post(`/messages/react/${messageId}`, { emoji }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// ════════════════════════════════════════════════════════════
// PULSE ROOMS
// ════════════════════════════════════════════════════════════
export const roomAPI = {
  getPublicRooms: () => api.get("/rooms"),
  createRoom: (data) => api.post("/rooms", data),
  joinRoom: (roomId) => api.post(`/rooms/${roomId}/join`),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
};

// ════════════════════════════════════════════════════════════
// AI
// ════════════════════════════════════════════════════════════
export const aiAPI = {
  getSmartReplies: (chatId, lastMessageId) =>
    api.post("/ai/smart-replies", { chatId, lastMessageId }),
};

export default api;
