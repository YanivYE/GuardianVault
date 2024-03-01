const keyExchange = require("./ServerKeyExchange");
const sharedCryptography = require("./Crypto");
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
            const message = sharedCryptography.recieveClientPayload(clientMessagePayload);

            this.parser.parseClientMessage(message);
        });
    }
}

module.exports = { SocketHandler };
