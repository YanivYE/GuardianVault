var clientPublicKey = null;

async function encryptMessage(message, publicKey) {
  const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
  const encryptedMessage = publicKeyObj.encrypt(message, 'RSA-OAEP');
  return forge.util.encode64(encryptedMessage);
}

async function decryptMessage(encryptedMessage, privateKey) {
  const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
  const decryptedMessage = privateKeyObj.decrypt(forge.util.decode64(encryptedMessage), 'RSA-OAEP');
  return decryptedMessage;
}

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
      clientPublicKey = forge.pki.publicKeyToPem(this.clientRSAKeys.publicKey);
      console.log("client: " + clientPublicKey);
      this.socket.emit("client-public-key", { clientPublicKey });
    }

    handleServerPublicKey(publicKey) {
      console.log("server: " + publicKey);
      this.serverPublicKey = forge.pki.publicKeyFromPem(publicKey);
    }

    async handleSendMessage() {
      const messageInput = document.getElementById("message");
      const message = messageInput.value;

      const encryptedMessage = await encryptMessage(message, this.serverPublicKey);

      // Display the encrypted message
      document.getElementById("encryptedMessageDisplay").textContent =
        "Encrypted Message: " + encryptedMessage;
      document.getElementById("messages").textContent = "Regular Message: " + message;

      this.socket.emit("client-message", encryptedMessage);
      messageInput.value = "";
    }

    async handleServerMessage(encryptedResponse) {
      const decryptedResponse = await decryptMessage(encryptedResponse, clientPrivateKey);

      const messagesDiv = document.getElementById("messages");
      const messageElement = document.createElement("p");
      messageElement.textContent = "Server's message: " + decryptedResponse;
      messagesDiv.appendChild(messageElement);
    }
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();
]});

