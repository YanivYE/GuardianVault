const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const EncryptionAtRest = require("./EncryptionAtRest");
const Compressor = require("./Compressor");
const config = require('./config');

class FileHandler 
{
    constructor(userPassword)
    {
        this.oauth2Client = new google.auth.OAuth2(
          config.CLIENT_ID,
          config.CLIENT_SECRET,
          config.REDIRECT_URI
        );
          
        this.oauth2Client.setCredentials({ refresh_token: config.REFRESH_TOKEN });
        
        this.drive = google.drive({
          version: 'v3',
          auth: this.oauth2Client,
        });

        this.atRestCrypto = new EncryptionAtRest.EncryptionAtRest(userPassword);
        this.compressor = new Compressor.Compressor();
    }

    async uploadFile(filePath) {
      try {
        // Get the file name and extension
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(filePath).substr(1); // Remove the dot
    
        // Determine the MIME type based on the file extension
        const mimeType = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          pdf: 'application/pdf',
          txt: 'text/plain',
          // Add more extensions and corresponding MIME types as needed
        }[fileExtension.toLowerCase()] || 'application/octet-stream'; // Default to binary data if not recognized
    
        const response = await this.drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: mimeType,
          },
          media: {
            mimeType: mimeType,
            body: fs.createReadStream(filePath),
          },
        });
    
        console.log('File uploaded:', response.data);
      } catch (error) {
        console.error('Error uploading file:', error.message);
      }
    }
      
    async showFiles() {
      try {
        const response = await this.drive.files.list();
        const fileIds = response.data.files.map((file) => file.id);
        console.log('Files in Google Drive:', response.data.files);
        return fileIds;
      } catch (error) {
        console.error('Error listing files:', error.message);
        return [];
      }
    }

    async saveToDrive(fileName, fileData)
    {
      const encryptedFileData = this.atRestCrypto.encryptFile(fileData);

      console.log('PBE on file: ', encryptedFileData);
      const compressedData = this.compressor.compressFile(encryptedFileData);
      const comprFilePath = path.join(__dirname, fileName + '.gz');
      fs.writeFileSync(comprFilePath, compressedData);
  
      console.log('File saved at:', comprFilePath);

      // GOOGLE DRIVE 
      
      await this.uploadFile(comprFilePath);

      const fileIds = await this.showFiles();
      console.log('File IDs in Google Drive:', fileIds);

      // Delete the file
      fs.unlink(comprFilePath, (err) => {
      if (err) {
          console.error(`Error deleting file: ${err.message}`);
      } else {
          console.log(`File ${comprFilePath} has been deleted`);
      }});
    }

    async getFromDrive(fileName)
    {
      // TODO: add drive retrieve function
      const compressedData = retrieveFromDrive(fileName);
      const decompressedData = this.compressor.decompressFile(compressedData);
      const decryptedFileData = this.atRestCrypto.decryptFile(decompressedData);
      const decompFilePath = path.join(__dirname, fileName);
      fs.writeFileSync(decompFilePath, Buffer.from(decryptedFileData.split(';base64,').pop(), 'base64'));
      
      console.log('File saved at:', decompFilePath);
    }
}

module.exports = {FileHandler};