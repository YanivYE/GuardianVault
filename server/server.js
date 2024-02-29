const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const config = require('./Config');
const Handler = require('./SocketHandler');

// create app & server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);

// Serve static files
function serveStaticFiles() {
  const staticPaths = [
    '../client/signup',
    '../client/login',
    '../client/forgot-password',
    '../client/code-verification',
    '../client/reset-password',
    '../client/upload',
    '../client/download',
    '../client/menu',
    '../client/index',
    '../client'
  ];

  staticPaths.forEach(staticPath => {
    const fullPath = path.join(__dirname, staticPath);
    app.use(express.static(fullPath));
  });
}

function serveClientPage() {
  app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../client/index/index.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, '../client/login/login.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/signup', (req, res) => {
    const filePath = path.join(__dirname, '../client/signup/signup.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/upload', (req, res) => {
    const filePath = path.join(__dirname, '../client/upload/upload.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, '../client/download/download.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/menu', (req, res) => {
    const filePath = path.join(__dirname, '../client/menu/menu.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/forgot-password', (req, res) => {
    const filePath = path.join(__dirname, '../client/forgot-password/forgot-password.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/code-verification', (req, res) => {
    const filePath = path.join(__dirname, '../client/code-verification/code-verification.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.get('/reset-password', (req, res) => {
    const filePath = path.join(__dirname, '../client/reset-password/reset-password.html');
    res.setHeader('Content-Type', 'text/html');
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
    console.log('User connected');
    const socketHandler = new Handler.SocketHandler(socket);
    
    socketHandler.handleClientConnection();
  });
}

startServer();
