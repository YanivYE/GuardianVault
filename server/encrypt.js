const NodeRSA = require('node-rsa');

class Encrypt {
    constructor(publicKey) {
        this.publicKey = new NodeRSA(publicKey, 'public');
    }
  
    encrypt(data) {
        return this.publicKey.encrypt(data, 'base64');
    }
}

module.exports = Encrypt;