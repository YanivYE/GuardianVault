const LOCAL_IP = '10.100.102.15';
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
    res.sendFile(filePath);
  });
}

function handleSocketConnection(socket) {
  console.log('A user connected');

  socket.on('message', (encryptedMessage) => {
    console.log('User sent an encrypted message: ' + encryptedMessage);

    // Decrypt the received message
    const decryptedMessage = decrypt(encryptedMessage);
    console.log('Decrypted message: ' + decryptedMessage);

    // Broadcast the decrypted message to all connected clients
    io.emit('message', 'msg:' + decryptedMessage);
    io.emit('message', 'encrypted msg:' + encrypt(decryptedMessage));
  });

  // Send a welcome message to the connected client
  socket.emit('message', 'Welcome to the chat!');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
}

function decrypt(encryptedMessage) {
  if (!privateKey) {
    console.log('Private key is not available for decryption.');
    return '';
  }

  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase: '', // If your private key has a passphrase
    },
    Buffer.from(encryptedMessage, 'base64')
  );

  const decryptedMessage = decryptedBuffer.toString('utf8');
  return decryptedMessage;
}

function encrypt(msg) {
  if (!publicKey) {
    console.log('Public key is not available for encryption.');
    return '';
  }

  // Encrypt the data using the recipient's public key
  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(msg, 'utf8')
  );

  // Convert the encrypted buffer to a base64-encoded string
  const encryptedText = encryptedBuffer.toString('base64');
  return encryptedText;
}

function startServer() {
  generateRSAKeyPair();
  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });
}

serveStaticFiles();
serveClientPage();
io.on('connection', handleSocketConnection);
startServer();
