const DriveHandler = require("./DriveHandler");
const sharedCryptography = require("./Crypto");

class FileHandler
{
    constructor(socket)
    {
        this.socket = socket;
        this.fileContent = "";
        this.DriveHandler = new DriveHandler.DriveHandler();
        this.fileName = "";
        this.username = "";
        this.encryptionPassword = "";
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

    setUploadDetails(fileName, username, password)
    {
        this.fileName = fileName;
        this.username = username;
        this.encryptionPassword = password;
    }

    async uploadFile() {
        try {
            // Assuming this.fileName and this.fileContent are available
            await this.DriveHandler.handleFileUpload(this.fileName, this.fileContent, this.encryptionPassword, this.username);
        
            // Emit the success result
            this.socket.emit('UploadFileResult', "Success");
        } catch (error) {
            // If an error occurs during file upload or writing, emit an error result
            this.socket.emit('UploadFileResult', "Error");
            console.error('Error uploading file:', error);
        }
    }

    async downloadFile(fileName, dirName, decryptionPassword) {
        try {
            let offset = 0;
            const blockSize = 1024 * 500; // 500KB 
    
            this.fileContent = await this.DriveHandler.handleFileDownload(fileName, dirName, decryptionPassword);
    
            const fileSize = this.fileContent.length;
            const totalBlocks = Math.ceil(fileSize / blockSize);
    
            const sendNextBlock = () => {
                if (offset < fileSize) {
                    const block = this.fileContent.slice(offset, offset + blockSize);
                    const blockIndex = Math.ceil(offset / blockSize);
    
                    const sendFileBlockRequest = blockIndex + '$' + block + '$' + totalBlocks;
                    const fileBlockPayload = sharedCryptography.generateServerPayload(sendFileBlockRequest);
    
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