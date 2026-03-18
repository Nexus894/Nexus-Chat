/**
 * Socket.io client singleton
 * Import socket anywhere in the app — always the same instance
 */

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("nexus_token");
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: false, // Connect manually after login
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  if (token) s.auth = { token };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};
