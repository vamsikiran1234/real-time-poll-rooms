import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinPoll', (pollId: string) => {
      if (!pollId) {
        socket.emit('error', { message: 'Poll ID is required' });
        return;
      }

      socket.join(`poll:${pollId}`);
      console.log(`Client ${socket.id} joined poll room: ${pollId}`);
      
      socket.emit('joinedPoll', { pollId });
    });

    socket.on('leavePoll', (pollId: string) => {
      if (!pollId) {
        return;
      }

      socket.leave(`poll:${pollId}`);
      console.log(`Client ${socket.id} left poll room: ${pollId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
