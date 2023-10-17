document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // Connect to the Socket.IO server

  const messages = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  let encrypt; // Define the encrypt variable in a scope accessible to both functions

  // Make an AJAX request to fetch the public key from the server
  fetch('/public-key')
    .then(response => response.text())
    .then(serverPublicKey => {
      encrypt = new JSEncrypt();
      encrypt.setPublicKey(serverPublicKey);
    })
    .catch(error => {
      console.error('Failed to fetch the public key:', error);
    });

  // Handle sending a new message
  sendButton.addEventListener('click', () => {
    const message = messageInput.value;

    if (message && encrypt) { // Check if encrypt is defined before using it
      // Encrypt the message using the server's public key
      const encryptedMessage = encrypt.encrypt(message);

      // Send the encrypted message to the server
      socket.emit('message', encryptedMessage);

      // Display the sent message in the chat
      displaySentMessage(message, encryptedMessage);

      // Clear the input field
      messageInput.value = '';
    }
  });

  // Listen for incoming messages from the server
  socket.on('message', (encryptedMessage) => {
    const decryptedMessage = decryptMessage(encryptedMessage, encrypt);
    if (decryptedMessage) {
      // Display the received message in the chat
      displayReceivedMessage(decryptedMessage);
    }
  });

  // Function to display a sent message in the chat
  function displaySentMessage(message, encryptedMessage) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('sent-message'); // You can add a CSS class for styling
    messageElement.textContent = "MSG: " + message;
    messages.appendChild(messageElement);
  }

  // Function to display a received message in the chat
  function displayReceivedMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('received-message'); // You can add a CSS class for styling
    messageElement.textContent = message;
    messages.appendChild(messageElement);
  }

  // Function to decrypt a received message
  function decryptMessage(encryptedMessage, encrypt) {
    const decryptedMessage = encrypt.decrypt(encryptedMessage);
    return decryptedMessage;
  }
});
