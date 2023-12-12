let clientDH;

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.sharedSecret = null;

      this.setupEventListeners();
    } 

    setupEventListeners() {
      this.socket.on('server-public-key', async (serverPublicKey) => {
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

    async performKeyExchange(serverPublicKey) {

      console.log("got server public key:", typeof(serverPublicKey));

      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      );

      // crypto key -> array buffer
      const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);

      // Send clientPublicKey to the server
      this.socket.emit('client-public-key', clientPublicKey);
      console.log(typeof(clientPublicKey));

      debugger;
      // buffer array -> crypto key
      const importedServerPublicKey = await window.crypto.subtle.importKey(
        "raw",
        serverPublicKey,
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        []
      );
      debugger;
      // Derive shared secret
      const sharedSecretAlgorithm = {
        name: 'ECDH',
        namedCurve: 'P-256',
        public: importedServerPublicKey
      };

      this.sharedSecret = await window.crypto.subtle.deriveBits(
        sharedSecretAlgorithm,
        keyPair.privateKey,
        256
      );

        // // Sign the client's public key
        // const clientPrivateKey = keyPair.privateKey;
        // const clientSignature = await window.crypto.subtle.sign(
        //   {
        //     name: "ECDSA",
        //     hash: {name: "SHA-256"}
        //   },
        //   clientPrivateKey,
        //   clientPublicKey
        // );
        // const clientPublicKeyBase64 = clientPublicKey.toString('base64');



        // Verify the server's signature
        // const serverPublicKeyBuffer = new Uint8Array(atob(clientPublicKey).split("").map(c => c.charCodeAt(0)));
        // const serverSignatureBuffer = new Uint8Array(atob(serverSignatureBase64).split("").map(c => c.charCodeAt(0)));

        // const isSignatureValid = await window.crypto.subtle.verify(
        //   {
        //     name: "ECDSA",
        //     hash: {name: "SHA-256"}
        //   },
        //   serverPublicKeyBuffer,
        //   serverSignatureBuffer,
        //   serverPublicKeyBuffer
        // );

        // if (isSignatureValid) {
        //   console.log('Server signature is valid.')

        console.log("shared secret:", this.sharedSecret);


            // Use derived keys for encryption or integrity
        const encryptionKey = new Uint8Array(this.sharedSecret.slice(0, 16));
        const integrityKey = new Uint8Array(this.sharedSecret.slice(16, 32));

        console.log('Shared secret:', this.sharedSecret);
        console.log('Encryption Key:', encryptionKey);
        console.log('Integrity Key:', integrityKey);

          // Continue with your application logic using the derived keys
        // } else {
        //   console.log('Server signature is not valid. Abort key exchange.');
        // }
      
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

async function importServerPublicKey(serverPublicKey) {
  try {
    const importedServerPublicKey = await window.crypto.subtle.importKey(
      "raw",
      serverPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
      );
    // Use the importedServerPublicKey here
    console.log(importedServerPublicKey);
    return importedServerPublicKey;
  } catch (error) {
    console.error('Error importing server public key:', error);
    throw error;
  }
}

async function deriveSharedSecret(importedServerPublicKey, keyPair) {
  try {
    const sharedSecretAlgorithm = {
      name: 'ECDH',
      namedCurve: 'P-256',
      public: importedServerPublicKey,
    };

    // Wait for the server public key import
    const sharedKey = await window.crypto.subtle.deriveKey(
      sharedSecretAlgorithm,
      keyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Use the shared key here
    console.log('Derived shared key:', sharedKey);
    return sharedKey;
  } catch (error) {
    console.error('Error deriving shared secret:', error);
    throw error;
  }
}

async function importServerPublicKey(serverPublicKey) {
  try {
    const importedServerPublicKey = await window.crypto.subtle.importKey(
      "raw",
      serverPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['encrypt', 'decrypt']
    );

    // Use the importedServerPublicKey here
    console.log('Imported server public key:', importedServerPublicKey);
    return importedServerPublicKey;
  } catch (error) {
    console.error('Error importing server public key:', error);
    throw error;
  }
}