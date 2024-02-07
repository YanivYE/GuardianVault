const sharedKey = sessionStorage.getItem('sharedKey');

async function encryptData(data) {
    try {
        // Convert sharedKey from string to ArrayBuffer
        const sharedKeyArrayBuffer = base64ToArrayBuffer(sharedKey);

        // Import the key from the ArrayBuffer
        const importedSharedKey = await crypto.subtle.importKey(
            "raw",
            sharedKeyArrayBuffer,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );

        // Generate a random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Convert the text to ArrayBuffer
        const arrayBufferData = new TextEncoder().encode(data);

        // Encrypt the data using AES-GCM
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            importedSharedKey,
            arrayBufferData
        );

        // Get the ciphertext and authentication tag
        const ciphertext = new Uint8Array(encryptedData);
        const tag = new Uint8Array(encryptedData.slice(-16));

        return { iv, ciphertext, tag };
    } catch (error) {
        // Handle encryption errors
        console.error('Encryption error:', error.message);
        throw error;
    }
}

async function decryptData(ivHex, ciphertextHex, tagHex) {
    try {
        const ivArray = hexStringToArrayBuffer(ivHex);
        const ciphertextArray = hexStringToArrayBuffer(ciphertextHex);
        const tagArray = hexStringToArrayBuffer(tagHex);

        // Convert sharedKey from string to ArrayBuffer
        const sharedKeyArrayBuffer = base64ToArrayBuffer(sharedKey);

        // Import the key from the ArrayBuffer
        const importedSharedKey = await crypto.subtle.importKey(
            "raw",
            sharedKeyArrayBuffer,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );

        // Decrypt the data using AES-GCM
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivArray},
            importedSharedKey,
            ciphertextArray.concat(tagArray)
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

function hexStringToArrayBuffer(hexString) {
    // Remove the leading "0x" if present
    hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

    // Convert the hexadecimal string to an ArrayBuffer
    const buffer = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;

    return buffer;
  }