const crypto = require('crypto');

class Decrypt {
    constructor(privateKey) 
    {
        this.privateKey = privateKey;
    }
  
    decrypt(encryptedData) {
        const bufferData = Buffer.from(encryptedData, 'base64');
        const decryptedData = crypto.privateDecrypt(this.privateKey, bufferData);
        return decryptedData.toString();
    }
  }