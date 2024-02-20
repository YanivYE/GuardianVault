const DBHandler = require("./DataBaseHandler");
const sessionStorage = require('express-session');
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const fs = require('fs');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.FileHandler = null;
        this.DriveHandler = null;
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
            case "UploadFileBlock":
                this.parseUploadFileBlockRequest(additionalData);
                break;
            case "DownloadFile":
                this.parseDownloadFileRequest(additionalData);
                break;
            case "validateName":
                this.validateFileName(additionalData);
                break;
            case "DeleteFile":
                this.deleteFile(additionalData);
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

    async parseUploadFileBlockRequest(uploadFileBlockRequest) {
        var isLastBlock = false;
        const [blockIndex, blockContent, totalBlocks] = uploadFileBlockRequest.split('$');

        if(parseInt(blockIndex) === parseInt(totalBlocks) - 1)  // the last block
        {
            isLastBlock = true;
        }

        this.FileHandler.assembleFileContent(blockContent, isLastBlock);
    }

    async validateFileName(validationData)
    {
        this.fileContent = "";
        this.uploadFinished = false;
        const [fileName, usersString] = validationData.split('$');

        const { username, password } = this.getConnectedUserDetails();
        const users = usersString.split(',');

        const operationResult = await this.DBHandler.validateFileName(fileName, username);

        this.socket.emit('validateNameResult', operationResult);

        if(operationResult === "Success")
        {            
            this.FileHandler = new FileHandler.FileHandler(this.socket, fileName, username, password);

            this.DBHandler.setUsersPermissions(users, fileName, username, password);
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

        this.FileHandler = new FileHandler.FileHandler(this.socket, fileName, fileOwner, ownerPassword);

        this.FileHandler.downloadFile();
    }

    async deleteFile(fileData)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = fileData.split('$');

        const { username, password } = this.getConnectedUserDetails();

        fileOwner = username;
        ownerPassword = password;
        
        this.DriveHandler = new DriveHandler.DriveHandler(fileOwner, ownerPassword);

        await this.DriveHandler.deleteFile(fileName);

        await this.DBHandler.deleteFile(fileName, fileOwner);

        this.socket.emit('deleteFileResult', 'Success');
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
        this.FileHandler.initFileHandler();
        
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