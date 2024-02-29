const DriveHandler = require("./DriveHandler");
const sharedCryptography = require("./Crypto");

class FileHandler
{
    constructor(socket, username, password)
    {
        this.socket = socket;
        this.fileContent = "";
        this.DriveHandler = new DriveHandler.DriveHandler(username, password);
        this.fileName = "";
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

    setFileName(fileName)
    {
        this.fileName = fileName;
    }

    async uploadFile(fileName) {
        try {
            // Assuming this.fileName and this.fileContent are available
            await this.DriveHandler.handleFileUpload(fileName, this.fileContent);
        
            // Emit the success result
            this.socket.emit('UploadFileResult', "Success");
        } catch (error) {
            // If an error occurs during file upload or writing, emit an error result
            this.socket.emit('UploadFileResult', "Error");
            console.error('Error uploading file:', error);
        }
    }

    async downloadFile(fileName) {
        try {
            let offset = 0;
            const blockSize = 1024 * 500; // 500KB 
    
            this.fileContent = await this.DriveHandler.handleFileDownload(fileName);
    
            const fileSize = this.fileContent.length;
            const totalBlocks = Math.ceil(fileSize / blockSize);
    
            const sendNextBlock = () => {
                if (offset < fileSize) {
                    const block = this.fileContent.slice(offset, offset + blockSize);
                    const blockIndex = Math.ceil(offset / blockSize);
    
                    const sendFileBlockRequest = blockIndex + '$' + block + '$' + totalBlocks;
                    const fileBlockPayload = this.generateServerPayload(sendFileBlockRequest);
    
                    this.socket.emit('fileBlock', fileBlockPayload);
    
                    offset += blockSize;
    
                    sendNextBlock(); // Call recursively
                } else {
                    console.log('File downloaded successfully!');
                }
            };
    
            sendNextBlock(); // Start the recursive download
    
        } catch (error) {
            console.error('Error downloading file:', error);
            // Handle the error as needed
        }
    }
    
}

module.exports = {FileHandler};