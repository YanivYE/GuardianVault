// server fields
const LOCAL_IP = 'localhost';
const PORT = 8201;

// import libraries 
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');

const fs = require('fs');

const Encrypt = require('./Encrypt');
const Decrypt = require('./Decrypt');

// create app & server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);

let publicKey;
let privateKey;

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

// Generate RSA keys for encryption
function generateRSAKeyPair() {
  publicKey = fs.readFileSync('public.pem', 'utf-8');
  privateKey = fs.readFileSync('private.pem', 'utf-8');
}

// function performKeyExchange(socket, clientPublicKey) {
//   const dh = crypto.createDiffieHellman(2048);
//   dh.generateKeys(); // Generate the private key
//   const sharedSecret = dh.computeSecret(clientPublicKey);
//   return {
//     dh,
//     sharedSecret,
//   };
// }

// function encryptWithSharedSecret(sharedSecret, data) {
//   const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, Buffer.from('0123456789abcdef0'));
//   return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
// }

// function decryptWithSharedSecret(sharedSecret, data) {
//   const iv = Buffer.from('0123456789abcdef0', 'hex'); // Convert the IV from hex to a buffer
//   const decipher = crypto.createDecipheriv('aes-256-cbc', sharedSecret, iv);
//   return Buffer.concat([decipher.update(data, 'base64', 'utf8'), decipher.final()]);
// }

function exchangePublicKeys()
{
  console.log('server public key sent: ', publicKey);
  socket.emit('server-public-key', publicKey); 
  socket.on('client-public-key', (clientPublicKey) => {
    console.log('client public key receivrd: ', clientPublicKey);
    return clientPublicKey;
  });
}


function handleSocketConnection(socket) {
  console.log('A user connected');
  clientPublicKey = exchangePublicKeys();
  console.log('client public key receivrd: ', clientPublicKey);
  // const encryptData = new Encrypt(clientPublicKey);
  // const decryptData = new Decrypt(privateKey);

  const originalData = 'Hello, client!';
  //const encryptedData = encryptData.encrypt(originalData);
  console.log('Encrypted:', originalData);
  socket.emit('server-message', originalData);
  socket.on('client-message', (clientData) =>{
    // const decryptedData = decryptData.decrypt(clientData);
    console.log("Decrypted: ", clientData);
  });

//   socket.on('exchange-keys', (data) => {
//     const { dh, sharedSecret } = performKeyExchange(socket, Buffer.from(data.clientPublicKey, 'base64'));

//     socket.on('client-message', (encryptedData) => {
//       const decryptedData = decryptWithSharedSecret(sharedSecret, encryptedData);
//       console.log('Received and decrypted data:', decryptedData.toString());

//       const response = 'Message from Server to Client';
//       const encryptedResponse = crypto.publicEncrypt({
//         key: Buffer.from(data.clientPublicKey, 'base64'),
//         padding: crypto.constants.RSA_PKCS1_PADDING,
//       }, Buffer.from(response, 'utf8'));

//       socket.emit('server-message', encryptedResponse.toString('base64'));
//     });

//     // Send a welcome message to the connected client
//     socket.emit('message', 'Welcome to the chat!');
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
}

function startServer() {
  serveStaticFiles();
  serveClientPage();
  generateRSAKeyPair();

  server.listen(PORT, LOCAL_IP, () => {
    console.log(`Server is running on http://${LOCAL_IP}:${PORT}`);
  });
}
// generateRSAKeyPair();
// const encryptData = new Encrypt(publicKey);
// const decryptData = new Decrypt(privateKey);
// const originalData = 'Hello, World!';
// const encryptedData = encryptData.encrypt(originalData);
// console.log('Encrypted:', encryptedData);

// const decryptedData = decryptData.decrypt(encryptedData);
// console.log("Decrypted: ", decryptedData);
startServer();
socket.on('connection', handleSocketConnection);
