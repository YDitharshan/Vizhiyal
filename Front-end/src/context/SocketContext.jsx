// context/SocketContext.jsx
// Manages one Socket.io connection for the lifetime of the logged-in session.
// The socket is created when auth becomes non-null and destroyed on logout.
// All chat pages consume this via useSocket().

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

// Strip "/api" suffix from the API URL to get the socket server origin
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

export function SocketProvider({ children }) {
  const { auth } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!auth) return; // not logged in — no socket needed

    const token = localStorage.getItem("vizhiyal_token");
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth:              { token },
      // Start with polling so React StrictMode's double-effect cleanup
      // doesn't produce "WebSocket closed before connection established".
      // Socket.io upgrades to WebSocket automatically once the handshake is stable.
      transports:        ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on("connect",       () => console.log("🔌 Socket connected"));
    s.on("disconnect",    () => console.log("🔌 Socket disconnected"));
    s.on("connect_error", (e) => console.warn("Socket error:", e.message));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [auth?.id]); // reconnect when user identity changes

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
