// Import required module
const crypto = require('crypto');

function performKeyExchange(socket) {
    return new Promise((resolve, reject) => {
        // Create ECDH instance using prime256v1 curve
        const serverDH = crypto.createECDH('prime256v1');
        // Generate server's keys
        serverDH.generateKeys();
        
        // Get server's public key in base64 format
        const serverPublicKeyBase64 = serverDH.getPublicKey('base64');
        
        // Emit server's public key to the client
        socket.emit('server-public-key', serverPublicKeyBase64);
        
        // Listen for client's public key
        socket.on('client-public-key', async (clientPublicKeyBase64) => {
            try {
                // Compute shared secret using client's public key
                const sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
                // Resolve the promise with the shared secret
                resolve(sharedSecret);
            } catch (err) {
                // Reject the promise if an error occurs
                reject(err);
            }
        });
    });
}

// Export the function for use in other modules
module.exports = { performKeyExchange };
