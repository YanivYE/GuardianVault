import crypto from 'crypto';

function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

function performKeyExchange(socket, serverPublicKey) {
  const dh = crypto.createDiffieHellman(256);
  dh.generateKeys();
  socket.emit('exchange-keys', { clientPublicKey: dh.getPublicKey('hex') });

  const sharedSecret = dh.computeSecret(Buffer.from(serverPublicKey, 'base64'));
  return {
    dh,
    sharedSecret,
  };
}

function encryptWithSharedSecret(sharedSecret, data) {
  const cipher = crypto.createCipheriv('aes-256-cbc', sharedSecret, Buffer.from('0123456789abcdef0'));
  return Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]).toString('base64');
}

function decryptWithPrivateKey(privateKey, data) {
  const decryptedData = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  }, Buffer.from(data, 'base64'));
  return decryptedData.toString('utf8');
}

const socket = io.connect('http://localhost:8201');
const clientKeyPair = generateKeyPair();

socket.on('public-key', (serverPublicKey) => {
  const { dh, sharedSecret } = performKeyExchange(socket, serverPublicKey);

  const data = 'Hello, Server!';
  const encryptedData = encryptWithSharedSecret(sharedSecret, data);
  socket.emit('client-message', encryptedData);

  socket.on('server-message', (encryptedResponse) => {
    const response = decryptWithPrivateKey(clientKeyPair.privateKey, encryptedResponse);
    console.log('Received and decrypted response:', response);
  });
});