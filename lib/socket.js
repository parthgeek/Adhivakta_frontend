// lib/socket.js
import { io } from "socket.io-client";

export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    if (!token || token === "undefined" || token === "null") return false;
    if (!userData || userData === "undefined" || userData === "null")
      return false;
    try {
      JSON.parse(userData);
    } catch (e) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const getAuthData = () => {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("auth_token");
    const userDataStr = localStorage.getItem("user");
    if (!token || token === "undefined" || token === "null") return null;
    if (!userDataStr || userDataStr === "undefined" || userDataStr === "null")
      return null;
    const userData = JSON.parse(userDataStr);
    if (!userData || !userData.id || !userData.email) return null;
    return { token, userData };
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
};

export const initSocket = (token) => {
  if (typeof window === "undefined") return null;
  // use env var or default
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
  const socket = io(url, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  });

  return socket;
};
