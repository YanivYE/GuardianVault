class Cryptography
{
    constructor(encryptionKey)
    {
        this.aesGcmKey = encryptionKey;
    }

    async encryptData(data) 
    {
        // Generate a random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(16));
        
        // Convert the text to ArrayBuffer
        const arrayBufferData = new TextEncoder().encode(data);
        
        // Encrypt the data using AES-GCM
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.aesGcmKey,
            arrayBufferData
        );
        
        // Get the authentication tag (use only the first 16 bytes)
        const tag = new Uint8Array(ciphertext.slice(-16));
        
        // Convert the IV and ciphertext to hex strings
        const ivHex = Array.from(iv).map(byte => byte.toString(16).padStart(2, '0')).join('');
        const ciphertextHex = Array.from(new Uint8Array(ciphertext)).map(byte => byte.toString(16).padStart(2, '0')).join('');
        
        // Return the IV, ciphertext, and tag
        return {ivHex, ciphertextHex, tag: Array.from(tag).map(byte => byte.toString(16).padStart(2, '0')).join('') };
    }
      
    async decryptData(iv, ciphertextHex, tag) {
        try {
            // Convert hex strings to Uint8Arrays
            const ciphertextArray = Uint8Array.from(this.hexStringToArrayBuffer(ciphertextHex));
            const tagArray = Uint8Array.from(this.hexStringToArrayBuffer(tag));
        
            // Concatenate ciphertext and tag arrays
            const concatenatedArray = new Uint8Array(ciphertextArray.length + tagArray.length);
            concatenatedArray.set(ciphertextArray, 0);
            concatenatedArray.set(tagArray, ciphertextArray.length);
        
            // Decrypt the data using AES-GCM
            const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.aesGcmKey,
            concatenatedArray
            );
        
            // Convert the decrypted ArrayBuffer to a string
            const decryptedText = new TextDecoder().decode(decryptedData);
        
            // Return the decrypted plaintext
            return decryptedText;
        } catch (error) {
            // Handle decryption errors
            console.error('Decryption error:', error);
            throw error;
        }
    }

}
