let clientDH;

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.encryptionKey = null;
      this.integrityKey = null;

      this.setupEventListeners();
    } 

    setupEventListeners() {
      this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
        this.performKeyExchange(serverPublicKeyBase64);
      });

      // Handling messages from the server with integrity check
      this.socket.on('server-message', (encryptedMessage, receivedHMAC) => {
        this.handleServerMessage(encryptedMessage, receivedHMAC);
      });

      document.getElementById("sendButton").addEventListener("click", () => {
        this.handleSendMessage();
      });
    }

    async performKeyExchange(serverPublicKeyBase64) {
      console.log('Exchanging Keys');

      console.log("received server public key:", serverPublicKeyBase64);

      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      );

      const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);

      const clientPublicKeyBase64 = this.arrayBufferToBase64(clientPublicKey);

      console.log('sent to server:', clientPublicKeyBase64);
      this.socket.emit('client-public-key', clientPublicKeyBase64);

      const importedServerPublicKey = await window.crypto.subtle.importKey(
        "raw",
        this.base64ToArrayBuffer(serverPublicKeyBase64),
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        []
      );

      const sharedSecretAlgorithm = {
        name: 'ECDH',
        namedCurve: 'P-256',
        public: importedServerPublicKey
      };

      let sharedSecret = await window.crypto.subtle.deriveBits(
        sharedSecretAlgorithm,
        keyPair.privateKey,
        256
      );

      sharedSecret = this.arrayBufferToHexString(sharedSecret);
      // hex type
      console.log("Computed shared secret:", sharedSecret);

      sharedSecret = new TextEncoder().encode(sharedSecret);

      // Derive key material using HKDF (HMAC-based Key Derivation Function)
      // Import shared secret as a CryptoKey
      const importedKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'HKDF'},
        false,
        ['deriveBits', 'deriveKey']
      );

      const salt = await this.receiveSaltFromServer();

      // Derive key material using HKDF
      const derivedKeyMaterial = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: { name: 'SHA-256' },
          salt: new TextEncoder().encode(salt),
          info: new TextEncoder().encode(''),
        },
        importedKey,
        256 // Specify the length in bits
      );

      console.log('Key Material: ', this.arrayBufferToHexString(derivedKeyMaterial));

      // Derive separate keys for encryption and integrity
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        derivedKeyMaterial,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      this.integrityKey = await crypto.subtle.importKey(
        'raw',
        derivedKeyMaterial,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        true,
        ['sign', 'verify']
      );

      // Use derived keys for encryption or integrity
      this.encryptionKey = await this.cryptoKeyToHex(this.encryptionKey);
      this.integrityKey = await this.cryptoKeyToHex(this.integrityKey);

      console.log('Encryption Key:', this.encryptionKey);
      console.log('Integrity Key:', this.integrityKey);
      
    }

    async cryptoKeyToHex(cryptoKey) {
      const keyMaterial = await crypto.subtle.exportKey('raw', cryptoKey);
      const byteArray = new Uint8Array(keyMaterial);
      const hexString = Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
      return hexString;
    }
    
    
    base64ToArrayBuffer(base64) {
      const binaryString = atob(base64);
      const length = binaryString.length;
      const arrayBuffer = new ArrayBuffer(length);
      const uint8Array = new Uint8Array(arrayBuffer);
    
      for (let i = 0; i < length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    
      return arrayBuffer;
    }
    
    arrayBufferToBase64(arrayBuffer) {
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
      const base64String = btoa(binaryString);
      return base64String;
    }


    hexStringToArrayBuffer(hexString) {
      const length = hexString.length / 2;
      const buffer = new Uint8Array(length);
    
      for (let i = 0; i < length; i++) {
        buffer[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
    
      return buffer.buffer;
    }
    

    arrayBufferToHexString(arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer);
      return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async receiveSaltFromServer() {
      // Assuming you're using a WebSocket for communication
      // You may need to handle WebSocket events appropriately
      // For simplicity, let's assume the salt is received before other operations
      return new Promise((resolve) => {
        this.socket.on('salt', (serverSalt) => {
          try {
            const parsedMessage = JSON.parse(serverSalt);
    
            if (parsedMessage.type === 'salt') {
              const receivedSaltHex = parsedMessage.salt; // Assuming it's already in hex format
              const receivedSalt = this.hexStringToArrayBuffer(receivedSaltHex);
              
              // Use the received salt in your application
              console.log('Received Salt:', this.arrayBufferToHexString(receivedSalt));
    
              // Resolve the promise with the received salt
              resolve(receivedSalt);
            }
          } catch (error) {
            console.error('Error parsing server salt:', error.message);
          }
        });
      });
    }
    

    async handleServerMessage(encryptedMessage, receivedHMAC) {
      const arrayBuffer = this.hexStringToArrayBuffer(encryptedMessage);

      // Calculate the HMAC using Web Crypto API
      const textEncoder = new TextEncoder();

      console.log("integrity key", this.socket.integrityKey);
      console.log("integrity key", typeof(this.socket.integrityKey));
      const keyData = textEncoder.encode(this.socket.integrityKey); // Convert string to ArrayBuffer
      const hmacKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );

      const computedHMAC = await window.crypto.subtle.sign(
        "HMAC",
        hmacKey,
        arrayBuffer
      );

      // Convert computed HMAC to hex string
      const computedHMACHex = Array.from(new Uint8Array(computedHMAC))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      if (computedHMACHex === receivedHMAC) {
        // Decrypt the data using the derived encryption key (existing code remains unchanged)
        // ...

        // Process the decrypted and authenticated message (existing code remains unchanged)
        // ...
      } else {
        console.log("Message integrity check failed. Discarding message.");
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
    
      // Calculate HMAC for message integrity using Web Crypto API
      const textEncoder = new TextEncoder();

      console.log("integrity key", this.socket.integrityKey);
      console.log("integrity key", typeof(this.socket.integrityKey));
      const keyData = textEncoder.encode(this.socket.integrityKey); // Convert string to ArrayBuffer
      const hmacKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );


      const hmac = await window.crypto.subtle.sign(
        "HMAC",
        hmacKey,
        cipherText
      );

      // Convert computed HMAC to hex string
      const hmacHex = Array.from(new Uint8Array(hmac))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      // Send the encrypted message, IV, and HMAC to the server
      this.socket.emit(
        "client-message",
        this.arrayBufferToHexString(cipherText),
        this.arrayBufferToHexString(iv),
        hmacHex
      );

      messageInput.value = "";
    }

    
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();

});

