const { SocketHandler } = require("../server/SocketHandler");
const Cryptography = require("./Cryptography");

class MessageProcessor
{
    constructor(socket, encryptionKey)
    {
        this.socket = socket;
        this.messageQueue = []; 
        this.cryptography = new Cryptography(encryptionKey);
    }

    async processMessageQueue() {
        console.log('Processing queued messages...');
        while (this.messageQueue.length > 0) {
          const encryptedFilePayloadBase64 = this.messageQueue.shift();
          await this.receiveFileFromServer(encryptedFilePayloadBase64);
        }
      }

    async sendFileToServer() {
        const selectedFile = fileUploadInput.files[0];
      
        if (selectedFile) {
          const reader = new FileReader();
      
          reader.onload = async (event) => {
            const fileData = event.target.result;
            fileData = selectedFile.name + '$' + fileData;
            console.log(fileData, "\n\n");
      
            // Wait for the encryption to complete before proceeding
            const { iv, ciphertext , tag} = await this.cryptography.encryptData(fileData);

            // Concatenate Uint8Arrays
            const payload = new Uint8Array(iv.length + ciphertext.length + tag.length);
            payload.set(iv, 0);
            payload.set(ciphertext, iv.length);
            payload.set(tag, iv.length + ciphertext.length);

            const base64Payload = arrayBufferToBase64(payload.buffer);

  
            // Send the file data to the server using Socket.IO
            this.socket.emit('client-send-file', base64Payload);
      
            console.log('File sent to server: ', selectedFile.name, 'and content: ', base64Payload);
          };
      
          reader.readAsDataURL(selectedFile);
        }
    }

    async receiveFileFromServer(encryptedFilePayloadBase64) {  
        const filePayload = arrayBufferToHexString(base64ToArrayBuffer(encryptedFilePayloadBase64));
        
        const iv = filePayload.substr(0, 32);
        const encryptedData = filePayload.substr(32, filePayload.length - 64);
        const authTag = filePayload.substr(filePayload.length - 32, 32);

        const decryptedData = this.cryptography.decryptData(iv, encryptedData, authTag);

        console.log('got file from server: ', decryptedData);
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

module.exports = MessageProcessor;