document.addEventListener('DOMContentLoaded', () => {
  const socket = io(); // Connect to the Socket.IO server

  const messages = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  let sharedSecret;

  // Function to display a sent message in the chat
  function displaySentMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('sent-message'); // You can add a CSS class for styling
    messageElement.textContent = 'MSG: ' + message;
    messages.appendChild(messageElement);
  }

  // Generate a shared secret using the Web Crypto API
  async function generateSharedSecret() {
    try {
      const randomValues = new Uint8Array(32); // Generate a 256-bit (32-byte) random key
      crypto.getRandomValues(randomValues);
      sharedSecret = randomValues;
    } catch (error) {
      console.error('Failed to generate a shared secret:', error);
    }
  }

  // Function to encrypt a message using the shared secret
  function encryptWithSharedSecret(sharedSecret, data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(sharedSecret), Buffer.from('0123456789abcdef0'));
    return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  }

  // Function to decrypt a message using the shared secret
  function decryptWithSharedSecret(sharedSecret, data) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(sharedSecret), Buffer.from('0123456789abcdef0'));
    return Buffer.concat([decipher.update(data, 'base64', 'utf8'), decipher.final()]);
  }

  // Handle sending a new message
  sendButton.addEventListener('click', () => {
    const message = messageInput.value;

    if (message) {
      // Encrypt the message using the shared secret
      const encryptedMessage = encryptWithSharedSecret(sharedSecret, message);

      // Send the encrypted message to the server
      socket.emit('message', encryptedMessage.toString('base64'));

      // Display the sent message in the chat
      displaySentMessage(message);

      // Clear the input field
      messageInput.value = '';
    }
  });

  // Listen for incoming messages from the server
  socket.on('message', (encryptedMessage) => {
    // Decrypt the message using the shared secret
    const decryptedMessage = decryptWithSharedSecret(sharedSecret, Buffer.from(encryptedMessage, 'base64'));
    if (decryptedMessage) {
      // Display the received message in the chat
      displayReceivedMessage(decryptedMessage.toString('utf8'));
    }
  });

  // Call this function to generate the shared secret.
  generateSharedSecret();
});
