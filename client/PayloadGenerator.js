let socket = null;
let sharedKey = null;
const expirationTime = new Date();
expirationTime.setTime(expirationTime.getTime() + (30 * 60 * 1000));

function retrieveSocketConnection()
{
    const socketInfo = localStorage.getItem('socketInfo');
    if (socketInfo) {
        const {url, id} = JSON.parse(socketInfo);
        socket = io(url, { query: { id } });
    }
}

async function retrieveClientSharedKey()
{
    const sharedKeyBase64 = localStorage.getItem('sharedKey');
    if (sharedKeyBase64) {
        const sharedKeyHex = base64ToHex(sharedKeyBase64);
        sharedKey = await hexToCryptoKey(sharedKeyHex);
    }
}

async function handleNewClientConnection() {
    await loadScript();
    socket = io();
    socket.on('connect', () => {
        const socketInfo = { url: socket.io.uri, id: socket.id }; // Include socket ID in socketInfo
        localStorage.setItem('socketInfo', JSON.stringify(socketInfo)); // Save socket info
        
        if (!sharedKey) {
            try {
                setupEventListeners();
                // Now the shared key is initialized, proceed with other operations
            } catch (error) {
                console.error(error);
            }
        }
    });
}

// Function to load the socket.io library asynchronously
function loadScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.1.3/socket.io.js';
        script.onload = () => {
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
        localStorage.setItem('sharedKey', (sharedKey));
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

    sharedKey = hexToBase64(arrayBufferToHexString(sharedKey));
}

// Function to send payload to the server
async function sendToServerPayload(data) {
    retrieveClientSharedKey();

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
    retrieveClientSharedKey();
    // Once loaded and key initialized, continue with encryption
    if (!sharedKey) {
        throw new Error('Shared key is not initialized');
    }
    const payload = base64ToArrayBuffer(ServerPayload);
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
