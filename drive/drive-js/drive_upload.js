const CLIENT_ID = '1026189505165-i8g7sk21dj4hlpcnnaqq1s1c0dfbkuf2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const REFRESH_TOKEN = '1//0482zJi2qJq4KCgYIARAAGAQSNwF-L9Irfij_xtILWYix04rSY_gkaD7SHlKpY0dUN-2OAr-4kPoUOgVqeY_xeHokHG2sjnI7U1c';

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
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

async function uploadFile(filePath) {
  try {
    // Get the file name
    const fileName = path.basename(filePath);

    // Determine the MIME type
    const mimeType = 'application/octet-stream'; // Default MIME type for unknown files

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

async function deleteFile(fileId) {
  try {
    const response = await drive.files.delete({
      fileId: fileId,
    });
    console.log('File deleted:', response.status);
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }
}

async function generatePublicUrl(fileId) {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const result = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });

    console.log('Public URLs:', result.data);
  } catch (error) {
    console.error('Error generating public URL:', error.message);
  }
}

async function showFiles() {
  try {
    const response = await drive.files.list();
    const fileIds = response.data.files.map((file) => file.id);
    console.log('Files in Google Drive:', response.data.files);
    return fileIds;
  } catch (error) {
    console.error('Error listing files:', error.message);
    return [];
  }
}

async function main() {
  try {
    const filePath = path.join(__dirname, 'test2.pptx');

    // encrypt 

    await uploadFile(filePath);

    fileIds = await showFiles();
    console.log('File IDs in Google Drive:', fileIds);

    const readline = require('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter index of the file to delete: ', async (userInput) => {
      if (userInput >= 0 && userInput < fileIds.length) {
        await deleteFile(fileIds[userInput]);
        console.log('File deleted successfully.');
      } else {
        console.log('Invalid index. No file deleted.');
      }

      fileIds = await showFiles();
      console.log('File IDs in Google Drive:', fileIds);

      rl.close();
    });

  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();
