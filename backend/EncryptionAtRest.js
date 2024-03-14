const crypto = require('crypto');

class EncryptionAtRest {
    constructor() {
    }

    // use PBE - password based encryption
    deriveKeyFromPassword(salt, password) {
        return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // Adjust iterations and key length as needed
    }

    encryptFile(data, password) {
        const salt = crypto.randomBytes(16); // Generate a random salt
        const iv = crypto.randomBytes(16); // Generate a random iv

        const key = this.deriveKeyFromPassword(salt, password);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); // Use static iv

        const encryptedContent = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encryptedContent]);
    }

    decryptFile(encryptedFileData, password) {
        const salt = encryptedFileData.slice(0, 16);
        const iv = encryptedFileData.slice(16, 32);
        const tag = encryptedFileData.slice(32, 48);
        const encryptedData = encryptedFileData.slice(48);

        const key = this.deriveKeyFromPassword(salt, password);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv); // Use static iv
        decipher.setAuthTag(tag);

        const decryptedContent = Buffer.concat([decipher.update(encryptedData)]);
        return decryptedContent.toString('utf8');
    }
}

module.exports = { EncryptionAtRest };
