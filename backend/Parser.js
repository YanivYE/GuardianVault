// Import required modules
const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const EmailSender = require("./EmailSender");
const MalwareDetector = require("./MalwareDetector");
const Utils = require('./Utils');

// Define global variable to store connected users
global.connectedUsers = [];

// Define Parser class
class Parser {
    constructor(socket, crypto) {
        // Initialize class properties
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
        this.loggedIn = false;

        // Handle disconnection
        this.socket.on('disconnect', () => {
            if(this.isUserConnected(this.username))
            {
                this.disconnectUser(this.username);
            }
        }); 
    }

    // Parse client messages
    async parseClientMessage(clientMessage) {
        let responseType = "", responseData = "";
        let operation = "", additionalData = "";
        const fields = clientMessage.split('$');

        // Check if user is logged in for additional CSRF token
        if (this.loggedIn) {
            const authenticationToken = fields[0];
            if (!this.malwareDetector.validateAuthenticatedUser(authenticationToken, this.username)) {
                return ["", ""]; // Unauthenticated
            }
            operation = fields[1];
            additionalData = fields.slice(2).join("$");
        } else {
            operation = fields[0];
            additionalData = fields.slice(1).join("$");
        }

        // Handle different operations
        switch (operation) {
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
                [responseType, responseData] = await this.getOwnFilesList();
                break;
            case "sharedFileList":
                [responseType, responseData] = await this.getSharedFilesList();
                break;
            case "Authentication":
                [responseType, responseData] = this.authenticateLoggedInUser();
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

    // Parse login request
    async parseLoginRequest(loginRequest) {
        let loginResult = "Fail";
        [this.username, this.password] = loginRequest.split('$');

        if(this.isUserConnected(this.username))
        {
            loginResult = "User Connected";
        } 
        else {
            const isValidLogin = await this.DBHandler.validateUserLogin(this.username, this.password);
            if (isValidLogin) {
                loginResult = "Success";
                
                const userEmail = await this.DBHandler.getUserEmail(this.username);
                this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmail);
            }
        }
        return ['loginResult', loginResult];
    }

    // Parse signup request
    async parseSignupRequest(signupRequest) {
        const [username, email, password] = signupRequest.split('$');

        this.username = username;
        this.password = password;

        const signupResult = await this.DBHandler.validateUserSignup(this.username, email, this.password);

        return ['signupResult', signupResult];
    }

    // Parse upload file block request
    parseUploadFileBlockRequest(uploadFileBlockRequest) {
        let isLastBlock = false;
        const [blockIndex, blockContent, totalBlocks] = uploadFileBlockRequest.split('$');

        if (parseInt(blockIndex) === parseInt(totalBlocks) - 1) { // Check if it's the last block
            isLastBlock = true;
        }

        const blockResult = this.FileHandler.assembleFileContent(blockContent, isLastBlock);

        return ['uploadBlockResult', blockResult];
    }

    // Validate file name
    async validateFileName(validationData) {
        const [fileName, usersString] = validationData.split('$');
        const users = usersString.split(',');
        const fileNameResult = await this.DBHandler.validateFileName(fileName, this.username);

        this.FileHandler.setUploadDetails(fileName, this.username, this.password);

        if (fileNameResult === "Success") {
            await this.DBHandler.setUsersPermissions(users, fileName, this.username, this.password);
            const usersEmailMap = await Utils.initializeUsersEmailsMap(this.DBHandler, users);
            this.EmailSender.sendUsersNotifications(this.username, fileName, usersEmailMap);
        }

        return ['validateNameResult', fileNameResult];
    }

    // Parse download file request
    async parseDownloadFileRequest(downloadFileRequest) {
        let ownerPassword = "";
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        if (fileOwner === 'null') { // If the current user is the owner
            fileOwner = this.username;
            ownerPassword = this.password;
        } else {
            ownerPassword = await this.DBHandler.getFileEncryptionPassword(fileOwner, fileName);
        }

        this.FileHandler.downloadFile(fileName, fileOwner, ownerPassword);
    }

    // Delete file
    async deleteFile(fileData) {
        let [fileName, fileOwner] = fileData.split('$');

        if (fileOwner === 'null') { // If the current user is the owner
            fileOwner = this.username;
            await this.DriveHandler.deleteFile(fileName, fileOwner);
            await this.DBHandler.deleteOwnFile(fileName, fileOwner);
        } else {
            await this.DBHandler.deleteSharedFile(fileName, fileOwner);
        }

        return ['deleteFileResult', 'Success'];
    }

    // Handle forgot password
    async forgotPassword(forgotPasswordRequest) {
        const username = forgotPasswordRequest.split('$')[0];

        this.password = "";

        let userEmailResult = await this.DBHandler.getUserEmail(username);

        if(this.isUserConnected(username))
        {
            userEmailResult = "User Connected";
        } 
        else{
            if (userEmailResult !== "Fail") {
                this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmailResult);
                this.username = username;
                userEmailResult = "Success";
            }
        }

        return ['forgotPasswordResult', userEmailResult];
    }

    // Verify email code
    verifyEmailCode(verifyCodeRequest) {
        let verificationResult = "Fail";
        const enteredCode = verifyCodeRequest.split('$')[0];

        if (enteredCode === this.verificationCode) {
            if (this.password !== '') { // Through login
                verificationResult = "2fa";
            } else { // Through forgot password
                verificationResult = "passwordReset";
            }
        }

        return ['codeVerificationResult', verificationResult];
    }

    // Reset password
    async resetPassword(resetPasswordRequest) {
        const newPassword = resetPasswordRequest.split('$')[0];
        this.password = newPassword;
        await this.DBHandler.updateUserPassword(this.username, newPassword);

        return ['resetPasswordResult', 'Success'];
    }

    // Handle malware threat
    handleMalwareThreat(threatDetails) {
        const [threatType, maliciousInput] = threatDetails.split('$');
        this.malwareDetector.malwareDetected(threatType, maliciousInput, this.username);
    }

    // Get users list
    async getUsersList() {
        let usersList = await this.DBHandler.getUsersList();
        usersList.splice(usersList.indexOf(this.username), 1);
        let usersString = usersList.join(',');
        if (usersList.length === 0) {
            usersString = "empty";
        }
        return ['usersListResult', usersString];
    }

    // Get own files list
    async getOwnFilesList() {
        const filesList = await this.DBHandler.getUserFilesList(this.username);
        let filesString = filesList.join(',');
        if (filesList.length === 0) {
            filesString = "empty";
        }
        return ['ownFileListResult', filesString];
    }

    // Get shared files list
    async getSharedFilesList() {
        const filesList = await this.DBHandler.getUserSharedFilesList(this.username);
        let filesString = filesList.map(({ user, files }) => `${user}:${files.join(',')}`).join('#');
        if (filesList.length === 0) {
            filesString = "empty";
        }
        return ['sharedFileListResult', filesString];
    }

    // Authenticate logged-in user
    authenticateLoggedInUser() {
        const csrfToken = this.crypto.generateCSRFToken();
        this.malwareDetector.setCsrfToken(csrfToken);
        this.loggedIn = true;
        global.connectedUsers.push(this.username);
        console.log(`${this.username} connected`);
        return ['authenticationResult', csrfToken];
    }

    isUserConnected(username) {
        return global.connectedUsers.includes(username);
    }

    disconnectUser(username) {
        global.connectedUsers = global.connectedUsers.filter(user => user !== username);
        console.log(`User ${username} disconnected.`);
    }

    // User logout
    async userLogout() {
        await this.DriveHandler.deleteUser(this.username);
        await this.DBHandler.deleteUser(this.username);
        this.loggedIn = false;
        this.malwareDetector.setCsrfToken("");
        return ['logoutResult', 'Success'];
    }

    // Initialize system
    initializeSystem() {
        this.DBHandler.initDataBase();
        this.DriveHandler.initDrive();
        Utils.writeToLogFile('../guardianvault/system_log.txt', 'System Initialized');
    }
}

module.exports = { Parser };
