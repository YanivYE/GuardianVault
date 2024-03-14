const keyExchange = require("./ServerKeyExchange");
const CryptographyTunnel = require("./Crypto");
const Parser = require("./Parser");

class SocketHandler {
    constructor(socket) {
        this.socket = socket;
    }

    async handleClientConnection() {      
        const sharedKey = await keyExchange.performKeyExchange(this.socket);

        const crypto = new CryptographyTunnel.CryptographyTunnel(sharedKey);

        const parser = new Parser.Parser(this.socket, crypto);
        this.listenForClientMessage(crypto, parser);
    }

    listenForClientMessage(crypto, parser) {
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            const message = crypto.recieveClientPayload(clientMessagePayload);

            const [responseType, responseData] = parser.parseClientMessage(message);

            if(responseType !== "" && responseData !== "")  // except for download file request
            {
                const serverPayload = crypto.generateServerPayload(responseData);

                this.socket.emit(responseType, serverPayload);
            }
        });
    }
}

module.exports = { SocketHandler };
