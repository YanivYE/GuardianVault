const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const EncryptionAtRest = require("./EncryptionAtRest");
const Compressor = require("./Compressor");
const config = require('./Config');

class FileHandler 
{
    constructor(username, userPassword)
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
        this.dirName = username;
    }

    async createFolder() {
        const {GoogleAuth} = require('google-auth-library');
        const {google} = require('googleapis');

        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive',
        });
        const service = google.drive({version: 'v3', auth});
        const fileMetadata = {
            name: this.dirName,
            mimeType: 'application/vnd.google-apps.folder',
        };
        try {
            const file = await this.drive.files.create({
            resource: fileMetadata,
            fields: 'id',
            });
            return file.data.id;
        }     
        catch (err) 
        {
            console.log("Error! couldn't create a folder")
            // TODO(developer) - Handle error
            throw err;
        }
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

        // Find the folder ID of the specified username
        const folderId = await this.findFolderIdByUsername();

        // Ensure that the file is uploaded to the directory named after the username
        const response = await this.drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: mimeType,
                parents: [folderId], // Set the parent folder ID
            },
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            },
        });

        console.log('File uploaded:', response.data);
    } catch (error) {
        console.error('Error uploading file', error.message);
    }
}

  
    async findFolderIdByUsername() {
      try {
          const response = await this.drive.files.list({
              q: `name='${this.dirName}' and mimeType = 'application/vnd.google-apps.folder'`,
          });
  
          if (response.data.files.length.valueOf() > 0) {
              console.log("FOUND FOLDER");
              return response.data.files[0].id;
          } else {
              return await this.createFolder();
          }
      } catch (error) {
          console.error('Error finding folder ID:', error.message);
          return null;
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

    async handleFileUpload(fileName, fileData)
    {
      const encryptedFileData = this.atRestCrypto.encryptFile(fileData);

      const compressedData = this.compressor.compressFile(encryptedFileData);
      const comprFilePath = path.join(__dirname, fileName + '.gz');
      fs.writeFileSync(comprFilePath, compressedData);
  

      // GOOGLE DRIVE 
      
      await this.uploadFile(comprFilePath);

      // Delete the file
      fs.unlink(comprFilePath, (err) => {
      if (err) {
          console.error(`Error deleting file: ${err.message}`);
      }});
    }

    async handleFileDownload(fileName, fileOwner)
    {
        const compressedData = await this.retrieveFromDrive(fileName, fileOwner);

        const decompressedData = this.compressor.decompressFile(compressedData);
        const decryptedFileData = this.atRestCrypto.decryptFile(decompressedData);

        return decryptedFileData;
    }

    async getFileIdByNameInFolder(fileName, folderName) {
        try {
          // First, find the folder ID by its name
          const folderResponse = await this.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
          });
          if (folderResponse.data.files.length > 0) {
            const folderId = folderResponse.data.files[0].id;
      
            // Then, search for the file within the specified folder
            const fileResponse = await this.drive.files.list({
              q: `'${folderId}' in parents and name='${fileName}'`,
              fields: 'files(id, name)',
            });
            if (fileResponse.data.files.length > 0) {
              return fileResponse.data.files[0].id;
            } else {
              throw new Error('File not found in the specified folder');
            }
          } else {
            throw new Error('Folder not found');
          }
        } catch (err) {
          throw err;
        }
    }
      
    async retrieveFromDrive(fileName, fileOwner) {
        fileName += ".gz";
    
        try {
            const result = await this.drive.files.get({
                fileId: await this.getFileIdByNameInFolder(fileName, fileOwner),
                alt: 'media'
            }, { responseType: 'stream' });
    
            // Read the file content as a buffer
            const chunks = [];
            return new Promise((resolve, reject) => {
                result.data.on('data', chunk => chunks.push(chunk));
                result.data.on('end', () => resolve(Buffer.concat(chunks)));
                result.data.on('error', error => reject(error));
            });
        } catch (err) {
            throw err;
        }
    }

    async initDrive() {
      try {
          const response = await this.drive.files.list();
          const files = response.data.files;
          for (const file of files) {
              await this.drive.files.delete({
                  fileId: file.id
              });
              console.log(`Deleted file: ${file.name}`);
          }
          console.log("All files deleted successfully.");
      } catch (error) {
          console.error('Error deleting files:', error.message);
      }
  }
}

module.exports = {FileHandler};