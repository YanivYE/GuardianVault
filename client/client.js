document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  let clientRSAKeys;
  let serverPublicKey;

  function generateClientRSAKeyPair() {
    clientRSAKeys = forge.pki.rsa.generateKeyPair(2048); // Create a new RSA key pair
  }

  socket.on("public-key", (publicKey) => {
    serverPublicKey = forge.pki.publicKeyFromPem(publicKey);

    const messageInput = document.getElementById("message");
    const sendButton = document.getElementById("sendButton");

    sendButton.addEventListener("click", () => {
      const message = messageInput.value;

      // Encrypt the message with the server's public key
      const encryptedMessage = serverPublicKey.encrypt(message, 'RSA-OAEP');

      socket.emit("client-message", forge.util.encode64(encryptedMessage));
      messageInput.value = "";
    });
  });

  socket.on("server-message", (encryptedResponse) => {
    const decryptedResponse = clientRSAKeys.privateKey.decrypt(
      forge.util.decode64(encryptedResponse),
      'RSA-OAEP'
    );

    const messagesDiv = document.getElementById("messages");
    const messageElement = document.createElement("p");
    messageElement.textContent = "Server's response: " + decryptedResponse;
    messagesDiv.appendChild(messageElement);
  });

  function sendKeyExchange() {
    const clientPublicKey = forge.pki.publicKeyToPem(clientRSAKeys.publicKey);
    socket.emit("exchange-keys", { clientPublicKey });
  }

  generateClientRSAKeyPair();
  sendKeyExchange();
});
