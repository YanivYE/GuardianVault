const keyExchange = require("./ServerKeyExchange");
const CryptographyTunnel = require("./Crypto");
const Parser = require("./Parser");

class SocketHandler {
    constructor(socket) {
        this.socket = socket;
        this.parser = null;
        this.crypto = null;
    }

    async handleClientConnection() {      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        this.crypto = new CryptographyTunnel.CryptographyTunnel(sharedKey);

        this.parser = new Parser.Parser(this.socket, this.crypto);
        this.listenForClientMessage();
    }

    listenForClientMessage() {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const message = this.crypto.recieveClientPayload(clientMessagePayload);

            this.parser.parseClientMessage(message);
        });
    }
}

module.exports = { SocketHandler };
