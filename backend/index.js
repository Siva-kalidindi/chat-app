const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

// In-memory storage
const roomUsers = new Map();     // roomId -> [ { id, userName } ]
const roomMessages = new Map();  // roomId -> [ { sender, text, timestamp } ]
const roomLeaders = new Map();   // roomId -> socket.id

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // CREATE ROOM
    socket.on('create-room', ({ roomId, userName }) => {
        if (roomUsers.has(roomId)) {
            socket.emit('room-exists', roomId);
            return;
        }

        socket.join(roomId);
        roomUsers.set(roomId, [{ id: socket.id, userName }]);
        roomMessages.set(roomId, []);
        roomLeaders.set(roomId, socket.id);

        console.log(`Room created: ${roomId} by ${userName}`);
        socket.emit('room-created', roomId);
    });

    // JOIN ROOM
    socket.on('join-room', ({ roomId, userName }) => {
        const users = roomUsers.get(roomId);

        if (!users) {
            socket.emit('room-join-error', 'Room not found');
            return;
        }

        socket.join(roomId);
        users.push({ id: socket.id, userName });
        roomUsers.set(roomId, users);

        // Notify others in the room
        io.to(roomId).emit('user-joined', { userName, users });

        const messages = roomMessages.get(roomId) || [];
        socket.emit('room-joined', { roomId, users, messages });

        console.log(`${userName} joined room: ${roomId}`);
    });

    // SEND MESSAGE
    socket.on('send-message', ({ roomId, message, sender }) => {
        const msg = {
            sender,
            text: message,
            timestamp: new Date()
        };

        const history = roomMessages.get(roomId);
        if (history) {
            history.push(msg);
            io.to(roomId).emit('message', msg);
        }
    });

    // DISCONNECT HANDLER (FIXED)
    socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected:', socket.id);

        // Find the room(s) this socket was in
        for (const [roomId, users] of roomUsers.entries()) {
            const user = users.find(u => u.id === socket.id);
            if (user) {
                // If leader left, notify others and clean up
                if (roomLeaders.get(roomId) === socket.id) {
                    io.to(roomId).emit('leader-left');
                    roomUsers.delete(roomId);
                    roomMessages.delete(roomId);
                    roomLeaders.delete(roomId);
                } else {
                    // Remove user from room
                    roomUsers.set(roomId, users.filter(u => u.id !== socket.id));
                    io.to(roomId).emit('user-joined', { users: roomUsers.get(roomId) });
                }
            }
        }
    });
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
