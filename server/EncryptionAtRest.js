const crypto = require('crypto');

class EncryptionAtRest
{
    constructor(userPassword)
    {
        this.password = userPassword;
    }

    deriveKeyFromPassword(salt) 
    {
        return crypto.pbkdf2Sync(this.password, salt, 100000, 32, 'sha256'); // Adjust iterations and key length as needed
    }
    
    encryptFile(data) 
    {
        const salt = crypto.randomBytes(16); // Generate a random salt
        const key = this.deriveKeyFromPassword(salt);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, crypto.randomBytes(16));

        const encryptedContent = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, tag, encryptedContent]);
    }
    
    decryptFile(encryptedData) 
    {
        const salt = encryptedData.slice(0, 16);
        const tag = encryptedData.slice(16, 32);
        const encryptedData = encryptedData.slice(32);

        const key = this.deriveKeyFromPassword(salt);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, crypto.randomBytes(16));
        decipher.setAuthTag(tag);

        const decryptedContent = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decryptedContent.toString('utf8');
    }
}

module.exports = { EncryptionAtRest };