// server fields
const LOCAL_IP = 'localhost';
const PORT = 8201;

// import libraries 
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');

// create app & server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);

let serverDH;

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

  app.get('/client.js', (req, res) => {
    const filePath = path.join(__dirname, '../client/client.js');
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(filePath);
  });
} 

function performKeyExchange(socket) {
  console.log('exchanging keys');
  serverDH = crypto.createDiffieHellman(2048);
  serverDH.generateKeys();
  console.log('send key to client', serverDH.getPublicKey());
  socket.emit('server-public-key', serverDH.getPublicKey());
  socket.on('client-public-key', (clientPublicKey) => {
    console.log('got client key:', clientPublicKey);
    const sharedSecret = serverDH.computeSecret(clientPublicKey, 'hex', 'hex');
    // You can use the sharedSecret for encryption or derive keys from it.

    const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'hex').digest();
    
    // Use derived keys for encryption or integrity
    socket.encryptionKey = keyMaterial.slice(0, 16);  // For example, use the first 16 bytes as an encryption key
    socket.integrityKey = keyMaterial.slice(16, 32); 
  });
}

function encryptUsingEncryptionKey(message)
{
  // Encrypt the message using the derived encryption key
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(socket.encryptionKey), Buffer.alloc(16, 0));
  const encryptedMessage = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  return encryptedMessage;
}

function decryptUsingEncryptionKey(message)
{
  // Decrypt the data using the derived encryption key
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(socket.encryptionKey), Buffer.alloc(16, 0));
  const decryptedData = Buffer.concat([decipher.update(encryptedData, 'hex'), decipher.final()]);
  return decryptedData;
}

function sendMessageToClient(message) 
{
  const encryptedMessage = encryptUsingEncryptionKey(message);

  // Calculate HMAC for message integrity
  const hmac = crypto.createHmac('sha256', socket.integrityKey).update(encryptedMessage).digest('hex');

  // Send the encrypted message and HMAC to the client
  socket.emit('server-message', encryptedMessage.toString('hex'), hmac);
}

function receiveMessageFromClient() 
{
  socket.on('client-message', (encryptedData, receivedHMAC) => {
    
    const decryptedData = decryptUsingEncryptionKey(encryptedData);
    // Verify the integrity of the received message using HMAC
    const computedHMAC = crypto.createHmac('sha256', socket.integrityKey).update(decryptedData).digest('hex');
    
    if (computedHMAC === receivedHMAC) {
      console.log('Message integrity verified. Decrypted data:', decryptedData.toString());
      // Process the decrypted and authenticated data
    } else {
      console.log('Message integrity check failed. Discarding message.');
      // Handle the case where the message may have been tampered with
    }
  });
}


function handleSocketConnection(socket) {
  console.log('A user connected');
  performKeyExchange(socket);

//   const msgToClient = 'Hello, client!';
//   sendMessageToClient(msgToClient);
//   receiveMessageFromClient();


//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
  }

function startServer() {
  serveStaticFiles();
  serveClientPage();

  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });
}

startServer();
socket.on('connection', handleSocketConnection);
