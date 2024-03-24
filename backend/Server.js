const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const config = require('./config');
const Handler = require('./SocketHandler');
const Utils = require('./Utils');

// create app & server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use("/static", express.static(path.resolve(__dirname, "../frontend", "static")));

// Server index page
app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname, `../frontend`, 'index.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
});

// Start server
server.on('error', (error) => {
    console.error('Server error:', error.message);
});

server.listen(config.PORT, config.LOCAL_IP, () => {
    console.log(`Server is running on http://${config.LOCAL_IP}:${config.PORT}`);
});

io.on('connection', (socket) => {
    const userId = Utils.generateUniqueUserId();
    console.log(`User ${userId} connected`);
    const socketHandler = new Handler.SocketHandler(socket);
    socketHandler.handleClientConnection();
    socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
    });
});
