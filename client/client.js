document.addEventListener("DOMContentLoaded", () => {
    class Client {
          constructor() {
            this.socket = io();
            this.sharedKey = null;
            this.messageQueue = []; 
            this.keyExchangeComplete = false; // Flag to track key exchange completion

            // Store references to file upload elements
            this.fileUploadInput = document.getElementById("file-upload");
            this.fileNameDisplay = document.getElementById("file-name");
            this.downloadLink = document.getElementById("download-link");
            this.sendButton = document.getElementById("send-button");

            this.setupEventListeners();
            this.setupFileUpload();
        }

        setupEventListeners() {
            this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
                this.performKeyExchange(serverPublicKeyBase64);
                this.keyExchangeComplete = true;
                this.processMessageQueue();
            });

            // TODO: integrate userPassword for PBE on server
            document.getElementById("send-button").addEventListener("click", () => {
                this.sendFileToServer(userPassword);
            });

            // Listen for server messages after instantiation
            this.socket.on('server-send-file', async encryptedFilePayloadBase64 => {
                if (this.keyExchangeComplete) {
                    await this.receiveFileFromServer(encryptedFilePayloadBase64);
                } else {
                    console.log("Key exchange is not complete. Queuing server message.");
                    this.messageQueue.push(encryptedFilePayloadBase64);
                }
            });
        }

        setupFileUpload() {
            // Display the selected file name
            this.fileUploadInput.addEventListener("change", () => {
                const selectedFile = this.fileUploadInput.files[0];
                if (selectedFile) {
                    this.fileNameDisplay.textContent = `Selected file: ${selectedFile.name}`;
                    this.downloadLink.style.display = "block";
                    this.downloadLink.setAttribute("href", URL.createObjectURL(selectedFile));
                    this.downloadLink.setAttribute("download", selectedFile.name);

                    // Show the send button
                    this.sendButton.style.display = "block";
                } else {
                    this.fileNameDisplay.textContent = "No file selected";
                    this.downloadLink.style.display = "none";
                    this.sendButton.style.display = "none";
                }
            });
        }

        async performKeyExchange(serverPublicKeyBase64) {        
          // Generate client key pair
          const keyPair = await window.crypto.subtle.generateKey(
            {
              name: "ECDH",
              namedCurve: "P-256"
            },
            true,
            ["deriveKey", "deriveBits"]
          );
        
          // Export client public key
          const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
          const clientPublicKeyBase64 = this.arrayBufferToBase64(clientPublicKey);
        
          this.socket.emit('client-public-key', clientPublicKeyBase64);
        
          // Import server public key
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
        
          // Derive shared secret
          const sharedSecretAlgorithm = {
            name: 'ECDH',
            namedCurve: 'P-256',
            public: importedServerPublicKey
          };
        
          this.sharedKey = await window.crypto.subtle.deriveBits(
            sharedSecretAlgorithm,
            keyPair.privateKey,
            256
          );
        
          // Convert shared secret to hex
          this.sharedKey = this.arrayBufferToHexString(this.sharedKey);
          console.log("Computed shared secret:", this.sharedKey);

          this.sharedKey = await this.hexToCryptoKey(this.sharedKey);
        }
        
        async encryptData(data) 
        {
            // Generate a random IV (Initialization Vector)
            const iv = crypto.getRandomValues(new Uint8Array(16));
            
            // Convert the text to ArrayBuffer
            const arrayBufferData = new TextEncoder().encode(data);
            
            // Encrypt the data using AES-GCM
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                this.sharedKey,
                arrayBufferData
            );
        
            // Get the ciphertext and authentication tag
            const ciphertext = new Uint8Array(encryptedData);

            const tag = new Uint8Array(encryptedData.slice(-16));
            
            return { iv, ciphertext, tag };
        }
          
        async decryptData(ivHex, ciphertextHex, tagHex) {
            try {
                const ivArray = this.hexStringToArrayBuffer(ivHex);
                const ciphertextArray = this.hexStringToArrayBuffer(ciphertextHex);
                const tagArray = this.hexStringToArrayBuffer(tagHex);
        
                // Convert ArrayBuffers to Uint8Arrays
                const ciphertextUint8Array = new Uint8Array(ciphertextArray);
                const tagUint8Array = new Uint8Array(tagArray);
                
                // Calculate total length
                const totalLength = ciphertextUint8Array.length + tagUint8Array.length;
                
                // Concatenate iv, ciphertext, and tag Uint8Arrays
                const concatenatedArray = new Uint8Array(totalLength);
                concatenatedArray.set(ciphertextUint8Array, 0);
                concatenatedArray.set(tagUint8Array, ciphertextUint8Array.length);

                // Decrypt the data using AES-GCM
                const decryptedData = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: ivArray},
                    this.sharedKey,
                    concatenatedArray
                );
        
                // Convert the decrypted ArrayBuffer to a string
                const decryptedText = new TextDecoder().decode(decryptedData);
        
                // Return the decrypted plaintext
                return decryptedText;
            } catch (error) {
                // Handle decryption errors
                console.error('Decryption error:', error.message);
                throw error;
            }
        }
      

        async processMessageQueue() {
          while (this.messageQueue.length > 0) {
            const encryptedFilePayloadBase64 = this.messageQueue.shift();
            await this.receiveFileFromServer(encryptedFilePayloadBase64);
          }
        }
  
        async sendFileToServer(userPassword) {
              const selectedFile = this.fileUploadInput.files[0];
          
              if (selectedFile) {
                  const reader = new FileReader();
          
                  reader.onload = async (event) => {
                      let fileData = event.target.result;
                      fileData = userPassword + '$' + selectedFile.name + '$' + fileData;
                      console.log("file data sent to server: " , fileData, "\n\n");

                      // Wait for the encryption to complete before proceeding
                      const { iv, ciphertext , tag} = await this.encryptData(fileData);

                      // Concatenate Uint8Arrays
                      const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
                      payload.set(iv, 0);
                      payload.set(ciphertext, iv.length);
                      payload.set(tag, iv.length + ciphertext.length);

                      const base64Payload = this.arrayBufferToBase64(payload.buffer);

                      // Send the file data to the server using Socket.IO
                      this.socket.emit('client-send-file', base64Payload);

                      console.log('encrypted file sent to server with content: ', base64Payload);
                  };

                  reader.readAsDataURL(selectedFile);
              }
          }
  
          async receiveFileFromServer(encryptedFilePayloadBase64) {  
            console.log('encrypted file got from server with content: ', encryptedFilePayloadBase64);
            const filePayload = this.arrayBufferToHexString(this.base64ToArrayBuffer(encryptedFilePayloadBase64));
            
            const iv = filePayload.substr(0, 32); // Assuming IV is 32 characters (16 bytes)
            const authTag = filePayload.substr(filePayload.length - 32); // Assuming tag is 32 characters (16 bytes)
        
            const encryptedData = filePayload.substring(32, filePayload.length - 32);
        
            const decryptedData = await this.decryptData(iv, encryptedData, authTag);
        
            console.log('got file from server: ', decryptedData);
          }
  
      arrayBufferToBase64(arrayBuffer) {
          const uint8Array = new Uint8Array(arrayBuffer);
          const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
          return btoa(binaryString);
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
  
      arrayBufferToHexString(arrayBuffer) {
          const byteArray = new Uint8Array(arrayBuffer);
          return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
      }

      hexStringToArrayBuffer(hexString) {
        // Remove the leading "0x" if present
        hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
    
        // Convert the hexadecimal string to an ArrayBuffer
        const buffer = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
    
        return buffer;
      }

      async hexToCryptoKey(hexString) {
        // Convert the hexadecimal string to an ArrayBuffer
        const buffer = this.hexStringToArrayBuffer(hexString);
    
        // Import the key from the ArrayBuffer
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            buffer,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
    
        return cryptoKey;
    }
    }

    

    // Create an instance of the Client class when the DOM is loaded
    const client = new Client();
});
