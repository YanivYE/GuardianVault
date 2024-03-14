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

const clientPages = [
    { route: '/', file: 'index.html' },
    { route: '/login', file: 'login.html' },
    { route: '/signup', file: 'signup.html' },
    { route: '/upload', file: 'upload.html' },
    { route: '/download', file: 'download.html' },
    { route: '/menu', file: 'menu.html' },
    { route: '/forgotPassword', file: 'forgotPassword.html' },
    { route: '/codeVerification', file: 'codeVerification.html' },
    { route: '/resetPassword', file: 'resetPassword.html' }
];

// Serve client page - SPA
clientPages.forEach(({ route, file }) => {
app.get(route, (req, res) => {
        if(route === '/')
        {
            const filePath = path.resolve(__dirname, `../frontend`, file);
            res.setHeader('Content-Type', 'text/html');
            res.sendFile(filePath);
        }
        else{
            const filePath = path.join(__dirname, `clientPages/${file}`);
            res.setHeader('Content-Type', 'text/html');
            res.sendFile(filePath);
        }
    }); 
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



