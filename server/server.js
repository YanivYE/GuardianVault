LOCAL_IP = '10.100.102.15' // yaniv = 10.100.102.15
PORT = 8201


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();

const server = http.createServer(app);
const io = socketIo(server);


function serveStaticFiles() {
  app.use(express.static(__dirname));
}

// Serve the client.html file 
function serveClientPage() {
  app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../client/client.html');
    res.sendFile(filePath);
  });
}

function handleSocketConnection(socket) {
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
}

function generateRSAKeys(){
  // Generate an RSA key pair for the server
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Save the private key securely and provide the public key to the client
fs.writeFileSync('server-private-key.pem', privateKey, 'utf8');
const serverPublicKey = publicKey;
}


function startServer() {
  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });
}


serveStaticFiles();
serveClientPage();
io.on('connection', handleSocketConnection);
startServer();