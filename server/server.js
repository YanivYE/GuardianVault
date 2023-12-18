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

let sharedSecret = null;

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
  console.log('Exchanging keys');

  // Create ECDH instance and generate keys
  const serverDH = crypto.createECDH('prime256v1');
  serverDH.generateKeys();

  // Get the server's public key as a base64-encoded string
  const serverPublicKeyBase64 = serverDH.getPublicKey('base64');

  console.log('sent key to client', serverPublicKeyBase64);
  // Send serverPublicKeyBase64 and serverSignatureBase64 to the client
  socket.emit('server-public-key', serverPublicKeyBase64);

  socket.on('client-public-key', (clientPublicKeyBase64) => {

    // Compute shared secret
    sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
    console.log("Shared Secret", sharedSecret); // hex type

    // You can use the sharedSecret for encryption or derive keys from it.
    const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'hex').digest();
    // Use derived keys for encryption
    socket.aesGcmKey = keyMaterial.slice(0, 32);  // AES-GCM key (first 32 bytes)
    
    // Use derived keys for integrity
    socket.integrityKey = keyMaterial.slice(32, 64);  // HMAC key (next 32 bytes)
    
    console.log('AES-GCM Key:', socket.aesGcmKey);
    console.log('Integrity Key:', socket.integrityKey);
  });
}

function encryptWithAESGCM(text) 
{
  // Generate a random IV (Initialization Vector)
  const iv = crypto.randomBytes(12);

  // Create the AES-GCM cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', socket.aesGcmKey, iv);

  // Update the cipher with the plaintext
  const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  // Get the authentication tag
  const tag = cipher.getAuthTag();

  // Return the IV, ciphertext, and authentication tag
  return { iv, ciphertext: encryptedBuffer, tag };
}

function decryptWithAESGCM(iv, ciphertext, tag) {
  // Create the AES-GCM decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', socket.aesGcmKey, iv);

  // Set the authentication tag
  decipher.setAuthTag(tag);

  // Update the decipher with the ciphertext
  const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Return the decrypted plaintext
  return decryptedBuffer.toString('utf8');
}

function sendMessageToClient(message) 
{
  const { iv, ciphertext, tag } = encryptWithAESGCM(message);
  const encryptedMessage = ciphertext.toString('hex');

  // Calculate HMAC for message integrity
  const hmac = crypto.createHmac('sha256', socket.integrityKey).update(encryptedMessage).digest('hex');

  // Send the encrypted message and HMAC to the client
  socket.emit('server-message', encryptedMessage, hmac);
}


function receiveMessageFromClient() 
{
  socket.on('client-message', (encryptedData, receivedHMAC) => {
    
    const decryptedText = decryptWithAESGCM(iv, ciphertext, tag);
    // Verify the integrity of the received message using HMAC
    const computedHMAC = crypto.createHmac('sha256', socket.integrityKey).update(decryptedText).digest('hex');
    
    // Verify the integrity of the received message using HMAC
    if (computedHMAC === receivedHMAC) {
      console.log('Message integrity verified. Decrypted data:', decryptedText.toString());
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

  const msgToClient = 'Hello, client!';
  sendMessageToClient(msgToClient);
  receiveMessageFromClient();


  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
  }

function startServer() {
  serveStaticFiles();
  serveClientPage();

  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });

  socket.on('connection', handleSocketConnection);
}

startServer();

