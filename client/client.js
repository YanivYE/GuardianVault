document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  let clientRSAKeys;
  let serverPublicKey;

  function generateClientRSAKeyPair() {
    clientRSAKeys = forge.pki.rsa.generateKeyPair(2048);
  }

  socket.on("public-key", (publicKey) => {
    serverPublicKey = forge.pki.publicKeyFromPem(publicKey);

    const messageInput = document.getElementById("message");
    const sendButton = document.getElementById("sendButton");
    const encryptedMessageDisplay = document.getElementById("encryptedMessageDisplay"); // Add this line
    const messageDisplay = document.getElementById("messages"); // Add this line

    sendButton.addEventListener("click", () => {
      const message = messageInput.value;

      const encryptedMessage = serverPublicKey.encrypt(message, 'RSA-OAEP');

      // Display the encrypted message
      encryptedMessageDisplay.textContent = "Encrypted Message: " + forge.util.encode64(encryptedMessage);
      messageDisplay.textContent = "Regular Message: " + message;

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
