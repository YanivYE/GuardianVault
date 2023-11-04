document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  let clientRSAKeys;
  let serverPublicKey;

  function generateClientRSAKeyPair() {
    clientRSAKeys = forge.pki.rsa.generateKeyPair(2048);
  }

  function sendKeyExchange() {
    const clientPublicKey = forge.pki.publicKeyToPem(clientRSAKeys.publicKey);
    socket.emit("exchange-keys", { clientPublicKey });
  }

  console.log("d");

  generateClientRSAKeyPair();
  sendKeyExchange();

  socket.on("server-public-key", (publicKey) => {
    console.log(publicKey);
    serverPublicKey = forge.pki.publicKeyFromPem(publicKey);

    const messageInput = document.getElementById("message");
    const sendButton = document.getElementById("sendButton");
    const encryptedMessageDisplay = document.getElementById("encryptedMessageDisplay"); 
    const messageDisplay = document.getElementById("messages"); 

    sendButton.addEventListener("click", () => {
      const message = messageInput.value;

      const encryptedMessage = serverPublicKey.encrypt(message, 'RSA-OAEP');

      // Display the encrypted message
      encryptedMessageDisplay.textContent = "Encrypted Message: " + forge.util.encode64(encryptedMessage);
      messageDisplay.textContent = "Regular Message: " + message;
      // console.log(message);

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

});
