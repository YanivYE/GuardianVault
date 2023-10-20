document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // Connect to the Socket.IO server

  const messages = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  let publicKey;
  let privateKey;

  // Make an AJAX request to fetch the public key from the server
  fetch('/public-key')
    .then((response) => response.text())
    .then((serverPublicKey) => {
      encrypt = new JSEncrypt();
      encrypt.setPublicKey(serverPublicKey);

      // send the client's public key to the server for future encryption.
      socket.emit('client-public-key', keyPair.publicKey);

      // Set up decryption with the client's private key, assuming the client's private key is already available.
      decrypt = new JSEncrypt();
      decrypt.setPrivateKey(keyPair.privateKey);
    })
    .catch((error) => {
      console.error('Failed to fetch the public key:', error);
    });

  // Handle sending a new message
  sendButton.addEventListener('click', () => {
    const message = messageInput.value;

    if (message && encrypt) {
      // Encrypt the message using the server's public key
      const encryptedMessage = encrypt.encrypt(message);

      // Send the encrypted message to the server
      socket.emit('message', encryptedMessage);

      // Display the sent message in the chat
      displaySentMessage(message);

      // Clear the input field
      messageInput.value = '';
    }
  });

  // Listen for incoming messages from the server
  socket.on('message', (encryptedMessage) => {
    if (decrypt) {
      const decryptedMessage = decrypt.decrypt(encryptedMessage);
      if (decryptedMessage) {
        // Display the received message in the chat
        displayReceivedMessage(decryptedMessage);
      }
    }
  });

  // Function to display a sent message in the chat
  function displaySentMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('sent-message'); // You can add a CSS class for styling
    messageElement.textContent = 'MSG: ' + message;
    messages.appendChild(messageElement);
  }

  function generateRSAKeyPair() {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  }

  // Function to display a received message in the chat
  function displayReceivedMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('received-message'); // You can add a CSS class for styling
    messageElement.textContent = message;
    messages.appendChild(messageElement);
  }
});
