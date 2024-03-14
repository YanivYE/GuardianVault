// Utility functions
export default class Utils
{
    constructor() {}
    
    async hexToCryptoKey(hexString) {
        const keyData = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            new Uint8Array(keyData),
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
        return cryptoKey;
    }

    arrayBufferToBase64(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const arrayBuffer = new ArrayBuffer(length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
        }

        return arrayBuffer;
    }

    arrayBufferToHexString(arrayBuffer) {
        const byteArray = new Uint8Array(arrayBuffer);
        return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}