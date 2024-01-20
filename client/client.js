const keyExchange = require("./ClientKeyExchange");

document.addEventListener("DOMContentLoaded", () => {
  class Client {
    constructor() {
      this.socket = io();
      this.sharedKey = null;
      this.keyExchangeComplete = false; // Flag to track key exchange completion
      this.messageQueue = []; // Queue to store server messages before key exchange completion

      this.setupEventListeners();
    }

    setupEventListeners() {
      this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
        this.sharedKey = await keyExchange.performKeyExchange(this.socket, serverPublicKeyBase64);
        this.processMessageQueue(); // Process queued messages after key exchange
      });

      document.getElementById("send-button").addEventListener("click", () => {
        this.handleSendMessage();
      });

      // Listen for server messages after instantiation
      this.socket.on('server-message', async (iv, encryptedMessage, tag, receivedHMAC) => {
        if (this.keyExchangeComplete) {
          await this.handleServerMessage(iv, encryptedMessage, tag, receivedHMAC);
        } else {
          console.log("Key exchange is not complete. Queuing server message.");
          this.messageQueue.push({ iv, encryptedMessage, tag, receivedHMAC });
        }
      });
    } 

    async processMessageQueue() {
      console.log('Processing queued messages...');
      while (this.messageQueue.length > 0) {
        const { iv, encryptedMessage, tag, receivedHMAC } = this.messageQueue.shift();
        await this.handleServerMessage(iv, encryptedMessage, tag, receivedHMAC);
      }
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
      const buffer = new Uint8Array(hexString.length / 2);
      for (let i = 0; i < hexString.length; i += 2) {
        buffer[i / 2] = parseInt(hexString.substr(i, 2), 16);
      }
      return buffer;
    }
    

    arrayBufferToHexString(arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer);
      return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async handleServerMessage(iv, encryptedMessage, tag, receivedHMAC) {
      console.log('got message from server: ', encryptedMessage, ' and hmac: ', receivedHMAC);
        
      // Decrypt the message using AES-GCM
      const decryptedMessage = await this.decryptWithAESGCM(iv, encryptedMessage, tag);
      console.log('decrypted message: ', decryptedMessage);
    

      // Calculate the HMAC using Web Crypto API
      const hmacData = new TextEncoder().encode(encryptedMessage); // Convert encrypted message to ArrayBuffer
      const hexIntegrityKey = await this.cryptoKeyToHex(this.integrityKey);
      const arrayInterityKey = this.hexStringToArrayBuffer(hexIntegrityKey);
      const hmacKey = await window.crypto.subtle.importKey(
        "raw",
        arrayInterityKey,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["verify"]
      );
    
      // Verify the received HMAC against the computed HMAC
      const receivedHMACArray = Uint8Array.from(this.hexStringToArrayBuffer(receivedHMAC));
      const isValid = await window.crypto.subtle.verify(
        "HMAC",
        hmacKey,
        receivedHMACArray,
        hmacData
      );
    
      if (isValid) {
        console.log('Message integrity verified. Decrypted message:', decryptedMessage);
        // Process the decrypted message as needed
      } else {
        console.log("Message integrity check failed. Discarding message.");
        // Handle the case where the message may have been tampered with
      }
    }

    
    

    async handleSendMessage() {
      const selectedFile = fileUploadInput.files[0];
    
      if (selectedFile) {
        const reader = new FileReader();
    
        reader.onload = async (event) => {
          const fileData = event.target.result;
          console.log(fileData, "\n\n");
    
          // Wait for the encryption to complete before proceeding
          const { iv, ciphertext , tag} = await this.encryptWithAESGCM(fileData, this.aesGcmKey);
          
          console.log(ciphertext);
          console.log("iv", iv);
          console.log("tag", tag);

          // Send the file data to the server using Socket.IO
          this.socket.emit('send-file', { fileName: selectedFile.name, data: ciphertext, iv: iv, tag: tag});
    
          console.log('File data sent to the server:', selectedFile.name);
        };
    
        reader.readAsDataURL(selectedFile);
      }
    }
  }

  // Create an instance of the Client class when the DOM is loaded
  const client = new Client();

});

