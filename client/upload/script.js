// JavaScript code for handling file upload functionality and Google Drive API

const API_KEY = 'AIzaSyBHyHMT7GtJpdtQLCHtNJ9cPjBMHuHDdws';
const CLIENT_ID = '1026189505165-i8g7sk21dj4hlpcnnaqq1s1c0dfbkuf2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';const REFRESH_TOKEN = '1//0482zJi2qJq4KCgYIARAAGAQSNwF-L9Irfij_xtILWYix04rSY_gkaD7SHlKpY0dUN-2OAr-4kPoUOgVqeY_xeHokHG2sjnI7U1c';

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    gisInited = true;
    //maybeEnableButtons();
}

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    //maybeEnableButtons();
  }

document.addEventListener("DOMContentLoaded", function () {
    const fileUploadInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name");
    const downloadLink = document.getElementById("download-link");

    fileUploadInput.addEventListener("change", async () => {
        const selectedFile = fileUploadInput.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = `Selected file: ${selectedFile.name}`;
            console.log("File: ", selectedFile);
            console.log("File HREF", URL.createObjectURL(selectedFile));
            downloadLink.style.display = "block";
            downloadLink.setAttribute("href", URL.createObjectURL(selectedFile));
            downloadLink.setAttribute("download", selectedFile.name);

            // Perform Google Drive actions here based on the selected file
            const filePath = selectedFile.name; // Modify this to get the correct file path
            await uploadFile(filePath);

            const fileIds = await showFiles();
            console.log('File IDs in Google Drive:', fileIds);
        } else {
            fileNameDisplay.textContent = "No file selected";
            downloadLink.style.display = "none";
            console.log("No file selected");
        }
    });
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
  
document.addEventListener("DOMContentLoaded", function () {
    const fileUploadInput = document.getElementById("file-upload");
    const fileNameDisplay = document.getElementById("file-name");
    const downloadLink = document.getElementById("download-link");

    fileUploadInput.addEventListener("change", async () => {
        const selectedFile = fileUploadInput.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = `Selected file: ${selectedFile.name}`;
            console.log("File: ", selectedFile);
            console.log("File HREF", URL.createObjectURL(selectedFile));
            downloadLink.style.display = "block";
            downloadLink.setAttribute("href", URL.createObjectURL(selectedFile));
            downloadLink.setAttribute("download", selectedFile.name);

            // Perform Google Drive actions here based on the selected file
            const filePath = selectedFile.name; // Modify this to get the correct file path
            await uploadFile(filePath);

            const fileIds = await showFiles();
            console.log('File IDs in Google Drive:', fileIds);
        } else {
            fileNameDisplay.textContent = "No file selected";
            downloadLink.style.display = "none";
            console.log("No file selected");
        }
    });
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
  