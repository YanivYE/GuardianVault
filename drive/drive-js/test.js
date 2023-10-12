/**
 * Download a Document file in PDF format
 * @param{string} fileId file ID
 * @return{obj} file status
 * */
 async function exportPdf(fileId) {
    const {GoogleAuth} = require('google-auth-library');
    const {google} = require('googleapis');
  
    // Get credentials and build service
    // TODO (developer) - Use appropriate auth mechanism for your app
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/drive',
    });
    const service = google.drive({version: 'v3', auth});
  
    try {
      const result = await service.files.export({
        fileId: fileId,
        mimeType: 'application/pdf',
      });
      console.log(result.status);
      return result;
    } catch (err) {
      // TODO(developer) - Handle error
      throw err;
    }
  }

  exportPdf('1F3dIVPFVI9oUYKPtltti5fzrtSGkLoFmBNFoVDxNOjA')