class FileHandler 
{
    constructor()
    {
    }
    
    async uploadFile(filePath) {
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
      
      async showFiles() {
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
}

module.exports = {FileHandler};