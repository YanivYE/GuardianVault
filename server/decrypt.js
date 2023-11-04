const NodeRSA = require('node-rsa');

class Decrypt {
    constructor(privateKey) {
        this.privateKey = new NodeRSA(privateKey, 'private');
    }
  
    decrypt(encryptedData) {
        return this.privateKey.decrypt(encryptedData, 'utf8');
    }
}

module.exports = Decrypt;
