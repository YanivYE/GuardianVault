class FileHandler {
    constructor(socket, crypto, DriveHandler, MalwareDetector) {
        // Initialize class properties
        this.socket = socket;
        this.DriveHandler = DriveHandler;
        this.MalwareDetector = MalwareDetector;
        this.crypto = crypto;
        this.fileContent = "";
        this.fileName = "";
        this.username = "";
        this.encryptionPassword = "";
    }

    // Assemble file content from chunks
    assembleFileContent(fileChunk, isLastChunk) {
        this.fileContent += fileChunk;
        if (isLastChunk) {
            this.uploadFile(); // If it's the last chunk, upload the file
        }
        return 'Success';
    }

    // Set details required for file upload
    setUploadDetails(fileName, username, password) {
        // Initialize file content, filename, username, and encryption password
        this.fileContent = "";
        this.fileName = fileName;
        this.username = username;
        this.encryptionPassword = password;
    }

    // Upload file to the drive asynchronously
    async uploadFile() {
        try {
            await this.DriveHandler.handleFileUpload(this.fileName, this.fileContent, this.encryptionPassword, this.username);
        } catch (error) {
            console.error('Error uploading file:', error);
            // Handle upload errors
        }
    }

    // Download file from the drive asynchronously
    async downloadFile(fileName, dirName, decryptionPassword) {
        try {
            let offset = 0;
            const blockSize = 1024 * 500; // 500KB 
            // Retrieve file content from the drive
            this.fileContent = await this.DriveHandler.handleFileDownload(fileName, dirName, decryptionPassword);
            const fileSize = this.fileContent.length;
            const totalBlocks = Math.ceil(fileSize / blockSize);

            // Send file blocks recursively
            const sendNextBlock = () => {
                if (offset < fileSize) {
                    const block = this.fileContent.slice(offset, offset + blockSize);
                    const blockIndex = Math.ceil(offset / blockSize);
                    const sendFileBlockRequest = blockIndex + '$' + block + '$' + totalBlocks;
                    const fileBlockPayload = this.crypto.generateServerPayload(sendFileBlockRequest);
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
            // Handle download errors
        }
    }
}

module.exports = { FileHandler };
