/*/ Create an instance of JSEncrypt with the server's public key
const serverPublicKey = 'YOUR_SERVER_PUBLIC_KEY_HERE'; // Replace with your server's public key
const encrypt = new JSEncrypt();
encrypt.setPublicKey(serverPublicKey);

// Function to encrypt a message and send it to the server
function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;

  // Encrypt the message using the server's public key
  const encryptedMessage = encrypt.encrypt(message);

  // Send the encrypted message to the server
  socket.emit('message', encryptedMessage);
  messageInput.value = '';
}

// Function to decrypt a received message
function decryptMessage(encryptedMessage) {
  // Decrypt the received message using the client's private key (if available)
  // Note: In a real scenario, the client would not have a private key.
  // Decryption is typically done on the server.
  const decryptedMessage = encrypt.decrypt(encryptedMessage);
  return decryptedMessage;
}

document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // Connect to the Socket.IO server

  const messages = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  // Listen for incoming messages from the server
  socket.on('message', (message) => {
    displayMessage(message);
  });

  // Handle sending a new message
  sendButton.addEventListener('click', () => {
    console.log("click");
    const message = messageInput.value;

    if (message) {
      // Send the message to the server
      socket.emit('message', message);

      // Clear the input field
      messageInput.value = '';
    }
  });

  // Display a received message in the chat
  function displayMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
  }
});

socket.on('message', (encryptedMessage) => {
  const decryptedMessage = decryptMessage(encryptedMessage);
  if (decryptedMessage) {
    // Display the decrypted message
    displayMessage(decryptedMessage);
  }
});
*/

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

      // Clear the input field
      messageInput.value = '';
    }
  });

  // Listen for incoming messages from the server
  socket.on('message', (encryptedMessage) => {
    const decryptedMessage = decryptMessage(encryptedMessage, encrypt);
    if (decryptedMessage) {
      // Display the decrypted message
      displayMessage(decryptedMessage);
    }
  });

  // Display a received message in the chat
  function displayMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
  }

  // Function to decrypt a received message
  function decryptMessage(encryptedMessage, encrypt) {
    const decryptedMessage = encrypt.decrypt(encryptedMessage);
    return decryptedMessage;
  }
});
