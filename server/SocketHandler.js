const keyExchange = require("./ServerKeyExchange");
const sharedCryptography = require("./CryptographyTunnel");
const Parser = require("./Parser");

class SocketHandler {
    constructor(socket) {
        this.socket = socket;
        this.parser = new Parser.Parser(socket);
    }

    async handleClientConnection() {      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        sharedCryptography.setEncryptionKey(sharedKey);

        this.listenForClientMessage();
    }

    listenForClientMessage() {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const payload = Buffer.from(clientMessagePayload, 'base64').toString('hex');
        
            const iv = payload.substr(0, 32);   
            const encryptedData = payload.substr(32, payload.length - 96);
            const authTag = payload.substr(payload.length - 32, 32);
            
            const decryptedData = sharedCryptography.decryptData(iv, encryptedData, authTag);

            this.parser.parseClientMessage(decryptedData);
        });
    }
}

module.exports = { SocketHandler };
