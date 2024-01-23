const keyExchange = require("./ServerKeyExchange");
const Cryptography = require("./Cryptography");
const FileHandler = require("./FileHandler");

class SocketHandler {
    constructor(socket) {
      this.socket = socket;
    }
  
    async handleSocketConnection() {
        console.log('A user connected');
      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);
        
        const cryptography = new Cryptography.Cryptography(sharedKey);

        this.receiveFileFromClient(cryptography);

        this.socket.on('disconnect', async () => {
          console.log('A user disconnected');
        });
    }

    sendFileToClient(cryptography, data) {
        const { iv, ciphertext, authTag } = cryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        this.socket.emit('server-send-file', payloadBase64);
    }
       
    receiveFileFromClient(cryptography) {
        const fileHandler = new FileHandler.FileHandler();
        this.socket.on('client-send-file', async (encryptedFilePayloadBase64) => {
            const filePayload = Buffer.from(encryptedFilePayloadBase64, 'base64').toString('hex');
        
            const iv = filePayload.substr(0, 32);
            const encryptedData = filePayload.substr(32, filePayload.length - 64);
            const authTag = filePayload.substr(filePayload.length - 32, 32);
            
            const decryptedData = await cryptography.decryptData(iv, encryptedData, authTag);

            const [fileName, fileContent] = decryptedData.split('$');

            console.log('got file: ' +  fileName + ' from client: ', fileContent);

            fileHandler.saveFileToDisk(fileName, fileContent);

        });
    }
}

module.exports = { SocketHandler };