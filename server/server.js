// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Store room data
const rooms = {};

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (data) => {
        const { roomId, userId } = data;
        socket.join(roomId);
        console.log(`User joined room ${userId}`);
        socket.emit("userJoined", { success: true });

        // Get the number of users in the room and emit it to the client
        const room = io.sockets.adapter.rooms.get(roomId);
        const numUsers = room ? room.size : 0;
        io.to(roomId).emit('userCount', numUsers);

        // Emit canvas state request to the client who just joined the room
        socket.emit('getCanvasState', { roomId, userId });

        console.log(`${numUsers} users are now connected`);
    });

    socket.on('leaveRoom', (data) => {
        const { roomId, userId } = data;
        socket.leave(roomId);
        console.log(`User left room: ${roomId}`);
        socket.emit('userLeft', { success: true });

        // Get the number of users in the room and emit it to the client
        const room = io.sockets.adapter.rooms.get(roomId);
        const numUsers = room ? room.size : 0;
        io.to(roomId).emit('userCount', numUsers);

        console.log(`${numUsers} users are now connected`);
    });

    // Event handler to receive canvas state from the client
    socket.on('canvasState', (data) => {
        const { roomId, userId, state } = data;
        console.log('Received canvas state');

        // Broadcast the received canvas state to all other users in the room
        socket.to(roomId).emit('canvasStateFromServer', { userId, state });
    });

    // Event handler to handle client-ready event
    socket.on('clientReady', () => {
        socket.broadcast.emit('getCanvasState');
    });

    // Handle drawing events
    socket.on('startDrawing', (data) => {
        io.to(data.roomId).emit('startDrawing', data);
    });

    socket.on('draw', (data) => {
        io.to(data.roomId).emit('draw', data);
    });

    socket.on('endDrawing', (data) => {
        io.to(data.roomId).emit('endDrawing', data);
    });

    // Handle undo/redo events
    socket.on('undo', (data) => {
        io.to(data.roomId).emit('undo', data);
    });

    socket.on('redo', (data) => {
        io.to(data.roomId).emit('redo', data);
    });

    // Handle clear event
    socket.on('clear', (data) => {
        io.to(data.roomId).emit('clear', data);
    });

    // Handle erase mode toggle event
    socket.on('toggleEraseMode', (data) => {
        io.to(data.roomId).emit('toggleEraseMode', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});