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
        }

        this.socket.emit('signupResult', operationResult);
    }

    async parseUploadFileMessage(uploadFileMessage) {
        const [fileName, fileContent, usersString] = uploadFileMessage.split('$');
    
        const { username, password } = this.getConnectedUserDetails();
        const users = usersString.split(',');

        const operationResult = await this.DBHandler.validateFileName(fileName, username);

        if(operationResult === "Fail")
        {
            this.socket.emit('UploadFileResult', "Fail");
        }
        else
        {
            this.DBHandler.setUsersPermissions(users, fileName, username);

            this.FileHandler = new FileHandler.FileHandler(username, password);

            await this.FileHandler.handleFileUpload(fileName, fileContent); 

            this.socket.emit('UploadFileResult', "Success");
        }
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

    initializeSystem()
    {
        this.DBHandler.initDataBase();
        this.FileHandler.initDrive();
        console.log("Initialized system successfully!")
    }
}

module.exports = {Parser};