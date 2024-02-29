const keyExchange = require("./ServerKeyExchange");
const sharedCryptography = require("./Crypto");
const Parser = require("./Parser");

class SocketHandler {
    constructor(socket) {
        this.socket = socket;
    }

    async handleClientConnection() {      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        sharedCryptography.setEncryptionKey(sharedKey);

        this.receivePayloadFromClient();

        this.socket.on('disconnect', async () => {
            console.log('User disconnected');
        });
    }

    receivePayloadFromClient() {
        const parser = new Parser.Parser(this.socket);
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
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
