const keyExchange = require("./ClientKeyExchange");
const processor = require("./MessageProcessing");

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.sharedKey = null;
      this.keyExchangeComplete = false; // Flag to track key exchange completion
      this.messageProcessor = null;

      this.setupEventListeners();
    }

    setupEventListeners() {
      this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
        this.sharedKey = await keyExchange.performKeyExchange(this.socket, serverPublicKeyBase64);
        this.keyExchangeComplete = true;
        this.messageProcessor = new processor.MessageProcessor(this.socket, this.sharedKey);
        this.messageProcessor.processMessageQueue();
      });

      document.getElementById("send-button").addEventListener("click", () => {
        messageProcessor.sendFileToServer();
      });

      // Listen for server messages after instantiation
      this.socket.on('server-send-file', async encryptedFilePayloadBase64 => {
        if (this.keyExchangeComplete) {
          await this.messageProcessor.receiveFileFromServer(encryptedFilePayloadBase64);
        } else {
          console.log("Key exchange is not complete. Queuing server message.");
          this.messageProcessor.messageQueue.push(encryptedFilePayloadBase64);
        }
      });
    }  
  }
  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();

});

