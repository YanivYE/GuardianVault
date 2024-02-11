const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const sessionStorage = require('express-session');

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
                this.parseLoginMessage(additionalData);
                break;
            case "SignUp":
                this.parseSignupMessage(additionalData);
                break;
            case "UploadFile":
                this.parseUploadFileMessage(additionalData);
                break;
            case "FileName":
                this.parseFileNameValidationMessage(additionalData);
                break;



            case "UsersList":
                this.getUsersList();
                break;
        }
    }

    async parseLoginMessage(loginMessage)
    {
        let operationResult = "Fail";
        const [username, password] = loginMessage.split('$');

        console.log(username, password);

        if(await this.DBHandler.validateUserLogin(username, password))
        {
            operationResult = "Success";
            sessionStorage.Session = username + '#' + password;
            this.FileHandler = new FileHandler.FileHandler(password);
        }
        this.socket.emit('loginResult', operationResult);
    }

    async parseSignupMessage(signupMessage)
    {
        const [username, email, password] = signupMessage.split('$');

        console.log(username, email, password);

        const operationResult = await this.DBHandler.validateUserSignup(username, email, password);

        if(operationResult === "Success")
        {
            sessionStorage.Session = username + '#' + password;
            this.FileHandler = new FileHandler.FileHandler(password);
        }

        this.socket.emit('signupResult', operationResult);
    }

    async parseUploadFileMessage(uploadFileMessage)
    {
        const [fileName, fileContent, usersString] = uploadFileMessage.split('$');

        const {username} = this.getConnectedUserDetails();

        console.log(fileName, fileContent, usersString);

        const users = usersString.split(',');

        console.log(users);

        this.DBHandler.setUsersPermissions(users, fileName, username);

        // this.FileHandler.saveToDrive(fileName, fileContent);
    }

    async parseFileNameValidationMessage(fileNameMessage)
    {
        const fileName = fileNameMessage;

        const {username} = this.getConnectedUserDetails();

        const operationResult = await this.DBHandler.validateFileName(fileName, username);

        this.socket.emit('FileNameValidationResult', operationResult);
    }

    async getUsersList()
    {
        const usersList = await this.DBHandler.getUsersList();
        const {username} = this.getConnectedUserDetails();
        usersList.splice(usersList.indexOf(username), 1);
        this.socket.emit('usersListResult', usersList);
    }

    getConnectedUserDetails()
    {
        const [connectedUserName, connectedUserPassword] = sessionStorage.Session.split('#');
        return {username: connectedUserName, password: connectedUserPassword};
    }
}

module.exports = {Parser};