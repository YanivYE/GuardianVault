LOCAL_IP = '192.168.1.109'


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

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

server.listen(port, yourLANIP, () => {
  console.log(`Server is running on http://${yourLANIP}:${port}`);
});