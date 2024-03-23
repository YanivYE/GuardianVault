export default class InputValidation 
{
    constructor() {
        this.alertMessageBox;
    }
  
    setMessageBox(message)
    {
        this.alertMessageBox = message;
    }

    validaetScriptTags(input) {}

    validateUsername(username)
    {
        return true;
    }

    validatePassword(password)
    {
        return true;
    }
}