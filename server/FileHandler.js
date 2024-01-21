class FileHandler 
{
    constructor()
    {
        // TAKE FROM DRIVEAPI.JS FILE

        // this.oauth2Client = new google.auth.OAuth2(
        //     CLIENT_ID,
        //     CLIENT_SECRET,
        //     REDIRECT_URI
        //   );
          
        //   oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
          
        //   this.drive = google.drive({
        //     version: 'v3',
        //     auth: oauth2Client,
        //   });
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

      async saveFileToDisk(fileName)
      {
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, Buffer.from(data.split(';base64,').pop(), 'base64'));
    
        console.log('File saved at:', filePath);

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

module.exports = {FileHandler};