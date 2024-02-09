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

    parseLoginMessage(loginMessage)
    {
        const operationResult = "Fail";
        const [username, password] = loginMessage.split('$');

        console.log(username, password);

        // TODO: validate login using DB
        
        if(DBHandler.ValidateUserLogin())
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