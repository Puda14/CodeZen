"use client";

import { io } from "socket.io-client";
import Cookies from "js-cookie";

const URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

const token = Cookies.get("token");

export const socket = io(URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  transports: ["websocket", "polling"],
  auth: { token },
});
