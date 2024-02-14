const keyExchange = require("./ServerKeyExchange");
const sharedCryptography = require("./CryptographyTunnel");
const Parser = require("./Parser");

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

    sendPayloadToClient(data) {
        const { iv, ciphertext, authTag } = sharedCryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag;
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        console.log("sent: ", payloadBase64);
        this.socket.emit('server-send-file', payloadBase64);
    }

    receivePayloadFromClient() {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const parser = new Parser.Parser(this.socket);
            const payload = Buffer.from(clientMessagePayload, 'base64').toString('hex');
        
            const iv = payload.substr(0, 32);   
            const encryptedData = payload.substr(32, payload.length - 96);
            const authTag = payload.substr(payload.length - 32, 32);
            
            const decryptedData = sharedCryptography.decryptData(iv, encryptedData, authTag);

            parser.parseClientMessage(decryptedData);
        });
    }
}

module.exports = { SocketHandler };
