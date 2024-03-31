// Import required modules
const KeyExchange = require("./KeyExchange");
const CryptographyTunnel = require("./CryptographyTunnel");
const Parser = require("./Parser");

// SocketHandler class to handle client connections
class SocketHandler {
    constructor(socket) {
        this.socket = socket;
    }

    // Method to handle client connection asynchronously
    async handleClientConnection() {
        // Perform key exchange to establish shared key
        const sharedKey = await KeyExchange.performKeyExchange(this.socket);

        // Create CryptographyTunnel instance with shared key
        const crypto = new CryptographyTunnel.CryptographyTunnel(sharedKey);

        // Create Parser instance with socket and cryptography tunnel
        const parser = new Parser.Parser(this.socket, crypto);

        // Listen for client messages
        this.listenForClientMessage(crypto, parser);
    }

    // Method to listen for client messages
    listenForClientMessage(crypto, parser) {
        // Listen for 'ClientMessage' event
        this.socket.on('ClientMessage', async (clientMessagePayload) => {
            // Receive and decrypt client payload
            const message = crypto.recieveClientPayload(clientMessagePayload);

            // Parse client message
            const [responseType, responseData] = await parser.parseClientMessage(message);

            // Check if response type and data are not empty
            if (responseType !== "" && responseData !== "") {
                // Generate server payload and emit response to client
                const serverPayload = crypto.generateServerPayload(responseData);
                this.socket.emit(responseType, serverPayload);
            }
        });
    }
}

// Export SocketHandler class
module.exports = { SocketHandler };
