const crypto = require('crypto');

class CryptographyTunnel {
    constructor(encryptionKey) {
        this.aesGcmKey = encryptionKey;
    }

    generateServerPayload(data) {
        const { iv, ciphertext, authTag } = this.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag.toString('hex');
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        return payloadBase64;
    }

    recieveClientPayload(clientPayload)
    {
        const payload = Buffer.from(clientPayload, 'base64').toString('hex');
        
        const iv = payload.substr(0, 32);   
        const encryptedData = payload.substr(32, payload.length - 96);
        const authTag = payload.substr(payload.length - 32, 32);
        
        const decryptedData = this.decryptData(iv, encryptedData, authTag);

        return decryptedData;
    }

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

    generateCSRFToken()
    {
        const token = crypto.randomBytes(32).toString('hex');
        return token;
    }
}

// Export an instance of CryptographyTunnel directly
module.exports = {CryptographyTunnel};
