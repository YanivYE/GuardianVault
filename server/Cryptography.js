const crypto = require('crypto');

class Cryptography 
{
    constructor()
    {
        this.aesGcmKey = null;
        this.integrityKey = null;
    }

    async encryptWithAESGCM(text) 
    {
    // Generate a random IV (Initialization Vector)
    const iv = crypto.randomBytes(12);

    // Create the AES-GCM cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', aesGcmKey, iv);

    // Update the cipher with the plaintext
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // Get the authentication tag
    const tag = cipher.getAuthTag();

    // Return the IV, ciphertext, and authentication tag
    return { iv, ciphertext: encryptedBuffer, tag };
    }

    async decryptWithAESGCM(iv, ciphertext, tag) {
    // Create the AES-GCM decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesGcmKey, iv);

    // Set the authentication tag
    decipher.setAuthTag(tag);

    // Update the decipher with the ciphertext
    const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Return the decrypted plaintext
    return decryptedBuffer.toString('utf8');
    }
}