const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const EncryptionAtRest = require("./EncryptionAtRest");
const Compressor = require("./Compressor");
const config = require('./config');

class DriveHandler {
    constructor() {
        this.drive = this.connectToDrive();
        this.atRestCrypto = new EncryptionAtRest.EncryptionAtRest();
        this.compressor = new Compressor.Compressor();
    }

    // Establish connection to Google Drive
    connectToDrive() {
        const oauth2Client = new google.auth.OAuth2(
            config.CLIENT_ID,
            config.CLIENT_SECRET,
            config.REDIRECT_URI
        );
        oauth2Client.setCredentials({ refresh_token: config.REFRESH_TOKEN });

        return google.drive({
            version: 'v3',
            auth: oauth2Client,
        });
    }

    // Create a folder in Google Drive
    async createFolder(username) {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive',
        });
        const service = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            name: username,
            mimeType: 'application/vnd.google-apps.folder',
        };
        try {
            const file = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id',
            });
            return file.data.id;
        } catch (err) {
            console.error("Error! Couldn't create a folder:", err);
            throw err;
        }
    }

    // Upload a file to a specified folder in Google Drive
    async uploadFile(filePath, username) {
        try {
            const fileName = path.basename(filePath);
            const mimeType = this.getMimeType(fileName);

            const folderId = await this.findFolderIdByUsername(username);

            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType: mimeType,
                    parents: [folderId],
                },
                media: {
                    mimeType: mimeType,
                    body: fs.createReadStream(filePath),
                },
            });

            console.log('File uploaded:', response.name);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    // Delete a file from a specified folder in Google Drive
    async deleteFile(fileName, dirName) {
        try {
            const fileId = await this.getFileIdByNameInFolder(fileName, dirName);
            if (fileId) {
                await this.drive.files.delete({
                    fileId: fileId
                });
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Delete a user's folder and its contents from Google Drive
    async deleteUser(username) {
        try {
            const folderId = await this.findFolderIdByUsername(username);

            const filesResponse = await this.drive.files.list({
                q: `'${folderId}' in parents`,
                fields: 'files(id, name)',
            });

            for (const file of filesResponse.data.files) {
                await this.drive.files.delete({
                    fileId: file.id,
                });
            }

            await this.drive.files.delete({
                fileId: folderId,
            });

        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }

    // Find the folder ID in Google Drive by username
    async findFolderIdByUsername(username) {
        try {
            const response = await this.drive.files.list({
                q: `name='${username}' and mimeType = 'application/vnd.google-apps.folder'`,
            });

            if (response.data.files.length > 0) {
                return response.data.files[0].id;
            } else {
                return await this.createFolder(username);
            }
        } catch (error) {
            console.error('Error finding folder ID:', error);
            return null;
        }
    }

    // Get the file ID by name in a specified folder in Google Drive
    async getFileIdByNameInFolder(fileName, dirName) {
        try {
            const folderResponse = await this.drive.files.list({
                q: `name='${dirName}' and mimeType='application/vnd.google-apps.folder'`,
            });
            if (folderResponse.data.files.length > 0) {
                const folderId = folderResponse.data.files[0].id;
                const fileResponse = await this.drive.files.list({
                    q: `'${folderId}' in parents and name='${fileName + ".gz"}'`,
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

    // Handle file upload by encrypting, compressing, and uploading to Google Drive
    async handleFileUpload(fileName, fileData, encryptionPassword, username) {
        const encryptedFileData = this.atRestCrypto.encryptFile(fileData, encryptionPassword);

        const compressedData = this.compressor.compressFile(encryptedFileData);
        const comprFilePath = path.join(__dirname, fileName + '.gz');
        fs.writeFileSync(comprFilePath, compressedData);

        await this.uploadFile(comprFilePath, username);

        fs.unlink(comprFilePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err}`);
            }
        });
    }

    // Handle file download by retrieving from Google Drive, decompressing, and decrypting
    async handleFileDownload(fileName, dirName, decryptionPassword) {
        const compressedData = await this.retrieveFromDrive(fileName, dirName);
        const decompressedData = this.compressor.decompressFile(compressedData);
        const decryptedFileData = this.atRestCrypto.decryptFile(decompressedData, decryptionPassword);
        return decryptedFileData;
    }

    // Retrieve file from Google Drive
    async retrieveFromDrive(fileName, dirName) {
        try {
            const result = await this.drive.files.get({
                fileId: await this.getFileIdByNameInFolder(fileName, dirName),
                alt: 'media'
            }, { responseType: 'stream' });

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

    // Initialize Google Drive by deleting all files
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
            console.error('Error deleting files:', error);
        }
    }

    // Get MIME type of a file based on its extension
    getMimeType(fileName) {
        const extension = path.extname(fileName).toLowerCase().slice(1);
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
}

module.exports = { DriveHandler };
