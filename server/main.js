const LOCAL_IP = '10.100.102.15';

const express = require('express');
const https = require('https'); // Use https module
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();

// Read your SSL certificate and private key files
const privateKey = fs.readFileSync("C:\\Users\\magshimim\\Desktop\\Magshimim\\final project\\guardianvault\\server\\key.pem", 'utf8');
const certificate = fs.readFileSync("C:\\Users\\magshimim\\Desktop\\Magshimim\\final project\\guardianvault\\server\\cert.pem", 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app); // Create an HTTPS server
const io = socketIo(httpsServer);

app.use(express.static(__dirname));

// Serve the client.html file at a custom route, e.g., '/chat'
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/client.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (message) => {
    io.emit('message', message); // Broadcast the message to all connected clients
    console.log('User said: ' + message);
  });

  // Send a welcome message to the connected client
  socket.emit('message', 'Welcome to the chat!');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const yourLANIP = LOCAL_IP;
const port = 8201;

httpsServer.listen(port, yourLANIP, () => {
  console.log(`Server is running on https://${yourLANIP}:${port}`);
});
