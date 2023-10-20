document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  let clientRSAKeys;
  let serverPublicKey;

  function generateClientRSAKeyPair() {
    clientRSAKey = new NodeRSA({ b: 2048 }); // Create a new RSA key pair
  }

  socket.on("public-key", (publicKey) => {
    serverPublicKey = new NodeRSA(publicKey, 'public');

    const messageInput = document.getElementById("message");
    const sendButton = document.getElementById("sendButton");

    sendButton.addEventListener("click", () => {
      const message = messageInput.value;

      // Encrypt the message with the server's public key
      const encryptedMessage = serverPublicKey.encrypt(message, 'base64');

      socket.emit("client-message", encryptedMessage);
      messageInput.value = "";
    });
  });

  socket.on("server-message", (encryptedResponse) => {
    const decryptedResponse = clientRSAKeys.privateKey.decrypt(
      forge.util.decode64(encryptedResponse),
      "RSA-OAEP"
    );

    const messagesDiv = document.getElementById("messages");
    const messageElement = document.createElement("p");
    messageElement.textContent = "Server's response: " + decryptedResponse;
    messagesDiv.appendChild(messageElement);
  });

  function sendKeyExchange() {
    const clientPublicKey = clientRSAKey.exportKey('public'); // Export the client's public key
    socket.emit("exchange-keys", { clientPublicKey });
  }

  generateClientRSAKeyPair();
  sendKeyExchange();
});
