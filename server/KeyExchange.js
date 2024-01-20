const crypto = require('crypto');

async function performKeyExchange(socket) {
    return new Promise((resolve, reject) => {
      console.log('Exchanging keys');
  
      const serverDH = crypto.createECDH('prime256v1');
      serverDH.generateKeys();
  
      const serverPublicKeyBase64 = serverDH.getPublicKey('base64');
  
      console.log('sent key to client: ', serverPublicKeyBase64);
      socket.emit('server-public-key', serverPublicKeyBase64);
  
      socket.on('client-public-key', async (clientPublicKeyBase64) => {
        try {
          console.log('received key from client: ', clientPublicKeyBase64);
          const sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');
          console.log("Computed Shared Secret: ", sharedSecret); 
  
          // Use PBKDF2 to derive keys for AES-GCM and integrity with different salts
          const salt = crypto.randomBytes(16);
          const iterations = 100000; // Adjust the number of iterations as needed
  
          console.log('server salt sent: ', salt.toString('hex'));
  
          // Derive keyMaterial using SHA-256
          //const keyMaterial = crypto.createHash('sha256').update(sharedSecret, 'hex').digest();
          const keyMaterial = crypto.pbkdf2Sync(sharedSecret, salt, iterations, 32, 'SHA-256');
          //console.log(keyMaterial);
          console.log('Key Material: ', keyMaterial.toString('hex'));
  
          // send salt to client
          
          socket.emit('salt', JSON.stringify({ type: 'salt', salt: salt.toString('hex') }));
  
          aesGcmKey = crypto.pbkdf2Sync(keyMaterial, '', 1, 32, 'sha256');
          integrityKey = crypto.pbkdf2Sync(keyMaterial, '', 1, 32, 'sha256');
  
          console.log('aesGcmKey:', aesGcmKey.toString('hex'));
          console.log('integrityKey:', integrityKey.toString('hex'));
  
          resolve(); // Resolve the promise once key exchange is complete
        } catch (err) {
          reject(err); // Reject the promise if any error occurs
        }
      });
    });
}

module.exports = { performKeyExchange };