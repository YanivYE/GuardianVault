const socket = io(); // Define the 'socket' variable

socket.on('message', (encryptedMessage) => {
  const messages = document.getElementById('messages');
  const messageElement = document.createElement('li');

  // Decrypt the received message using the server's private key
  const serverPrivateKey = 'YOUR_SERVER_PRIVATE_KEY_HERE'; // Replace with your server's private key
  const decryptedMessageBuffer = crypto.privateDecrypt(
    {
      key: serverPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(encryptedMessage, 'base64')
  );
  const decryptedMessage = decryptedMessageBuffer.toString('utf8');

  messageElement.textContent = decryptedMessage;
  messages.appendChild(messageElement);
});

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;

  // Encrypt the message using the server's public key
  const serverPublicKey = 'YOUR_SERVER_PUBLIC_KEY_HERE'; // Replace with your server's public key
  const encryptedMessageBuffer = crypto.publicEncrypt(
    {
      key: serverPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(message, 'utf8')
  );
  const encryptedMessage = encryptedMessageBuffer.toString('base64');

  socket.emit('message', encryptedMessage);
  messageInput.value = '';
}
