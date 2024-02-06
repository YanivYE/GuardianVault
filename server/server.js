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

  const signUpStaticPath = path.join(__dirname, '../client/signup');

  app.use(express.static(signUpStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  const loginStaticPath = path.join(__dirname, '../client/login');

  app.use(express.static(loginStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  const uploadStaticPath = path.join(__dirname, '../client/upload');

  app.use(express.static(uploadStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  const menuStaticPath = path.join(__dirname, '../client/menu');

  app.use(express.static(menuStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  const indexStaticPath = path.join(__dirname, '../client/home');

  app.use(express.static(indexStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
}

function serveClientPage() {
  app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../client/home/index.html');
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

  app.get('/menu', (req, res) => {
    const filePath = path.join(__dirname, '../client/menu/menu.html');
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
    const socketHandler = new Handler.SocketHandler(socket);
    socketHandler.handleSocketConnection();
  });
}

startServer();

