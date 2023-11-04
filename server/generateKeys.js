const NodeRSA = require('node-rsa');
const fs = require('fs');

const key = new NodeRSA({ b: 2048 }); // Adjust the key size as needed

const privateKey = key.exportKey('private');
const publicKey = key.exportKey('public');

fs.writeFileSync('private.pem', privateKey, 'utf-8');
fs.writeFileSync('public.pem', publicKey, 'utf-8');

console.log('RSA keys generated and saved to private.pem and public.pem.');
