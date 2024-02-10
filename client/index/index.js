document.addEventListener("DOMContentLoaded", () => {
    class Client {
          constructor() {
            this.socket = io({
              query: {
                newUser: true
              }
            });
            this.setupEventListeners();
        }

        setupEventListeners() {            
            this.socket.on('connect', () =>{
              console.log('Connected to server');
            });

            this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
                this.performKeyExchange(serverPublicKeyBase64);
            });

            document.getElementById('Continue').addEventListener('click', () => {
              window.location.href = '/login';
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
        
          let sharedKey = await window.crypto.subtle.deriveBits(
            sharedSecretAlgorithm,
            keyPair.privateKey,
            256
          );
        
          // Convert shared secret to hex
          sharedKey = this.arrayBufferToHexString(sharedKey);
          console.log("Computed shared secret:", sharedKey);
          sessionStorage.setItem('sharedKey', CryptoJS.AES.encrypt(sharedKey, "GuardianVaultSharedKeyEncryption").toString());
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
    }
    
    // Create an instance of the Client class when the DOM is loaded
    const client = new Client();
});
