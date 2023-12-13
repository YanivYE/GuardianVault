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

  // Sign the server's public key
  const serverPrivateKey = serverDH.getPrivateKey();
  const privateKey = crypto.createPrivateKey({
    key: serverPrivateKey,
    format: 'pem',
    type: 'pkcs8' // or 'pkcs8' based on the actual format of your key
  });
  
  // Export the private key in PEM format
  const privateKeyPEM = crypto.export({
    type: 'pkcs8', // or 'pkcs8' based on the actual format of your key
    format: 'pem',
    key: privateKey
  });

  const serverPublicKeyBuffer = Buffer.from(serverPublicKeyBase64, 'base64');

  // Create a signature
  const sign = crypto.createSign('sha256');
  sign.update(serverPublicKeyBuffer);
  const serverSignature = sign.sign(privateKeyPEM, 'hex'); 
  const serverSignatureBase64 = serverSignature.toString('base64');

  console.log('sent key to client', serverPublicKeyBase64, 'with signature', serverSignatureBase64);
  // Send serverPublicKeyBase64 and serverSignatureBase64 to the client
  socket.emit('server-public-key', serverPublicKeyBase64, serverSignatureBase64);

  socket.on('client-public-key', (clientPublicKeyBase64, clientSignatureBase64) => {
    // Verify the client's signature
    const clientPublicKeyBuffer = Buffer.from(clientPublicKeyBase64, 'base64');
    const clientSignatureBuffer = Buffer.from(clientSignatureBase64, 'base64');
    const verify = crypto.createVerify('sha256');
    verify.update(clientPublicKeyBuffer);
    const isSignatureValid = verify.verify(serverPublicKeyBuffer, clientSignatureBuffer);

    if (isSignatureValid) {
      console.log('Client signature is valid.');

      // Compute shared secret
      sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
      console.log("Shared Secret", sharedSecret);

      // You can use the sharedSecret for encryption or derive keys from it.
      const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'hex').digest();
      console.log('key material: ', keyMaterial);

      // Use derived keys for encryption or integrity
      socket.encryptionKey = keyMaterial.slice(0, 16);  // For example, use the first 16 bytes as an encryption key
      socket.integrityKey = keyMaterial.slice(16, 32);
    } else {
      console.log('Client signature is not valid. Abort key exchange.');
    }
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
  const decryptedData = Buffer.concat([decipher.update(message, 'hex'), decipher.final()]);
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

  socket.on('connection', handleSocketConnection);
}

startServer();

