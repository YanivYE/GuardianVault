class Parser{
    constructor()
    {
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
        const [username, password] = loginMessage.split('$');

        console.log(username, password);
    }

    parseSignupMessage(signupMessage)
    {
        const [username, email, password] = signupMessage.split('$');

        console.log(username, email, password);
    }
}

module.exports = {Parser};