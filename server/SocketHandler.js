const keyExchange = require("./ServerKeyExchange");
const CryptographyTunnel = require("./CryptographyTunnel");
const FileHandler = require("./FileHandler");
const fs = require('fs');
const { userInfo } = require("os");
const { PassThrough } = require("stream");

class SocketHandler {
    constructor(socket) {
      this.socket = socket;
      this.sharedKey = null;
    }
  
    async handleSocketConnection() {
        console.log('A user connected');
      
        this.sharedKey = await keyExchange.performKeyExchange(this.socket);

        this.socket.on('disconnect', async () => {
            console.log('Key Exchange complete');
          });
    }

    setUpEventListeners()
    {
        const cryptography = new CryptographyTunnel.CryptographyTunnel(this.sharedKey);

        this.receivePayloadFromClient(cryptography);
    }

    sendPayloadToClient(cryptography, data) 
    {
        const { iv, ciphertext, authTag } = cryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        console.log("sent: ", payloadBase64);
        this.socket.emit('server-send-file', payloadBase64);
    }
       
    receivePayloadFromClient(cryptography) 
    {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const payload = Buffer.from(clientMessagePayload, 'base64').toString('hex');
        
            const iv = payload.substr(0, 32);
            const encryptedData = payload.substr(32, payload.length - 64);
            const authTag = payload.substr(payload.length - 32, 32);
            
            const decryptedData = cryptography.decryptData(iv, encryptedData, authTag);

            console.log(decryptedData);

            // PARSER!!!

            // const [userPassword, fileName, fileContent] = decryptedData.split('$');

            // console.log('user password is: ', userPassword, ' and got file: ' +  fileName + ' from client: ', fileContent, "\n\n");

            // const fileHandler = new FileHandler.FileHandler(userPassword);

            // fileHandler.saveToDrive(fileName, fileContent);

        });
    }
}

module.exports = { SocketHandler };