class Client {
    constructor() {
        this.sharedKey = null;
        this.socket = null;
    }

    async init() {
        try {
            await this.initSocket(); // Initialize socket
            await this.setupEventListeners(); // Set up event listeners
            await this.waitForInitialization(); // Wait for both socket and key exchange
        } catch (error) {
            console.error(error);
        }
    }

    getSharedKey()
    {
        return this.sharedKey;
    }

    getSocket()
    {
        return this.socket;
    }

    setSharedKey(key)
    {
        this.sharedKey = key;
    }

    setSocket(socket)
    {
        this.socket = socket;
    }
    
    async waitForInitialization() {
        return new Promise((resolve, reject) => {
            const checkInitialization = () => {
                if (this.sharedKey !== null && this.socket !== null) {
                    resolve(); // Resolve when both key exchange and socket initialization are done
                } else {
                    setTimeout(checkInitialization, 100); // Check again after a short delay
                }
            };
            checkInitialization();
        });
    }

    async setupEventListeners() {

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('server-public-key', async (serverPublicKeyBase64) => {
            await this.performKeyExchange(serverPublicKeyBase64);
        });
    }

    printDetails()
    {
        console.log(this.sharedKey);
        console.log(this.socket);
    }

    async initSocket() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js';
            script.onload = () => {
                this.socket = io();
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load socket.io library'));
            };
            document.head.appendChild(script);
        });
    }

    async performKeyExchange(serverPublicKeyBase64) {
        return new Promise(async (resolve, reject) => {
            try {
                const keyPair = await window.crypto.subtle.generateKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256"
                    },
                    true,
                    ["deriveKey", "deriveBits"]
                );
    
                const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
                const clientPublicKeyBase64 = arrayBufferToBase64(clientPublicKey);
    
                this.socket.emit('client-public-key', clientPublicKeyBase64);
    
                const importedServerPublicKey = await window.crypto.subtle.importKey(
                    "raw",
                    base64ToArrayBuffer(serverPublicKeyBase64),
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
    
                this.sharedKey = await window.crypto.subtle.deriveBits(
                    sharedSecretAlgorithm,
                    keyPair.privateKey,
                    256
                );
    
                this.sharedKey = await hexToCryptoKey(arrayBufferToHexString(this.sharedKey));
    
                resolve(); // Resolve the promise to indicate key exchange completion
            } catch (error) {
                reject(error); // Reject with error if key exchange fails
            }
        });
    }

    // Function to send payload to the server
    async sendToServerPayload(data) {
        const { iv, ciphertext, tag } = await this.encryptData(data);
        const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
        payload.set(iv, 0);
        payload.set(ciphertext, iv.length);
        payload.set(tag, iv.length + ciphertext.length);
        const base64Payload = arrayBufferToBase64(payload.buffer);
        return base64Payload;
    }

    async receivePayloadFromServer(ServerPayload) { 
        const payload = base64ToArrayBuffer(ServerPayload);
        return await this.decryptData(payload);
    }

    async encryptData(data) {    
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

    async decryptData(payload) {    
        try {
            // Decrypt the data using AES-GCM
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: payload.slice(0, 16)},
                this.sharedKey,
                payload.slice(16)
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
}

// Utility functions

async function hexToCryptoKey(hexString) {
    const keyData = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(keyData),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
    return cryptoKey;
}

function arrayBufferToBase64(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const arrayBuffer = new ArrayBuffer(length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
    }

    return arrayBuffer;
}

function arrayBufferToHexString(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBase64(hexString) {
    // Convert the hexadecimal string to an ArrayBuffer
    const buffer = hexStringToArrayBuffer(hexString);

    // Convert the ArrayBuffer to a Uint8Array
    const uint8Array = new Uint8Array(buffer);

    // Convert the Uint8Array to a binary string
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }

    // Encode the binary string as base64
    return btoa(binaryString);
}

// Function to convert a hexadecimal string to an ArrayBuffer
function hexStringToArrayBuffer(hexString) {
    // Remove the leading "0x" if present
    hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

    // Convert the hexadecimal string to an ArrayBuffer
    const buffer = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;

    return buffer;
}

function base64ToHex(base64String) {
    // Decode the base64 string
    const binaryString = atob(base64String);

    // Convert the binary string to a Uint8Array
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Convert the Uint8Array to a hexadecimal string
    let hexString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        hexString += uint8Array[i].toString(16).padStart(2, '0');
    }

    return hexString;
}