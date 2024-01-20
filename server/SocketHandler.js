const keyExchange = require("./keyExchange");
const Cryptography = require("./Cryptography");

class SocketHandler {
    constructor(socket) {
      this.socket = socket;
    }
  
    async handleSocketConnection() {
        console.log('A user connected');
      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        const cryptography = new Cryptography(sharedKey);

        receiveClientFile(cryptography);

        this.socket.on('disconnect', async () => {
          console.log('A user disconnected');
        });
    }

    async sendFileToClient(cryptography, data) {
        const { iv, ciphertext, authTag } = cryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        this.socket.emit('server-send-file', payloadBase64);
    }

    // this.socket.on('send-file', async (fileInfo) => {
    //     const { fileName, data, iv } = fileInfo;
      
    //     console.log("IV", iv);
    //     console.log('Got file from client:', fileName, '\n', 'data:', data);
    
    //     decryptWithAESGCM()
    //     if (data && typeof data === 'string') {
    //       // Save the file to the server script's directory
    //       const filePath = path.join(__dirname, fileName);
    //       fs.writeFileSync(filePath, Buffer.from(data.split(';base64,').pop(), 'base64'));
      
    //       console.log('File saved at:', filePath);
    
    //       await uploadFile(filePath);
    
    //       fileIds = await showFiles();
    //       console.log('File IDs in Google Drive:', fileIds);
    
    //       // Delete the file
    //       fs.unlink(filePath, (err) => {
    //         if (err) {
    //           console.error(`Error deleting file: ${err.message}`);
    //         } else {
    //           console.log(`File ${filePath} has been deleted`);
    //         }
    //       });
      
    //     } else {
    //       console.error('Invalid data received or data is not a string.');
    //     }
    //   });
      
      
    async receiveClientFile(cryptography) {
    this.socket.on('client-file-send', async (encryptedFilePayloadBase64) => {
        const filePayload = Buffer.from(encryptedFilePayloadBase64, 'base64').toString('hex');
    
        const iv = filePayload.substr(0, 32);
        const encryptedData = filePayload.substr(32, filePayload.length - 64);
        const authTag = filePayload.substr(filePayload.length - 32, 32);
        
        const decryptedData = cryptography.decryptData(iv, encryptedData, authTag);

        console.log('get file from client: ', decryptedData);
    });
    }
}

module.exports = { SocketHandler };