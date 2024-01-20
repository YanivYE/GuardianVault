// import libraries 
const { google } = require('googleapis');
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');

// server fields
const LOCAL_IP = 'localhost';
const PORT = 8201;

const CLIENT_ID = '1026189505165-i8g7sk21dj4hlpcnnaqq1s1c0dfbkuf2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//0482zJi2qJq4KCgYIARAAGAQSNwF-L9Irfij_xtILWYix04rSY_gkaD7SHlKpY0dUN-2OAr-4kPoUOgVqeY_xeHokHG2sjnI7U1c';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// create app & server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);

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

    console.log('sent key to client: ', serverPublicKeyBase64);
    socket.emit('server-public-key', serverPublicKeyBase64);

    socket.on('client-public-key', async (clientPublicKeyBase64) => {
      try {
        console.log('received key from client: ', clientPublicKeyBase64);
        const sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
        console.log("Computed Shared Secret: ", sharedSecret); 

        // Use PBKDF2 to derive keys for AES-GCM and integrity with different salts
        const salt = crypto.randomBytes(16);
        const iterations = 100000; // Adjust the number of iterations as needed

        console.log('server salt sent: ', salt.toString('hex'));

        // Derive keyMaterial using SHA-256
        //const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'hex').digest();
        const keyMaterial = crypto.pbkdf2Sync(sharedSecret, salt, iterations, 32, 'SHA-256');
        //console.log(keyMaterial);
        console.log('Key Material: ', keyMaterial.toString('hex'));

        // send salt to client
        
        socket.emit('salt', JSON.stringify({ type: 'salt', salt: salt.toString('hex') }));

        aesGcmKey = crypto.pbkdf2Sync(keyMaterial, '', 1, 32, 'sha256');
        integrityKey = crypto.pbkdf2Sync(keyMaterial, '', 1, 32, 'sha256');

        console.log('aesGcmKey:', aesGcmKey.toString('hex'));
        console.log('integrityKey:', integrityKey.toString('hex'));

        resolve(); // Resolve the promise once key exchange is complete
      } catch (err) {
        reject(err); // Reject the promise if any error occurs
      }
    });
  });
}

async function uploadFile(filePath) {
  try {
    // Get the file name
    const fileName = path.basename(filePath);

    // Determine the MIME type
    const mimeType = 'application/octet-stream'; // Default MIME type for unknown files

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      },
    });

    console.log('File uploaded:', response.data);
  } catch (error) {
    console.error('Error uploading file:', error.message);
  }
}

async function showFiles() {
  try {
    const response = await drive.files.list();
    const fileIds = response.data.files.map((file) => file.id);
    console.log('Files in Google Drive:', response.data.files);
    return fileIds;
  } catch (error) {
    console.error('Error listing files:', error.message);
    return [];
  }
}

function encryptWithAESGCM(text) 
{
  // Generate a random IV (Initialization Vector)
  const iv = crypto.randomBytes(12);

  // Create the AES-GCM cipher with a 16-byte authentication tag
  const cipher = crypto.createCipheriv('aes-256-gcm', aesGcmKey, iv, { authTagLength: 16 });

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

  console.log('Sent encrypted message to client: ', encryptedMessage, ' and hmac: ', hmac);
  socket.emit('server-message', iv, encryptedMessage, tag, hmac);
}


async function receiveMessageFromClient() {
  socket.on('client-message', async (encryptedMessage, receivedIV, receivedHMAC) => {
    console.log("Received encrypted message:", encryptedMessage);

    const decryptedText = decryptWithAESGCM(receivedIV, Buffer.from(encryptedMessage, 'hex'), receivedHMAC);

    const computedHMAC = crypto.createHmac('sha256', integrityKey).update(decryptedText).digest('hex');

    if (computedHMAC === receivedHMAC) {
      console.log('Message integrity verified. Decrypted data:', decryptedText);
    } else {
      console.log('Message integrity check failed. Discarding message.');
      // Handle the case where the message may have been tampered with
    }
  });
}



async function handleSocketConnection(socket) {
  console.log('A user connected');

  await performKeyExchange(socket);
  

  socket.on('send-file', async (fileInfo) => {
    const { fileName, data, iv, tag } = fileInfo;
  
    console.log("IV", iv);
    console.log('Got file from client:', fileName, '\n', 'data:', data);

    decryptWithAESGCM(iv,data, tag);

    if (data && typeof data === 'string') {
      // Save the file to the server script's directory
      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, Buffer.from(data.split(';base64,').pop(), 'base64'));
  
      console.log('File saved at:', filePath);

      await uploadFile(filePath);

      fileIds = await showFiles();
      console.log('File IDs in Google Drive:', fileIds);

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
        } else {
          console.log(`File ${filePath} has been deleted`);
        }
      });
  
    } else {
      console.error('Invalid data received or data is not a string.');
    }
  });


  socket.on('disconnect', async () => {
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

