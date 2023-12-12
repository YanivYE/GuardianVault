const crypto = require('crypto');

const message = 'This is a message to be signed';

// Create a sign object using the 'RSA-SHA256' algorithm
const sign = crypto.createSign('RSA-SHA256');

// Update the sign object with the message to be signed
sign.update(message);

// Generate the private key
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQC9r7QVfVY5lQkYpFZ8OVGry8z3M7+V0sNTDN3eCtRYFVEss1zg
sPvjhDaCExxjKYkW0sOaIv4+MSAMKs83Bb3xQ9ZSv1tRF7OETpgLsCsw7zxC1Z7k
DVaPDo34pBxJPVq4Z+QKBoA7sRRt8RoXjGmNS+szF0LHHmmfaXVhMGDYywIDAQAB
AoGAAwZShvGw+q/GwbFXD7V+Vmi25vgFss/yXy+/vAxoJuvXebsMG0xWZB/WgJY/
GwDFJycKnQoHe1rvjW9umHjYr4I7jvgGbfSltF2S3XekLxX6bNab5JzHKdJiB3lX
A7aUnqCv+U41Zz7yHzSdVrBOPKfyC/vUEzcRvqaQivdAJECQQDiRPWZUtmLu5yxM
n7j4V/vOe2uN8K09A7+emM+tUd5CvJexCoy1GDFQ/Lq+QrKda1iMO1K7zZpLsAAp
9eXYj+ERAkEAyYiWizmcuc0KOH13vncNnlty6dI5J6q1lQv1qFy9BLj0ST7Z+3K1
7z/yZM0QJNbbgO9V9sZ3+2qYiMjojApu1QJAErA9GzZL6FnAwj22/0uLObfbLbZY
U8S9hz8C2qVRy9aIb6EPmk6WBoaCZVeF/yjtQQQKLjvAczQaAg2vp3ZJYwJAD5dC
Cn6DFf2sP1dJ/cR6yQmUkMGvVDeW46tCqLKYJw+f0nAejstQFOphuybwl2ylb+/v
YTXe7g8EHfu3y+viJwJAP2jeoGRyCB8FJGTvn2Z4T3Aht4OTcJKfe/WCpN9Ky9A0
9Wnv0JvZp+YHZHuQR2e7TY3YFhTHXcfTnOJRs0zCw==
-----END RSA PRIVATE KEY-----`;

// Sign the message using the private key
sign.end();
const signature = sign.sign(privateKey, 'base64');
console.log(signature); // Outputs the digital signature