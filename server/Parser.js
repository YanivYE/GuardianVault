const DBHandler = require("./DataBaseHandler");

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
        }
    }

    async parseLoginMessage(loginMessage)
    {
        var operationResult = "Fail";
        const [username, password] = loginMessage.split('$');

        console.log(username, password);

        if(await this.DBHandler.validateUserLogin(username, password))
        {
            operationResult = "Success";
        }
        this.socket.emit('loginResult', operationResult);
    }

    parseSignupMessage(signupMessage)
    {
        const [username, email, password] = signupMessage.split('$');

        console.log(username, email, password);
    }
}

module.exports = {Parser};