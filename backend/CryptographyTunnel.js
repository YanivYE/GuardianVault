const crypto = require('crypto');

class CryptographyTunnel {
    constructor(encryptionKey) {
        this.aesGcmKey = encryptionKey;
    }

    // Generates a payload to send to the server
    generateServerPayload(data) {
        // Encrypt data
        const { iv, ciphertext, authTag } = this.encryptData(data);

        // Concatenate IV, ciphertext, and authentication tag
        const payload = iv.toString('hex') + ciphertext + authTag.toString('hex');

        // Convert payload to base64
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        return payloadBase64;
    }

    // Decrypts the payload received from the client
    recieveClientPayload(clientPayload) {
        // Convert base64 payload to hex
        const payload = Buffer.from(clientPayload, 'base64').toString('hex');
        
        // Extract IV, encrypted data, and authentication tag
        const iv = payload.substr(0, 32);   
        const encryptedData = payload.substr(32, payload.length - 96);
        const authTag = payload.substr(payload.length - 32, 32);
        
        // Decrypt data
        const decryptedData = this.decryptData(iv, encryptedData, authTag);

        return decryptedData;
    }

    // Encrypts data using AES-GCM algorithm
    encryptData(data) {
        // Generate a random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);
        
        // Create a cipher instance
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.aesGcmKey, 'hex'), iv, { authTagLength: 16 });
        
        // Update the cipher with the data
        const encrypted = cipher.update(data, 'utf-8', 'hex');
    
        // Finalize the cipher to obtain the authentication tag
        cipher.final();
    
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
    
        // Return the IV, ciphertext, and authentication tag
        return { iv: iv, ciphertext: encrypted, authTag: authTag };
    }

    // Decrypts data using AES-GCM algorithm
    decryptData(iv, ciphertext, tag) {
        // Create the AES-GCM decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.aesGcmKey, 'hex'), Buffer.from(iv, 'hex'));

        // Set the authentication tag
        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        // Update the decipher with the ciphertext
        const decryptedData = decipher.update(ciphertext, 'hex', 'utf-8');

        // Return the decrypted plaintext
        return decryptedData;
    }

    // Generates a CSRF token
    generateCSRFToken() {
        const token = crypto.randomBytes(32).toString('hex');
        return token;
    }
}

// Export an instance of CryptographyTunnel directly
module.exports = { CryptographyTunnel };
