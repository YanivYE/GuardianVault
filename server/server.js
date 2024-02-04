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

  const fileUploadStaticPath = path.join(__dirname, '../client/upload');

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
    // const filePath = path.join(__dirname, '../client/login/login.html');
    // res.setHeader('Content-Type', 'text/html');
    // res.sendFile(filePath);
    res.redirect('/login');
  });

  app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, '../client/login/login.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    try {
      // DB validation
      if (true) {
        res.redirect('/upload.html'); 
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.redirect('/login');
    }
  });

  app.get('/signup', (req, res) => {
    const filePath = path.join(__dirname, '../client/signup/signup.html');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
  });

  app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(username, email, password);
    try {
  
      if (true) {
        res.redirect('/upload.html'); 
      } else {
        res.redirect('/signup');
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.redirect('/login');
    }
  });


  app.get('/upload', (req, res) => {
    const filePath = path.join(__dirname, '../client/upload/upload.html');
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

