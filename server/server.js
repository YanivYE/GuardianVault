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
let aesGcmKey = null;
let integrityKey = null;

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
  return new Promise((resolve, reject) => {
    console.log('Exchanging keys');

    const serverDH = crypto.createECDH('prime256v1');
    serverDH.generateKeys();

    const serverPublicKeyBase64 = serverDH.getPublicKey('base64');

    console.log('sent key to client', serverPublicKeyBase64);
    socket.emit('server-public-key', serverPublicKeyBase64);

    socket.on('client-public-key', async (clientPublicKeyBase64) => {
      try {
        sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
        console.log("Shared Secret", sharedSecret); // hex type

        // Derive keyMaterial using SHA-256
        const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'utf-8').digest();

        // Use PBKDF2 to derive keys for AES-GCM and integrity with different salts
        const saltAesGcm = crypto.randomBytes(16);
        const saltIntegrity = crypto.randomBytes(16);
        const iterations = 100000; // Adjust the number of iterations as needed

        aesGcmKey = crypto.pbkdf2Sync(keyMaterial, saltAesGcm, iterations, 32, 'sha256');
        integrityKey = crypto.pbkdf2Sync(keyMaterial, saltIntegrity, iterations, 32, 'sha256');

        console.log('aesGcmKey:', aesGcmKey.toString('hex'));
        console.log('integrityKey:', integrityKey.toString('hex'));

        resolve(); // Resolve the promise once key exchange is complete
      } catch (err) {
        reject(err); // Reject the promise if any error occurs
      }
    });
  });
}

function encryptWithAESGCM(text) 
{
  // Generate a random IV (Initialization Vector)
  const iv = crypto.randomBytes(12);

  // Create the AES-GCM cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', aesGcmKey, iv);

  // Update the cipher with the plaintext
  const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  // Get the authentication tag
  const tag = cipher.getAuthTag();

  // Return the IV, ciphertext, and authentication tag
  return { iv, ciphertext: encryptedBuffer, tag };
}

function decryptWithAESGCM(iv, ciphertext, tag) {
  // Create the AES-GCM decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesGcmKey, iv);

  // Set the authentication tag
  decipher.setAuthTag(tag);

  // Update the decipher with the ciphertext
  const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Return the decrypted plaintext
  return decryptedBuffer.toString('utf8');
}

async function sendMessageToClient(message) {
  const { iv, ciphertext, tag } = encryptWithAESGCM(message);
  const encryptedMessage = ciphertext.toString('hex');

  const hmac = crypto.createHmac('sha256', integrityKey).update(encryptedMessage).digest('hex');

  socket.emit('server-message', encryptedMessage, hmac);
}


function receiveMessageFromClient() {
  socket.on('client-message', async (encryptedData, receivedHMAC) => {
    console.log("received:", encryptedData);
    const decryptedText = decryptWithAESGCM(iv, ciphertext, tag);

    const computedHMAC = crypto.createHmac('sha256', integrityKey).update(decryptedText).digest('hex');

    if (computedHMAC === receivedHMAC) {
      console.log('Message integrity verified. Decrypted data:', decryptedText.toString());
      // Process the decrypted and authenticated data
    } else {
      console.log('Message integrity check failed. Discarding message.');
      // Handle the case where the message may have been tampered with
    }
  });
}


async function handleSocketConnection(socket) {
  console.log('A user connected');

  await performKeyExchange(socket);

  const msgToClient = 'Hello, client!';

  await sendMessageToClient(msgToClient);
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

