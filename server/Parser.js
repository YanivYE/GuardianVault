const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const EmailSender = require("./EmailSender");
const sharedCryptography = require("./Crypto");
const fs = require('fs');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.EmailSender = new EmailSender.EmailSender();
        this.FileHandler = null;
        this.DriveHandler = null;
        this.username = "";
        this.password = "";
        this.verificationCode = "";
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
        [this.username, this.password] = loginRequest.split('$');

        if(await this.DBHandler.validateUserLogin(this.username, this.password))
        {
            operationResult = "Success";
            console.log(this.username + " connected");

            let userEmailResult = await this.DBHandler.getUserEmail(this.username);

            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmailResult);

            this.initHandlers(this.username, this.password);
        }
        this.socket.emit('loginResult', operationResult);
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        this.username = username;
        this.password = password;

        const operationResult = await this.DBHandler.validateUserSignup(this.username, email, this.password);

        if(operationResult === "Success")
        {
            console.log(username + " connected");

            this.initHandlers(this.username, this.password);
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

        await this.FileHandler.assembleFileContent(blockContent, isLastBlock);
    }

    async validateFileName(validationData)
    {
        this.fileContent = "";
        this.uploadFinished = false;
        const [fileName, usersString] = validationData.split('$');

        const users = usersString.split(',');

        const operationResult = await this.DBHandler.validateFileName(fileName, this.username);

        this.socket.emit('validateNameResult', operationResult);

        this.FileHandler.setFileName(fileName);

        if(operationResult === "Success")
        {            
            await this.DBHandler.setUsersPermissions(users, fileName, this.username, this.password);

            const usersEmailMap = await this.initializeUsersEmailsMap(users);

            this.EmailSender.sendUsersNotifications(this.username, fileName, usersEmailMap);
        }
    }

    async initializeUsersEmailsMap(usersArray)
    {
        let map = new Map();
        for(const user of usersArray)
        {
            if(user !== '')
            {
                const userEmail = await this.DBHandler.getUserEmail(user);

                map.set(user, userEmail);
            }
        }

        return map;
    }   


    async parseDownloadFileRequest(downloadFileRequest)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        if(fileOwner === 'null')    // the current connected user
        {
            fileOwner = this.username;
            ownerPassword = this.password;
        }
        else
        {
            ownerPassword = await this.DBHandler.getFileEncryptionPassword(fileOwner, fileName);
        }

        this.FileHandler.downloadFile(fileName);
    }

    async deleteFile(fileData)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = fileData.split('$');

        if(fileOwner === 'null')    // connected user
        {
            fileOwner = this.username;
            ownerPassword = this.password;

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
            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmailResult);
            this.username = username;
            userEmailResult = "Success";
        } 

        this.socket.emit('forgotPasswordResult', userEmailResult);
    }

    verifyEmailCode(verifyCodeRequest)
    {
        let result = "Fail";

        const enteredCode = verifyCodeRequest.split('$')[0];

        if(enteredCode === this.verificationCode)
        {
            if(this.password !== '')    // through login
            {
                result = "2fa";
            }
            else    // through forgot password
            {
                result = "passwordReset";
            }
        }
        
        this.socket.emit('codeVerificationResult', result);
    }

    async resetPassword(resetPasswordRequest)
    {
        const newPassword = resetPasswordRequest.split('$')[0];

        this.password = newPassword;

        this.initHandlers(this.username, this.password);

        await this.DBHandler.updateUserPassword(this.username, newPassword);

        this.socket.emit('resetPasswordResult', 'Success');
    }

    async getUsersList()    
    {
        let usersList = await this.DBHandler.getUsersList();
        usersList.splice(usersList.indexOf(this.username), 1);
        const usersString = usersList.join(',');
        const payload = sharedCryptography.generateServerPayload(usersString);
        this.socket.emit('usersListPayload', payload);
    }

    async getOwnFilesList()  
    {
        const filesList = await this.DBHandler.getUserFilesList(this.username);
        const filesString = filesList.join(',');
        const payload = sharedCryptography.generateServerPayload(filesString);
        this.socket.emit('ownFileListPayload', payload);
    }

    async getSharedFilesList()   
    {
        const filesList = await this.DBHandler.getUserSharedFilesList(this.username);
        const filesString = filesList.join(',');
        const payload = sharedCryptography.generateServerPayload(filesString);
        this.socket.emit('sharedFileListPayload', payload);
    }

    async userLogout()
    {
        await this.DriveHandler.deleteUser();
   
        await this.DBHandler.deleteUser(this.username);

        this.socket.emit('logoutResult', 'Success');

        console.log('user ' + this.username + ' loged out');
    }

    initHandlers(username, password)
    {
        this.FileHandler = new FileHandler.FileHandler(this.socket, username, password);
        this.DriveHandler = new DriveHandler.DriveHandler(username, password);
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