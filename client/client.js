document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.clientRSAKeys = null;
      this.serverPublicKey = null;

      this.setupEventListeners();
      this.generateClientRSAKeyPair();
      this.sendKeyExchange();
    }

    setupEventListeners() {
      this.socket.on("server-public-key", (publicKey) => {
        this.handleServerPublicKey(publicKey);
      });

      this.socket.on("server-message", (encryptedResponse) => {
        this.handleServerMessage(encryptedResponse);
      });

      document.getElementById("sendButton").addEventListener("click", () => {
        this.handleSendMessage();
      });
    }

    generateClientRSAKeyPair() {
      this.clientRSAKeys = forge.pki.rsa.generateKeyPair(2048);
    }

    sendKeyExchange() {
      const clientPublicKey = forge.pki.publicKeyToPem(this.clientRSAKeys.publicKey);
      console.log("client: " + clientPublicKey);
      this.socket.emit("exchange-keys", { clientPublicKey });
    }

    handleServerPublicKey(publicKey) {
      console.log("server: " + publicKey);
      this.serverPublicKey = forge.pki.publicKeyFromPem(publicKey);
    }

    handleSendMessage() {
      const messageInput = document.getElementById("message");
      const message = messageInput.value;
      const encryptedMessage = this.serverPublicKey.encrypt(message, "RSA-OAEP");

      // Display the encrypted message
      document.getElementById("encryptedMessageDisplay").textContent =
        "Encrypted Message: " + forge.util.encode64(encryptedMessage);
      document.getElementById("messages").textContent = "Regular Message: " + message;

      this.socket.emit("client-message", forge.util.encode64(encryptedMessage));
      messageInput.value = "";
    }

    handleServerMessage(encryptedResponse) {
      const decryptedResponse = this.clientRSAKeys.privateKey.decrypt(
        forge.util.decode64(encryptedResponse),
        "RSA-OAEP"
      );

      const messagesDiv = document.getElementById("messages");
      const messageElement = document.createElement("p");
      messageElement.textContent = "Server's response: " + decryptedResponse;
      messagesDiv.appendChild(messageElement);
    }
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();
});
