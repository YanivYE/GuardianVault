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

        this.socket.on('login', async (loginData) => {
            const username = loginData.username;
            const password = loginData.password;
            console.log(username, password);
        });

        this.socket.on('signup', async (signupData) => {
            const username = signupData.username;
            const email = signupData.email;
            const password = signupData.password;
            console.log(username, email, password);
        });
    }

    sendFileToClient(cryptography, data) 
    {
        const { iv, ciphertext, authTag } = cryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        console.log("sent: ", payloadBase64);
        this.socket.emit('server-send-file', payloadBase64);
    }
       
    receiveFileFromClient(cryptography) 
    {
        this.socket.on('client-send-file', async (encryptedFilePayloadBase64) => {
            console.log('got encrypted file from client: ', encryptedFilePayloadBase64, "\n\n");
            const filePayload = Buffer.from(encryptedFilePayloadBase64, 'base64').toString('hex');
        
            const iv = filePayload.substr(0, 32);
            const encryptedData = filePayload.substr(32, filePayload.length - 64);
            const authTag = filePayload.substr(filePayload.length - 32, 32);
            
            const decryptedData = cryptography.decryptData(iv, encryptedData, authTag);

            const [userPassword, fileName, fileContent] = decryptedData.split('$');

            console.log('user password is: ', userPassword, ' and got file: ' +  fileName + ' from client: ', fileContent, "\n\n");

            const fileHandler = new FileHandler.FileHandler(userPassword);

            fileHandler.saveToDrive(fileName, fileContent);

        });
    }
}

module.exports = { SocketHandler };