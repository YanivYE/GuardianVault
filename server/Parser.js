const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const sessionStorage = require('express-session');
const sharedCryptography = require("./CryptographyTunnel");
const fs = require('fs');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.FileHandler = null;
    }

    parseClientMessage(message)
    {
        const parts = message.split('$');

        const operation = parts[0];

        const additionalData = parts.slice(1).join("$");

        switch(operation)
        {
            case "Login":
                this.parseLoginRequest(additionalData);
                break;
            case "SignUp":
                this.parseSignupRequest(additionalData);
                break;
            case "UploadFile":
                this.parseUploadFileRequest(additionalData);
                break;
            case "DownloadFile":
                this.parseDownloadFileRequest(additionalData);
                break;
            case "UsersList":
                this.getUsersList();
                break;
            case "ownFileList":
                this.getOwnFilesList()
                break;
            case "sharedFileList":
                this.getSharedFilesList()
                break;
  
        }
    }

    generateServerPayload(data) {
        const { iv, ciphertext, authTag } = sharedCryptography.encryptData(data);
        const payload = iv.toString('hex') + ciphertext + authTag.toString('hex');
        const payloadBase64 = Buffer.from(payload, 'hex').toString('base64');

        return payloadBase64;
    }

    async parseLoginRequest(loginRequest)
    {
        let operationResult = "Fail";
        const [username, password] = loginRequest.split('$');

        if(await this.DBHandler.validateUserLogin(username, password))
        {
            operationResult = "Success";
            sessionStorage.Session = username + '#' + password;
            console.log(username + " connected");
        }
        this.socket.emit('loginResult', operationResult);
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        const operationResult = await this.DBHandler.validateUserSignup(username, email, password);

        if(operationResult === "Success")
        {
            sessionStorage.Session = username + '#' + password;
            console.log(username + " connected");
        }

        this.socket.emit('signupResult', operationResult);
    }

    async parseUploadFileRequest(uploadFileRequest) {
        const [fileName, fileContent, usersString] = uploadFileRequest.split('$');
    
        const { username, password } = this.getConnectedUserDetails();
        const users = usersString.split(',');

        const operationResult = await this.DBHandler.validateFileName(fileName, username);

        if(operationResult === "Fail")
        {
            this.socket.emit('UploadFileResult', "Fail");
        }
        else
        {
            this.DBHandler.setUsersPermissions(users, fileName, username, password);

            this.FileHandler = new FileHandler.FileHandler(username, password);

            await this.FileHandler.handleFileUpload(fileName, fileContent); 

            this.socket.emit('UploadFileResult', "Success");
        }
    }

    async parseDownloadFileRequest(downloadFileRequest)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        const { username, password } = this.getConnectedUserDetails();

        if(fileOwner === 'null')
        {
            fileOwner = username;
            ownerPassword = password;
        }
        else
        {
            ownerPassword = await this.DBHandler.getFileEncryptionPassword(fileOwner, fileName);
        }

        this.FileHandler = new FileHandler.FileHandler(username, ownerPassword);

        const fileData = await this.FileHandler.handleFileDownload(fileName, fileOwner);

        const downloadedFilePayload = this.generateServerPayload(fileData);

        this.socket.emit('downloadFilePayload', downloadedFilePayload); 
    }

    async getUsersList()
    {
        let usersList = await this.DBHandler.getUsersList();
        const {username} = this.getConnectedUserDetails();
        usersList.splice(usersList.indexOf(username), 1);
        this.socket.emit('usersListResult', usersList);
    }

    async getOwnFilesList()
    {
        const {username} = this.getConnectedUserDetails();
        const filesList = await this.DBHandler.getUserFilesList(username);
        this.socket.emit('ownFileListResult', filesList);
    }

    async getSharedFilesList()
    {
        const {username} = this.getConnectedUserDetails();
        const filesList = await this.DBHandler.getUserSharedFilesList(username);
        this.socket.emit('sharedFileListResult', filesList);
    }

    getConnectedUserDetails()
    {
        const [connectedUserName, connectedUserPassword] = sessionStorage.Session.split('#');
        return {username: connectedUserName, password: connectedUserPassword};
    }

    initializeSystem() {
        this.DBHandler.initDataBase();
        this.FileHandler.initDrive();
        
        // Get current date and time
        const currentDateTime = new Date().toISOString();
        
        // Log message to be written
        const logMessage = `${currentDateTime}: System Initialized\n`;

        // Append log message to log.txt file
        fs.appendFileSync('../guardianvault/system_log.txt', logMessage);

        console.log("Initialized system successfully!");
    }
}

module.exports = {Parser};