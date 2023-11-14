let clientDH;

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.clientPublicKey = null; // Store client's public key

      this.setupEventListeners();
      this.sendKeyExchange();
    }

    setupEventListeners() {
      this.socket.on("server-public-key", (serverPublicKey) => {
        this.handleServerPublicKey(serverPublicKey);
      });

      // Handling messages from the server with integrity check
      this.socket.on('server-message', (encryptedMessage, receivedHMAC) => {
        this.handleServerMessage(encryptedMessage, receivedHMAC);
      });

      document.getElementById("sendButton").addEventListener("click", () => {
        this.handleSendMessage();
      });
    }

    async sendKeyExchange() {
      // Generate a Diffie-Hellman key pair using Web Crypto API
      const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-384', // You can choose different curves based on your security requirements
        },
        true,
        ['deriveKey']
      );
    
      // Export the public key as an ArrayBuffer
      const exportedPublicKey = await window.crypto.subtle.exportKey('spki', publicKey);
      const clientPublicKey = this.arrayBufferToHexString(exportedPublicKey);
    
      // Send the client's public key to the server
      this.socket.emit('client-public-key', clientPublicKey);
    }

    async handleServerPublicKey(serverPublicKey) {
      // Convert the hex string to an ArrayBuffer
      const arrayBuffer = this.hexStringToArrayBuffer(serverPublicKey);
    
      // Import the server's public key using Web Crypto API
      const importedServerPublicKey = await window.crypto.subtle.importKey(
        'spki',
        arrayBuffer,
        { name: 'ECDH', namedCurve: 'P-384' },
        false,
        []
      );
    
      // Generate the shared secret using Web Crypto API
      const sharedSecret = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: importedServerPublicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    
      // Use a key derivation function to derive keys from the shared secret
      const keyMaterial = crypto.createHash('sha256').update(this.arrayBufferToHexString(sharedSecret), 'hex').digest();
    
      // Use derived keys for encryption or integrity
      this.socket.encryptionKey = keyMaterial.slice(0, 16);
      this.socket.integrityKey = keyMaterial.slice(16, 32);
    
      // Notify the server that the key exchange is complete
      this.socket.emit('key-exchange-complete');
    }

    // Helper function to convert a hex string to an ArrayBuffer
    hexStringToArrayBuffer(hexString) {
      const bytes = [];
      for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
      }
      return new Uint8Array(bytes).buffer;
    }

    // Helper function to convert an ArrayBuffer to a hex string
    arrayBufferToHexString(arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer);
      return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async handleSendMessage() {
      const messageInput = document.getElementById("message");
      const message = messageInput.value;
    
      // Encrypt the message using the shared secret
      const cipher = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(16) },  // Use a random IV or an agreed-upon mechanism
        this.socket.encryptionKey,
        new TextEncoder().encode(message)
      );
    
      // Calculate HMAC for message integrity
      const hmac = crypto.createHmac('sha256', this.socket.integrityKey).update(new Uint8Array(cipher)).digest('hex');
    
      // Send the encrypted message and HMAC to the server
      this.socket.emit('client-message', this.arrayBufferToHexString(cipher), hmac);
    
      messageInput.value = "";
    }

    async handleServerMessage(encryptedMessage, receivedHMAC) {
      // Convert the hex string to an ArrayBuffer
      const arrayBuffer = this.hexStringToArrayBuffer(encryptedMessage);
    
      // Verify the integrity of the received message using HMAC
      const computedHMAC = crypto.createHmac('sha256', this.socket.integrityKey).update(new Uint8Array(arrayBuffer)).digest('hex');
    
      if (computedHMAC === receivedHMAC) {
        // Decrypt the data using the derived encryption key
        const decryptedMessage = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(16) },  // Use the same IV used for encryption
          this.socket.encryptionKey,
          arrayBuffer
        );
    
        console.log('Message integrity verified. Decrypted message:', new TextDecoder().decode(decryptedMessage));
    
        // Process the decrypted and authenticated message
        const messagesDiv = document.getElementById("messages");
        const messageElement = document.createElement("p");
        messageElement.textContent = "Server's message: " + new TextDecoder().decode(decryptedMessage);
        messagesDiv.appendChild(messageElement);
      } else {
        console.log('Message integrity check failed. Discarding message.');
        // Handle the case where the message may have been tampered with
      }
    }
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();
});
