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
const staticPaths = [
    'signup',
    'login',
    'forgot-password',
    'code-verification',
    'reset-password',
    'upload',
    'download',
    'menu',
    'index',
    ''
];

staticPaths.forEach(staticPath => {
    app.use(express.static(path.join(__dirname, `../client/${staticPath}`)));
});

// Serve client pages
const clientPages = [
    { route: '/', file: 'index/index.html' },
    { route: '/login', file: 'login/login.html' },
    { route: '/signup', file: 'signup/signup.html' },
    { route: '/upload', file: 'upload/upload.html' },
    { route: '/download', file: 'download/download.html' },
    { route: '/menu', file: 'menu/menu.html' },
    { route: '/forgot-password', file: 'forgot-password/forgot-password.html' },
    { route: '/code-verification', file: 'code-verification/code-verification.html' },
    { route: '/reset-password', file: 'reset-password/reset-password.html' }
];

clientPages.forEach(({ route, file }) => {
    app.get(route, (req, res) => {
        const filePath = path.join(__dirname, `../client/${file}`);
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(filePath);
    });
});

// Start server
function startServer() {
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
}

startServer();
