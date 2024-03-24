import Utils from "./utils.js"

export default class Client {
    constructor() {
        this.sharedKey = null;
        this.utils = new Utils();
    }

    async performKeyExchange(socket, serverPublicKeyBase64) {
        return new Promise(async (resolve, reject) => {
            try {
                const keyPair = await window.crypto.subtle.generateKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256"
                    },
                    true,
                    ["deriveKey", "deriveBits"]
                );
    
                const clientPublicKey = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
                const clientPublicKeyBase64 = this.utils.arrayBufferToBase64(clientPublicKey);
    
                socket.emit('client-public-key', clientPublicKeyBase64);
    
                const importedServerPublicKey = await window.crypto.subtle.importKey(
                    "raw",
                    this.utils.base64ToArrayBuffer(serverPublicKeyBase64),
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
    
                this.sharedKey = await window.crypto.subtle.deriveBits(
                    sharedSecretAlgorithm,
                    keyPair.privateKey,
                    256
                );
    
                this.sharedKey = await this.utils.hexToCryptoKey(this.utils.arrayBufferToHexString(this.sharedKey));
    
                resolve(); // Resolve the promise to indicate key exchange completion
            } catch (error) {
                reject(error); // Reject with error if key exchange fails
            }
        });
    }

    // Function to send payload to the server
    async generateClientPayload(data) {
        const { iv, ciphertext, tag } = await this.encryptData(data);
        const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
        payload.set(iv, 0);
        payload.set(ciphertext, iv.length);
        payload.set(tag, iv.length + ciphertext.length);
        const base64Payload = this.utils.arrayBufferToBase64(payload.buffer);
        return base64Payload;
    }

    async receivePayloadFromServer(ServerPayload) { 
        const payload = this.utils.base64ToArrayBuffer(ServerPayload);
        return await this.decryptData(payload);
    }

    async encryptData(data) {    
        // Generate a random IV (Initialization Vector)
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Convert the text to ArrayBuffer
        const arrayBufferData = new TextEncoder().encode(data);

        // Encrypt the data using AES-GCM
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.sharedKey,
            arrayBufferData
        );

        // Get the ciphertext and authentication tag
        const ciphertext = new Uint8Array(encryptedData);
        const tag = new Uint8Array(encryptedData.slice(-16));

        return { iv, ciphertext, tag };
    }

    async decryptData(payload) {    
        try {
            // Decrypt the data using AES-GCM
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: payload.slice(0, 16)},
                this.sharedKey,
                payload.slice(16)
            );

            // Convert the decrypted ArrayBuffer to a string
            const decryptedText = new TextDecoder().decode(decryptedData);

            // Return the decrypted plaintext
            return decryptedText;
        } catch (error) {
            // Handle decryption errors
            console.error('Decryption error:', error.message);
            throw error;
        }
    }
}