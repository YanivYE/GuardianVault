const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const CLIENT_ID = '1026189505165-i8g7sk21dj4hlpcnnaqq1s1c0dfbkuf2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//0482zJi2qJq4KCgYIARAAGAQSNwF-L9Irfij_xtILWYix04rSY_gkaD7SHlKpY0dUN-2OAr-4kPoUOgVqeY_xeHokHG2sjnI7U1c';
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

class FileHandler 
{
    constructor()
    {
        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
          );
          
          oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
          
          this.drive = google.drive({
            version: 'v3',
            auth: oauth2Client,
          });
    }

    async uploadFile(filePath) {
        try {
          // Get the file name
          const fileName = path.basename(filePath);
      
          // Determine the MIME type
          const mimeType = 'application/octet-stream'; // Default MIME type for unknown files
      
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

      async saveFileToDisk(fileName, fileData)
      {
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, Buffer.from(fileData.split(';base64,').pop(), 'base64'));
    
        console.log('File saved at:', filePath);

        // GOOGLE DRIVE 
        
        await uploadFile(filePath);

        fileIds = await showFiles();
        console.log('File IDs in Google Drive:', fileIds);

        // Delete the file
        fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err.message}`);
        } else {
            console.log(`File ${filePath} has been deleted`);
        }});
      }
}

async function uploadFile(filePath) {
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

    const response = await drive.files.create({
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

async function showFiles() {
  try {
    const response = await drive.files.list();
    fileIds = response.data.files.map((file) => file.id);
    console.log('Files in Google Drive:', response.data.files);
    return fileIds;
  } catch (error) {
    console.error('Error listing files:', error.message);
    return [];
  }
}


module.exports = {FileHandler};