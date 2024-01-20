class SocketHandler {
    constructor(socket) {
      this.socket = socket;
    }
  
    async handleSocketConnection(socket) {
        console.log('A user connected');
      
        await performKeyExchange(socket);
        
      
        socket.on('send-file', async (fileInfo) => {
          const { fileName, data, iv } = fileInfo;
        
          console.log("IV", iv);
          console.log('Got file from client:', fileName, '\n', 'data:', data);
      
          decryptWithAESGCM()
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

    async sendMessageToClient(message) {
        const { iv, ciphertext, tag } = encryptWithAESGCM(message);
        const encryptedMessage = ciphertext.toString('hex');
      
        const hmac = crypto.createHmac('sha256', integrityKey).update(encryptedMessage).digest('hex');
      
        console.log('Sent encrypted message to client: ', encryptedMessage, ' and hmac: ', hmac);
        socket.emit('server-message', iv, encryptedMessage, tag, hmac);
      }
      
      
      async receiveMessageFromClient() {
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
}

module.exports = { SocketHandler };