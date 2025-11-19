import { io } from "socket.io-client";

let socket = null;

export function initSocket(token) {
  if (socket) return socket;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const wsUrl = base.replace(/^http/, "ws");
  socket = io(wsUrl, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        socket.emit("identify", { userId: u.id });
      } catch {}
    }
  });

  socket.onAny((ev, ...args) => {
    // optional debug: console.debug('SOCKET', ev, args);
  });

  return socket;
}

export function getSocket() {
  return socket;
}
