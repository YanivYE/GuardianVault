const DriveHandler = require("./DriveHandler");
const sharedCryptography = require("./CryptographyTunnel");

class FileHandler
{
    constructor(socket, fileName, username, password)
    {
        this.socket = socket;
        this.fileName = fileName;
        this.fileContent = "";
        this.DriveHandler = new DriveHandler.DriveHandler(username, password);
    }

    generateServerPayload(data) {
        const { iv, ciphertext, authTag } = sharedCryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag.toString('hex');
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        return payloadBase64;
    }

    assembleFileContent(fileChunk, isLastChunk)
    {
        this.fileContent += fileChunk;
        if(isLastChunk)
        {
            this.uploadFile();
        }
        this.socket.emit('uploadBlockResult', 'Success');
    }

    async uploadFile() {
        try {
            // Assuming this.fileName and this.fileContent are available
            await this.DriveHandler.handleFileUpload(this.fileName, this.fileContent);
        
            // Emit the success result
            this.socket.emit('UploadFileResult', "Success");
        } catch (error) {
            // If an error occurs during file upload or writing, emit an error result
            this.socket.emit('UploadFileResult', "Error");
            console.error('Error uploading file:', error);
        }
    }

    async downloadFile(fileOwner) {
        try {
            let offset = 0;
            const blockSize = 1024 * 500; 
    
            this.fileContent = await this.DriveHandler.handleFileDownload(this.fileName, fileOwner);
    
            const fileSize = this.fileContent.length;
            const totalBlocks = Math.ceil(fileSize / blockSize);
    
            while (offset < fileSize) {
                const block = this.fileContent.slice(offset, offset + blockSize);
                const blockIndex = Math.ceil(offset / blockSize);
    
                const sendFileBlockRequest = blockIndex + '$' + block + '$' + totalBlocks;
                const fileBlockPayload = this.generateServerPayload(sendFileBlockRequest);
    
                // Wait for the upload result before sending the next block
                const uploadResult = await new Promise((resolve, reject) => {
                    this.socket.emit('fileBlock', fileBlockPayload); 
                    this.socket.once('uploadBlockResult', result => {
                        resolve(result);
                    });
                });
    
                // Check if the upload was successful
                if (uploadResult !== 'Success') {
                    console.error('Error uploading block:', uploadResult);
                    // Handle the error as needed
                    return;
                }
    
                // Move to the next block
                offset += blockSize;
            }
    
            console.log('File downloaded successfully!');
        } catch (error) {
            console.error('Error downloading file:', error);
            // Handle the error as needed
        }
    }

    initFileHandler()
    {
        this.DriveHandler.initDrive();
    }
}

module.exports = {FileHandler};