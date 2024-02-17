const DriveHandler = require("./DriveHandler");
const fs = require('fs');
const path = require('path');

class FileHandler
{
    constructor(socket, fileName, username, password)
    {
        this.socket = socket;
        this.fileName = fileName;
        this.fileContent = "";
        this.DriveHandler = new DriveHandler.DriveHandler(username, password);
    }

    assembleFileContent(fileChunk, isLastChunk)
    {
        this.fileContent += fileChunk;
        if(isLastChunk)
        {
            this.uploadFile();
        }
        this.socket.emit('uploadChunkResult', 'Success');
        
    }

    async uploadFile() {
        try {
            console.log(this.fileContent);
            const comprFilePath = path.join(__dirname, this.fileName);
            fs.writeFileSync(comprFilePath, this.fileContent);

            // Assuming this.fileName and this.fileContent are available
            await this.DriveHandler.handleFileUpload(this.fileName, this.fileContent);
    
            // Write the file to the current directory
    
            // Emit the success result
            this.socket.emit('UploadFileResult', "Success");
        } catch (error) {
            // If an error occurs during file upload or writing, emit an error result
            this.socket.emit('UploadFileResult', "Error");
            console.error('Error uploading file:', error);
        }
    }
}

module.exports = {FileHandler};