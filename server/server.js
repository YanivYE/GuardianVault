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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function serveStaticFiles() {
  const loginStaticPath = path.join(__dirname, '../client/login');

  app.use(express.static(loginStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  const fileUploadStaticPath = path.join(__dirname, '../client/fileUpload');

  app.use(express.static(fileUploadStaticPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
}

function serveClientPage() {
  app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../client/login/login.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  // app.get('/login', (req, res) => {
  //   const filePath = path.join(__dirname, '../client/login/login.html');
  //   res.setHeader('Content-Type', 'text/html');
  //   res.sendFile(filePath);
  // });

  app.post('/', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    try {
  
      if (true) {
        res.redirect('/fileUpload.html'); 
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.redirect('/login');
    }
  });

  app.get('/fileUpload', (req, res) => {
    const filePath = path.join(__dirname, '../client/fileUpload/fileUpload.html');
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

