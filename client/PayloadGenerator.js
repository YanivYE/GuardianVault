let socket = null;
let sharedKey = null;


async function handleNewClientConnection() {
    if (!sharedKey) {
        try {
            await loadScript();
            setupEventListeners();
            // Now the shared key is initialized, proceed with other operations
        } catch (error) {
            console.error(error);
        }
    }
}

// Function to load the socket.io library asynchronously
function loadScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js';
        script.onload = () => {
            socket = io({
                query: {
                    newUser: true
                }
            });
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Failed to load socket.io library'));
        };
        document.head.appendChild(script);
    });
}

function setupEventListeners() {            
    socket.on('connect', () =>{
        console.log('Connected to server');
    });

    socket.on('server-public-key', async (serverPublicKeyBase64) => {
        await performKeyExchange(serverPublicKeyBase64);
    });
}

async function performKeyExchange(serverPublicKeyBase64) {     
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
    const clientPublicKeyBase64 = arrayBufferToBase64(clientPublicKey);

    socket.emit('client-public-key', clientPublicKeyBase64);

    // Import server public key
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

    // Derive shared secret
    const sharedSecretAlgorithm = {
        name: 'ECDH',
        namedCurve: 'P-256',
        public: importedServerPublicKey
    };

    sharedKey = await window.crypto.subtle.deriveBits(
        sharedSecretAlgorithm,
        keyPair.privateKey,
        256
    );

    sharedKey = await hexToCryptoKey(arrayBufferToHexString(sharedKey));

    console.log(sharedKey);
}

// Function to send payload to the server
async function sendToServerPayload(data) {
    // Once loaded and key initialized, continue with encryption
    if (!sharedKey) {
        throw new Error('Shared key is not initialized');
    }
    const { iv, ciphertext, tag } = await encryptData(data);
    const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
    payload.set(iv, 0);
    payload.set(ciphertext, iv.length);
    payload.set(tag, iv.length + ciphertext.length);
    const base64Payload = arrayBufferToBase64(payload.buffer);
    return base64Payload;
}

async function receivePayloadFromServer(ServerPayload) {  
    // Once loaded and key initialized, continue with encryption
    if (!sharedKey) {
        throw new Error('Shared key is not initialized');
    }
    const payload = base64ToArrayBuffer(serverPayload);
    return await decryptData(payload);
}

async function encryptData(data) {    
    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Convert the text to ArrayBuffer
    const arrayBufferData = new TextEncoder().encode(data);

    // Encrypt the data using AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedKey,
        arrayBufferData
    );

    // Get the ciphertext and authentication tag
    const ciphertext = new Uint8Array(encryptedData);
    const tag = new Uint8Array(encryptedData.slice(-16));

    return { iv, ciphertext, tag };
}

async function decryptData(payload) {    
    try {
        // Decrypt the data using AES-GCM
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: payload.slice(0, 16)},
            sharedKey,
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

