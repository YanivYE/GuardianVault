const crypto = require('crypto');

class Encrypt{
    constructor(privateKey)
    {
        this.privateKey = privateKey;
    }

    encrypt(data) {
        const bufferData = Buffer.from(data);
        const encryptedData = crypto.publicEncrypt(this.publicKey, bufferData);
        return encryptedData.toString('base64');
    }
}