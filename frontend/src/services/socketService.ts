import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL not set for Socket.io, using fallback:', SOCKET_URL);
}

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};

export const joinPollRoom = (pollId: string): void => {
  if (socket) {
    socket.emit('joinPoll', pollId);
    console.log(`📡 Joined poll room: ${pollId}`);
  }
};

export const leavePollRoom = (pollId: string): void => {
  if (socket) {
    socket.emit('leavePoll', pollId);
    console.log(`🚪 Left poll room: ${pollId}`);
  }
};

export const onPollUpdate = (callback: (updatedPoll: any) => void): void => {
  if (socket) {
    socket.on('pollUpdate', callback);
  }
};

export const offPollUpdate = (): void => {
  if (socket) {
    socket.off('pollUpdate');
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
