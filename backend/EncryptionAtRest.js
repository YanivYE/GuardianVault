const crypto = require('crypto');

class EncryptionAtRest {
    constructor() {
    }

    // Derive encryption key from password and salt
    deriveKeyFromPassword(salt, password) {
        return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // Adjust iterations and key length as needed
    }

    // Encrypt file data with password
    encryptFile(data, password) {
        // Generate a random salt and IV (Initialization Vector)
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16);

        // Derive encryption key from password and salt
        const key = this.deriveKeyFromPassword(salt, password);

        // Create a cipher with AES-256-GCM algorithm
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        // Encrypt the data
        const encryptedContent = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

        // Get authentication tag for GCM mode
        const tag = cipher.getAuthTag();

        // Concatenate salt, IV, tag, and encrypted content
        return Buffer.concat([salt, iv, tag, encryptedContent]);
    }

    // Decrypt file data with password
    decryptFile(encryptedFileData, password) {
        // Extract salt, IV, tag, and encrypted data from the encrypted file data
        const salt = encryptedFileData.slice(0, 16);
        const iv = encryptedFileData.slice(16, 32);
        const tag = encryptedFileData.slice(32, 48);
        const encryptedData = encryptedFileData.slice(48);

        // Derive decryption key from password and salt
        const key = this.deriveKeyFromPassword(salt, password);

        // Create a decipher with AES-256-GCM algorithm
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

        // Set authentication tag for GCM mode
        decipher.setAuthTag(tag);

        // Decrypt the data
        const decryptedContent = Buffer.concat([decipher.update(encryptedData)]);

        // Convert decrypted content to UTF-8 string
        return decryptedContent.toString('utf8');
    }
}

module.exports = { EncryptionAtRest };
