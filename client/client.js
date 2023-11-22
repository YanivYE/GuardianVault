let clientDH;

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.clientPublicKey = null; // Store client's public key
      this.sharedSecret = null;

      this.setupEventListeners();
    } 

    setupEventListeners() {
      this.socket.on("server-public-key", (serverPublicKey) => {
        this.performKeyExchange(serverPublicKey);
      });

      // // Handling messages from the server with integrity check
      // this.socket.on('server-message', (encryptedMessage, receivedHMAC) => {
      //   this.handleServerMessage(encryptedMessage, receivedHMAC);
      // });

      // document.getElementById("sendButton").addEventListener("click", () => {
      //   this.handleSendMessage();
      // });
    }

    performKeyExchange(serverPublicKey) {
      console.log('performing exchange');
      console.log('got server public key: ', serverPublicKey);
    
      // Generate your key pair
      const algorithm = {
        name: 'ECDH',
        namedCurve: 'P-256', // You can choose a different curve if needed
      };
    
      crypto.subtle.generateKey(algorithm, true, ['deriveKey'])
        .then(async (keyPair) => {
          // Send your public key to the other party (you need to implement this part)
          this.clientPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
          this.socket.emit('client-public-key', this.clientPublicKey);
          console.log('sent client public key: ', this.clientPublicKey);
    
          console.log('getting shared secret');
          // Assume the other party sends their public key, you receive it as serverPublicKey
          // Import the server's public key
          const importedServerPublicKey = await crypto.subtle.importKey(
            'raw',
            serverPublicKey,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
          );
    
          const sharedSecretAlgorithm = {
            name: 'ECDH',
            namedCurve: 'P-256',
            public: importedServerPublicKey,
          };
    
          // Derive the shared secret
          this.sharedSecret = await crypto.subtle.deriveKey(
            sharedSecretAlgorithm,
            keyPair.privateKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
    
          console.log('Shared secret:', this.sharedSecret);
    
          // Use a key derivation function to derive keys from the shared secret
          const keyMaterial = new Uint8Array(await window.crypto.subtle.exportKey('raw', this.sharedSecret));
          console.log('key material: ', keyMaterial);
    
          // Use derived keys for encryption or integrity
          this.socket.encryptionKey = keyMaterial.slice(0, 16);
          this.socket.integrityKey = keyMaterial.slice(16, 32);
    
          // Notify the server that the key exchange is complete
          console.log('key-exchange-complete');
        })
        .catch((error) => {
          console.error('Error in key exchange:', error.message || error);
          console.log(error.stack);
          debugger; // This line will cause your code execution to pause here
        });
    }
    
    


    hexStringToArrayBuffer(hexString) {
      const length = hexString.length / 2;
      const buffer = new Uint8Array(length);
    
      for (let i = 0; i < length; i++) {
        buffer[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
    
      return buffer.buffer;
    }
    

    // Helper function to convert an ArrayBuffer to a hex string
    arrayBufferToHexString(arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer);
      return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
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
      } 
      else {
        console.log('Message integrity check failed. Discarding message.');
        // Handle the case where the message may have been tampered with
      }
    }

    async handleSendMessage() {
      const messageInput = document.getElementById("message");
      const message = messageInput.value;
    
      // Import the shared key using Web Crypto API
      const encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        this.socket.encryptionKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    
      // Encrypt the message using the shared key
      const iv = window.crypto.getRandomValues(new Uint8Array(16)); // Use a random IV
      const cipherText = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        new TextEncoder().encode(message)
      );
    
      // Calculate HMAC for message integrity
      const hmac = crypto.createHmac('sha256', this.socket.integrityKey).update(new Uint8Array(cipherText)).digest('hex');
    
      // Send the encrypted message, IV, and HMAC to the server
      this.socket.emit('client-message', this.arrayBufferToHexString(cipherText), this.arrayBufferToHexString(iv), hmac);
    
      messageInput.value = "";
    }

    
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();
});
