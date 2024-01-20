const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const config = require('./config');
const Handler = require('./SocketHandler');

// create app & server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);

function serveStaticFiles() {
  app.use(express.static(__dirname));
}

function serveClientPage() {
  app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../client/client.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/client.js', (req, res) => {
    const filePath = path.join(__dirname, '../client/client.js');
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(filePath);
  });
}

function startServer() {
  serveStaticFiles();
  serveClientPage();

  server.on('error', (error) => {
    console.error('Server error:', error.message);
  });
  
  server.listen(config.PORT, config.LOCAL_IP, () => {
    console.log(`Server is running on http://${config.LOCAL_IP}:${config.PORT}`);
  });

  socket.on('connection', (socket) => {
    const socketHandler = new Handler.SocketHandler(socket);
    socketHandler.handleSocketConnection();
  });
}

startServer();

