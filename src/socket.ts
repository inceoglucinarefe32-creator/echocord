import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      auth: { token: localStorage.getItem('ec_token') },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token: string) {
  if (socket) socket.disconnect();
  socket = io(SERVER_URL, {
    auth: { token },
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
