var script = document.createElement('script');

// Set the source attribute to the CryptoJS library URL
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';

// Append the <script> element to the document's <head> or <body>
document.head.appendChild(script);
let sharedKey = null;
script.onload = function() {
    var encryptedSharedKey = sessionStorage.getItem('sharedKey');

    var decryptedSharedKey = CryptoJS.AES.decrypt(encryptedSharedKey, "GuardianVaultSharedKeyEncryption");

    sharedKey = decryptedSharedKey.toString(CryptoJS.enc.Utf8);
    // Call async function within an async context
    (async () => {
    sharedKey = await hexToCryptoKey(sharedKey);
    // Now `sharedKey` is a CryptoKey
    })();  
};

async function sendToServerPayload(data) {
    // Wait for the encryption to complete before proceeding
    const { iv, ciphertext , tag} = await encryptData(data);

    // Concatenate Uint8Arrays
    const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
    payload.set(iv, 0);
    payload.set(ciphertext, iv.length);
    payload.set(tag, iv.length + ciphertext.length);

    const base64Payload = arrayBufferToBase64(payload.buffer);

    return base64Payload;
}

async function receivePayloadFromServer(ServerPaylaod) {  
    console.log('encrypted file got from server with content: ', ServerPaylaod);
    const payload = arrayBufferToHexString(base64ToArrayBuffer(ServerPaylaod));
    
    const iv = payload.substr(0, 32); // Assuming IV is 32 characters (16 bytes)
    const authTag = payload.substr(payload.length - 32); // Assuming tag is 32 characters (16 bytes)

    const encryptedData = payload.substring(32, payload.length - 32);

    const decryptedData = await decryptData(iv, encryptedData, authTag);

    console.log('got file from server: ', decryptedData);
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

async function decryptData(ivHex, ciphertextHex, tagHex) {    
    try {
        const ivArray = hexStringToArrayBuffer(ivHex);
        const ciphertextArray = hexStringToArrayBuffer(ciphertextHex);
        const tagArray = hexStringToArrayBuffer(tagHex);

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
            sharedKey,
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

function hexStringToArrayBuffer(hexString) {
    // Remove the leading "0x" if present
    hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

    // Convert the hexadecimal string to an ArrayBuffer
    const buffer = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;

    return buffer;
}

async function hexToCryptoKey(hexString) {
    // Convert the hexadecimal string to an ArrayBuffer
    const buffer = hexStringToArrayBuffer(hexString);

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

