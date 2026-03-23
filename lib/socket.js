// lib/socket.js
import { io } from "socket.io-client";

const DEFAULT_API_URL = "http://localhost:5050/api";
const DEFAULT_SOCKET_URL = "http://localhost:5050";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

export const getSocketUrl = () => {
  const explicitSocketUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_SOCKET_URL || ""
  );

  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  const apiUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  );

  if (!apiUrl) {
    return DEFAULT_SOCKET_URL;
  }

  return trimTrailingSlash(apiUrl.replace(/\/api\/?$/, "")) || DEFAULT_SOCKET_URL;
};

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
  const url = getSocketUrl();
  const authToken = token || localStorage.getItem("auth_token");

  const socket = io(url, {
    auth: { token: authToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
    upgrade: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  return socket;
};
