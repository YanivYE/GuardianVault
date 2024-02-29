const DBHandler = require("./DataBaseHandler");
const sessionStorage = require('express-session');
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const EmailSender = require("./EmailSender");
const fs = require('fs');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.EmailSender = new EmailSender.EmailSender();
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
            case "ForgotPassword":
                this.forgotPassword(additionalData);
                break;
            case "VerifyEmailCode":
                this.verifyEmailCode(additionalData);
                break;
            case "ResetPassword":
                this.resetPassword(additionalData);
                break;
            case "getUserName":
                this.getUsername();
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
            case "Logout":
                this.userLogout();
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
            console.log(username + " connected");

            let userEmailResult = await this.DBHandler.getUserEmail(username);

            const code = this.EmailSender.sendEmailVerificationCode(userEmailResult);

            sessionStorage.Session += '#Username:' + username + '#Password:' + password + '#Code:' + code;
        }
        this.socket.emit('loginResult', operationResult);
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        const operationResult = await this.DBHandler.validateUserSignup(username, email, password);

        if(operationResult === "Success")
        {
            sessionStorage.Session += '#Username:' + username + '#Password:' + password;
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

            const usersEmailMap = await this.initializeUsersEmailsMap(users);

            this.EmailSender.sendUsersNotifications(username, fileName, usersEmailMap);
        }
    }

    async initializeUsersEmailsMap(usersArray)
    {
        let map = new Map();
        for(const user of usersArray)
        {
            const userEmail = await this.DBHandler.getUserEmail(user);

            map.set(user, userEmail);
        }

        return map;
    }   


    async parseDownloadFileRequest(downloadFileRequest)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        const { username, password } = this.getConnectedUserDetails();

        if(fileOwner === 'null')    // connected user
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

        if(fileOwner === 'null')    // connected user
        {
            fileOwner = username;
            ownerPassword = password;

            this.DriveHandler = new DriveHandler.DriveHandler(fileOwner, ownerPassword);

            await this.DriveHandler.deleteFile(fileName);

            await this.DBHandler.deleteOwnFile(fileName, fileOwner);
        }
        else
        {
            await this.DBHandler.deleteSharedFile(fileName, fileOwner);
        }

        this.socket.emit('deleteFileResult', 'Success');
    }

    async forgotPassword(forgotPasswordRequest)
    {
        const username = forgotPasswordRequest.split('$');

        let userEmailResult = await this.DBHandler.getUserEmail(username);

        if(userEmailResult != "Fail")
        {
            const code = this.EmailSender.sendEmailVerificationCode(userEmailResult);
            sessionStorage.Session += '#Username:' + username + '#Code:' + code;
            userEmailResult = "Success";
        } 

        this.socket.emit('forgotPasswordResult', userEmailResult);
    }

    verifyEmailCode(verifyCodeRequest)
    {
        let result = "Fail";
        const {username, password} = this.getConnectedUserDetails();

        const enteredCode = verifyCodeRequest.split('$')[0];

        const verificationCode = this.getCurrentCode();

        if(enteredCode === verificationCode)
        {
            if(password !== '')
            {
                result = "2fa";
            }
            else{
                result = "passwordReset";
            }
        }
        
        this.socket.emit('codeVerificationResult', result);
    }

    async resetPassword(resetPasswordRequest)
    {
        const newPassword = resetPasswordRequest.split('$')[0];

        const {username} = this.getConnectedUserDetails();

        sessionStorage.Session += '#Password:' + newPassword;

        await this.DBHandler.updateUserPassword(username, newPassword);

        this.socket.emit('resetPasswordResult', 'Success');
    }

    getUsername()
    {
        const {username} = this.getConnectedUserDetails();

        this.socket.emit('usernameResult', username);
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

    async userLogout()
    {
        const {username, password} = this.getConnectedUserDetails();

        this.DriveHandler = new DriveHandler.DriveHandler(username, password);

        await this.DriveHandler.deleteUser();
   
        await this.DBHandler.deleteUser(username);

        this.socket.emit('logoutResult', 'Success');

        console.log('user ' + username + ' loged out');
    }

    getConnectedUserDetails() 
    {
        let username = "";
        let password = "";
        const parts = sessionStorage.Session.split('#');
    
        for (const part of parts) {
            if (part.includes('Username:')) {
                username = part.split('Username:')[1]; // Extract username
            }
            if (part.includes('Password:')) {
                password = part.split('Password:')[1]; // Extract password
            }
        }
    
        return { username: username, password: password };
    }

    getCurrentCode() 
    {
        let code = "";
        const parts = sessionStorage.Session.split('#');
    
        for (const part of parts) {
            if (part.includes('Code:')) {
                code = part.split('Code:')[1]; // Extract username
            }
        }
    
        return code;
    }

    initializeSystem() {
        this.DBHandler.initDataBase();
        this.DriveHandler.initDrive();
        
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