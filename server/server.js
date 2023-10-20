const LOCAL_IP = 'localhost';
const PORT = 8201;

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let publicKey;
let privateKey;

function generateRSAKeyPair() {
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  publicKey = keyPair.publicKey;
  privateKey = keyPair.privateKey;
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
  const dh = crypto.createDiffieHellman(256);
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
  const decipher = crypto.createDecipheriv('aes-256-cbc', sharedSecret, Buffer.from('0123456789abcdef0'));
  return Buffer.concat([decipher.update(data, 'base64', 'utf8'), decipher.final()]);
}

function handleSocketConnection(socket) {
  console.log('A user connected');
  socket.emit('public-key', publicKey);

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
