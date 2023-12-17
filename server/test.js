const crypto = require('crypto');

const message = 'This is a message to be signed';

// Create a sign object using the 'RSA-SHA256' algorithm
const sign = crypto.createSign('RSA-SHA256');

// Update the sign object with the message to be signed
sign.update(message);

// Generate the fake private key (replace this with your real private key)
const fakePrivateKey = `
-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgF9gWWdUg4+YBpBFsZpIbBydGKV+AduTMMraYmK+e9wIhlSk7kRo
hyLKGPyFQrHFhlHGIvx0WKzNxbm/QkTlu4YY3Ncut4jUm6FyXBkAl+X3swHqe2gZ
IAMk+v6KkvM5b/zydpyz07qoqAMlRNNp8oT8SzqkLOPm2djdad61ra7NAgMBAAEC
gYAz7l4/qQDJWtmYDJqbivtyyQb2dRnF2OskSKxxX45JTEr4I6WokdGi26+nL1gV
O5vbQqsiEqeFz7TtYnpO0Ve9DD25LQuTrk2ZWR4pOcL41wqRaZFcpin9Tfeqrh+W
k8fXZwF7bhBaQnTAT/iRWPGSXbHPrHuzuLyg+s3EJkoAgQJBALRAl+8staD0iT2u
ZZpBI047rbY2nlaIMFMK62DRFPhm3pTKDen13zrYNfZBIWxBlIZcBIapL1l8hwFK
XQGcmaUCQQCHdN2TIRo9izRHrdPTwbFmqlGtjFdD4TuIho3FC6uNWbuD64ADYCo1
fOgYe0NxHZas1EjPECwgbkRZE27ZeKgJAkEAgZkvpDdxH5iyVDbftli/GbCu5SPA
FFc2534iXin1+eN8hV4BQwYUyipKIhQSA9PjBfeDCY77DEwMhVECLfZ6QQJAIfRd
hoAJv9uhI0ajjrVC7uVKzCIdzdorvjFcYERooGoZ4xupXy8/5WCGHXzojvZHytL7
3UvEg+ygHWQNqV3hYQJAFVvaD073jte/1tToB6SU4DTwJ7z4GnlFjb45vgp/mK1J
dqJMI0Ff7CyKGwqRacV4pNXxTUH/AcybUkTfFtbobQ==
-----END RSA PRIVATE KEY-----`;

console.log(typeof(fakePrivateKey));
// Sign the message using the fake private key
const signature = sign.sign(fakePrivateKey, 'hex');

console.log('Signature:', signature);