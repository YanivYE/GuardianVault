class KeyExchange 
{
    async performKeyExchange(socket, serverPublicKeyBase64) {
      console.log('Exchanging Keys');
  
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      );

      const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);

      const clientPublicKeyBase64 = this.arrayBufferToBase64(clientPublicKey);

      console.log('sent to server:', clientPublicKeyBase64);
      socket.emit('client-public-key', clientPublicKeyBase64);

      const importedServerPublicKey = await window.crypto.subtle.importKey(
        "raw",
        this.base64ToArrayBuffer(serverPublicKeyBase64),
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        []
      );

      const sharedSecretAlgorithm = {
        name: 'ECDH',
        namedCurve: 'P-256',
        public: importedServerPublicKey
      };

      let sharedSecret = await window.crypto.subtle.deriveBits(
        sharedSecretAlgorithm,
        keyPair.privateKey,
        256
      );

      sharedSecret = this.arrayBufferToHexString(sharedSecret);
      // hex type
      console.log("Computed shared secret:", sharedSecret);

      sharedSecret = new TextEncoder().encode(sharedSecret);

      console.log("Computed shared secret:", sharedSecret);
      // Once the key exchange is complete, set the flag to true

      console.log('Key exchange completed.');

      return sharedSecret;
    }
}
  
module.exports = KeyExchange;