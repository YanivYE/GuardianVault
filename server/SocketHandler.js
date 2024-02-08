const keyExchange = require("./ServerKeyExchange");
const sharedCryptography = require("./CryptographyTunnel");

class SocketHandler {
    constructor(socket) {
        this.socket = socket;
    }

    async handleSocketConnection() {
        console.log('A user connected');
      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        sharedCryptography.setEncryptionKey(sharedKey);

        this.socket.on('disconnect', async () => {
            console.log('Key Exchange complete');
        });
    }

    setUpEventListeners() {
        this.receivePayloadFromClient();
    }

    sendPayloadToClient(data) {
        const { iv, ciphertext, authTag } = sharedCryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        console.log("sent: ", payloadBase64);
        this.socket.emit('server-send-file', payloadBase64);
    }

    receivePayloadFromClient() {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const payload = Buffer.from(clientMessagePayload, 'base64').toString('hex');
        
            const iv = payload.substr(0, 32);
            const encryptedData = payload.substr(32, payload.length - 64);
            const authTag = payload.substr(payload.length - 32, 32);
            
            const decryptedData = sharedCryptography.decryptData(iv, encryptedData, authTag);

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
