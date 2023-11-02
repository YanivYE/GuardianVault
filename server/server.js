// server fields
const LOCAL_IP = 'localhost';
const PORT = 8201;

// libraries import
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');

// create app & server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let publicKey;
let privateKey;

// Generate RSA keys for encryption
function generateRSAKeyPair() {
  const key = new NodeRSA({ b: 2048 }); // Create a new RSA key pair
  publicKey = key.exportKey('public'); // Get the public key 
  privateKey = key.exportKey('private'); // Get the private key 
}

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

function performKeyExchange(socket, clientPublicKey) {
  const dh = crypto.createDiffieHellman(2048);
  dh.generateKeys(); // Generate the private key
  const sharedSecret = dh.computeSecret(clientPublicKey);
  return {
    dh,
    sharedSecret,
  };
}

function encryptWithSharedSecret(sharedSecret, data) {
  const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, Buffer.from('0123456789abcdef0'));
  return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
}

function decryptWithSharedSecret(sharedSecret, data) {
  const iv = Buffer.from('0123456789abcdef0', 'hex'); // Convert the IV from hex to a buffer
  const decipher = crypto.createDecipheriv('aes-256-cbc', sharedSecret, iv);
  return Buffer.concat([decipher.update(data, 'base64', 'utf8'), decipher.final()]);
}


function handleSocketConnection(socket) {
  console.log('A user connected');
  socket.emit('public-key', publicKey); 
  console.log(publicKey);

  socket.on('exchange-keys', (data) => {
    const { dh, sharedSecret } = performKeyExchange(socket, Buffer.from(data.clientPublicKey, 'base64'));

    socket.on('client-message', (encryptedData) => {
      const decryptedData = decryptWithSharedSecret(sharedSecret, encryptedData);
      console.log('Received and decrypted data:', decryptedData.toString());

      const response = 'Message from Server to Client';
      const encryptedResponse = crypto.publicEncrypt({
        key: Buffer.from(data.clientPublicKey, 'base64'),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, Buffer.from(response, 'utf8'));

      socket.emit('server-message', encryptedResponse.toString('base64'));
    });

    // Send a welcome message to the connected client
    socket.emit('message', 'Welcome to the chat!');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
}

function startServer() {
  serveStaticFiles();
  serveClientPage();
  generateRSAKeyPair();

  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });
}

startServer();
io.on('connection', handleSocketConnection);
