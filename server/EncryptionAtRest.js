const crypto = require('crypto');

class EncryptionAtRest
{
    constructor(userPassword)
    {
        this.password = userPassword;
        this.iv = crypto.randomBytes(16);
    }

    // use PBE - password based encryption
    deriveKeyFromPassword(salt) 
    {
        return crypto.pbkdf2Sync(this.password, salt, 100000, 32, 'sha256'); // Adjust iterations and key length as needed
    }
    
    encryptFile(data) 
    {
        const salt = crypto.randomBytes(16); // Generate a random salt
        const key = this.deriveKeyFromPassword(salt);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, this.iv);

        const encryptedContent = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, tag, encryptedContent]);
    }
    
    decryptFile(encryptedFileData) 
    {
        const salt = encryptedFileData.slice(0, 16);
        const tag = encryptedFileData.slice(16, 32);
        const encryptedData = encryptedFileData.slice(32);

        const key = this.deriveKeyFromPassword(salt);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, this.iv);
        decipher.setAuthTag(tag);

        const decryptedContent = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decryptedContent.toString('utf8');
    }
}

module.exports = { EncryptionAtRest };