export default class InputValidation 
{
    constructor() {
        this.alertMessageBox;
    }
  
    setMessageBox(message)
    {
        this.alertMessageBox = message;
    }

    errorAlert(alertMessage)
    {
        this.alertMessageBox.style.color = "red";
        this.alertMessageBox.innerText = alertMessage;
        this.alertMessageBox.style.display = "block";
    }

    generalInputValidation(input) {
        if (this.validateInputLength(input)) {
            this.errorAlert("Input must not be longer than 30 characters.");
            return false;
        }
        if (this.validateScriptTags(input)) {
            this.errorAlert("Input must not contain any <script> tags.");
            return false;
        }
        if (this.validateQuotationMarks(input)) {
            this.errorAlert("Input must not contain any quotation marks(`'\").")
            return false;
        }
        return true;    
    }           

    validateInputLength(input) {
        return input.length > 30;
    }

    validateScriptTags(input) {
        const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        // Check if the input contains script tags
        return regex.test(input);
    }

    validateQuotationMarks(input)
    {
        const regex = /['"`]/; // Regex to match invalid characters: ', ", `
        return regex.test(input);
    }

    validateUsername(username)
    {
        return this.generalInputValidation(username);
    }

    validatePassword(password)
    {
        return this.generalInputValidation(password) && this.validatePasswordStrength(password);
    }

    validatePasswordStrength(password)
    {
        return true;
    }
}