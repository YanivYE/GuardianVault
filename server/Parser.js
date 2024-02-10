const DBHandler = require("./DataBaseHandler");
// const sessionStorage = require('express-session');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
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
            // sessionStorage.Session = username + '$' + password;
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
            // sessionStorage.Session = username + '$' + password;
        }

        this.socket.emit('signupResult', operationResult);
    }

    async getUsersList()
    {
        // console.log(sessionStorage);
        const usersList = await this.DBHandler.getUsersList();
        this.socket.emit('usersListResult', usersList);
    }
}

module.exports = {Parser};