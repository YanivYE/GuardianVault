const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const EmailSender = require("./EmailSender");
const MalwareDetector = require("./MalwareDetector");
const Utils = require('./Utils');

class Parser{
    constructor(socket, crypto)
    {
        this.socket = socket;
        this.crypto = crypto;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.EmailSender = new EmailSender.EmailSender();
        this.DriveHandler = new DriveHandler.DriveHandler();
        this.malwareDetector = new MalwareDetector.MalwareDetector(socket, this.EmailSender);
        this.FileHandler = new FileHandler.FileHandler(socket, crypto, this.DriveHandler, this.malwareDetector);
        this.username = "";
        this.password = "";
        this.verificationCode = "";
    }

    async parseClientMessage(clientMessage)
    {
        let responseType = "", responseData = "";
        const fields = clientMessage.split('$');

        const operation = fields[0];

        // add csrf token at index 0

        const additionalData = fields.slice(1).join("$");


        switch(operation)
        {
            case "Login":
                [responseType, responseData] = await this.parseLoginRequest(additionalData);
                break;
            case "SignUp":
                [responseType, responseData] = await this.parseSignupRequest(additionalData);
                break;
            case "UploadFileBlock":
                [responseType, responseData] = this.parseUploadFileBlockRequest(additionalData);
                break;
            case "validateName":
                [responseType, responseData] = await this.validateFileName(additionalData);
                break;
            case "DownloadFile":
                await this.parseDownloadFileRequest(additionalData);
                break;
            case "DeleteFile":
                [responseType, responseData] = await this.deleteFile(additionalData);
                break;
            case "ForgotPassword":
                [responseType, responseData] = await this.forgotPassword(additionalData);
                break;
            case "VerifyEmailCode":
                [responseType, responseData] = this.verifyEmailCode(additionalData);
                break;
            case "ResetPassword":
                [responseType, responseData] = await this.resetPassword(additionalData);
                break;
            case "MalwareAlert":
                this.handleMalwareThreat(additionalData);
                break;
            case "UsersList":
                [responseType, responseData] = await this.getUsersList();
                break;
            case "ownFileList":
                [responseType, responseData] = await this.getOwnFilesList()
                break;
            case "sharedFileList":
                [responseType, responseData] = await this.getSharedFilesList()
                break;
            case "Authentication":
                [responseType, responseData] = this.authenticateLogedUser();
                break;
            case "Logout":
                [responseType, responseData] = await this.userLogout();
                break;
            default:
                responseType = "Unknown";
                responseData = "Unknown operation";
                break;
        }

        return [responseType, responseData];
    }

    async parseLoginRequest(loginRequest)
    {
        let loginResult = "Fail";
        [this.username, this.password] = loginRequest.split('$');

        if(await this.DBHandler.validateUserLogin(this.username, this.password))
        {
            loginResult = "Success";
            console.log(`${this.username} connected`);

            const userEmail = await this.DBHandler.getUserEmail(this.username);

            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmail);
        }
        return ['loginResult', loginResult];
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        this.username = username;
        this.password = password;

        const signupResult = await this.DBHandler.validateUserSignup(this.username, email, this.password);

        if(signupResult === "Success")
        {
            console.log(`${this.username} connected`);
        }

        return ['signupResult', signupResult];
    }

    parseUploadFileBlockRequest(uploadFileBlockRequest) {
        var isLastBlock = false;
        const [blockIndex, blockContent, totalBlocks] = uploadFileBlockRequest.split('$');

        if(parseInt(blockIndex) === parseInt(totalBlocks) - 1)  // the last block
        {
            isLastBlock = true;
        }

        const blockResult = this.FileHandler.assembleFileContent(blockContent, isLastBlock);
        
        return ['uploadBlockResult', blockResult];
    }

    async validateFileName(validationData)
    {
        const [fileName, usersString] = validationData.split('$');

        const users = usersString.split(',');

        const fileNameResult = await this.DBHandler.validateFileName(fileName, this.username);

        this.FileHandler.setUploadDetails(fileName, this.username, this.password);

        if(fileNameResult === "Success")
        {            
            await this.DBHandler.setUsersPermissions(users, fileName, this.username, this.password);

            const usersEmailMap = await Utils.initializeUsersEmailsMap(this.DBHandler, users);

            this.EmailSender.sendUsersNotifications(this.username, fileName, usersEmailMap);
        }

        return ['validateNameResult', fileNameResult];
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

        this.FileHandler.downloadFile(fileName, fileOwner, ownerPassword);
    }

    async deleteFile(fileData)
    {
        let [fileName, fileOwner] = fileData.split('$');

        if(fileOwner === 'null')    // connected user
        {
            fileOwner = this.username;

            await this.DriveHandler.deleteFile(fileName, fileOwner);

            await this.DBHandler.deleteOwnFile(fileName, fileOwner);
        }
        else
        {
            await this.DBHandler.deleteSharedFile(fileName, fileOwner);
        }

        return ['deleteFileResult', 'Success'];
    }

    async forgotPassword(forgotPasswordRequest)
    {
        const username = forgotPasswordRequest.split('$');

        this.password = "";

        let userEmailResult = await this.DBHandler.getUserEmail(username);

        if(userEmailResult !== "Fail")
        {
            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmailResult);
            this.username = username;
            userEmailResult = "Success";
        } 

        return ['forgotPasswordResult', userEmailResult];
    }

    verifyEmailCode(verifyCodeRequest)
    {
        let verificationResult = "Fail";

        const enteredCode = verifyCodeRequest.split('$')[0];

        if(enteredCode === this.verificationCode)
        {
            if(this.password !== '')    // through login
            {
                verificationResult = "2fa";
            }
            else    // through forgot password
            {
                verificationResult = "passwordReset";
            }
        }
        
        return ['codeVerificationResult', verificationResult];
    }

    async resetPassword(resetPasswordRequest)
    {
        const newPassword = resetPasswordRequest.split('$')[0];

        this.password = newPassword;

        await this.DBHandler.updateUserPassword(this.username, newPassword);

        return ['resetPasswordResult', 'Success'];
    }

    handleMalwareThreat(threatDetails)
    {
        const [threatType, maliciousInput] = threatDetails.split('$');

        this.malwareDetector.malwareDetected(threatType, maliciousInput, this.username);
    }

    async getUsersList()    
    {
        let usersList = await this.DBHandler.getUsersList();
        usersList.splice(usersList.indexOf(this.username), 1);
        let usersString = usersList.join(',');
        if(usersList.length === 0)
        {
            usersString = "empty";
        }
        return ['usersListResult', usersString];
    }

    async getOwnFilesList()  
    {
        const filesList = await this.DBHandler.getUserFilesList(this.username);
        let filesString = filesList.join(',');
        if(filesList.length === 0)
        {
            filesString = "empty";
        }
        return ['ownFileListResult', filesString];
    }

    async getSharedFilesList()   
    {
        const filesList = await this.DBHandler.getUserSharedFilesList(this.username);
        let filesString = filesList.map(({ user, files }) => `${user}:${files.join(',')}`).join('#');
        if(filesList.length === 0)
        {
            filesString = "empty";
        }
        return ['sharedFileListResult', filesString];
    }

    authenticateLogedUser()
    {
        const csrfToken = this.crypto.generateCSRFToken();
        return ['authenticationResult', csrfToken];
    }

    async userLogout()
    {
        await this.DriveHandler.deleteUser(this.username);
   
        await this.DBHandler.deleteUser(this.username);

        console.log(`User ${this.username} logged out`);

        return ['logoutResult', 'Success'];
    }

    initializeSystem() {
        this.DBHandler.initDataBase();
        this.DriveHandler.initDrive();

        Utils.writeToLogFile('../guardianvault/system_log.txt', 'System Initialized');
    }
}

module.exports = {Parser};