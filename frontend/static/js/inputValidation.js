import mmmagic from 'mmmagic';

export default class InputValidation 
{
    constructor(socket) {
        this.alertMessageBox;
        this.socket = socket;
    }
  
    setMessageBox(message)
    {
        this.alertMessageBox = message;
    }

    errorAlert(errorMessage) {
        this.showMessage(errorMessage, "red");
    }

    successAlert(successMessage) {
        this.showMessage(successMessage, "green");
    }

    showMessage(messageText, color) {
        this.alertMessageBox.style.display = "block";
        this.alertMessageBox.style.color = color;
        this.alertMessageBox.innerText = messageText;
    }

    generalInputValidation(input) {
        if (this.validateEmptyInput(input)) {
            this.errorAlert("Fill out all input fields.");
            return false;
        }
        if (this.validateInputLength(input)) {
            this.errorAlert("Input must not be longer than 40 characters.");
            return false;
        }
        if (this.validateScriptTags(input)) {
            this.errorAlert("Input must not contain any <script> tags.");
            this.XSSAlert(input);
            return false;
        }
        if (this.validateSqlInjectionMarks(input)) {
            this.errorAlert("Input must not contain any potential \nSQL Injection marks(`'\";).")
            this.SqliAlert(input);
            return false;
        }
        if (this.validateInvalidCharacters(input)) {
            this.errorAlert("Input must not contain any invalid characters(${}:).")
            return false;
        }
        return true;    
    }           

    validateEmptyInput(input)
    {
        return input.trim() === '';
    }

    validateInputLength(input) {
        return input.length > 40;
    }

    validateScriptTags(input) {
        const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        // Check if the input contains script tags
        return regex.test(input);
    }

    validateSqlInjectionMarks(input)
    {
        const regex = /[`'";]/; // Regex to match invalid characters: ', ", `
        return regex.test(input);
    }

    validateInvalidCharacters(input)
    {
        const regex = /[${}:]/;     // invlaid chars
        return regex.test(input);
    }

    checkRegexMatch(input, regex, errorMessage)
    {
        if(!regex.test(input))
        {
            this.errorAlert(errorMessage);
            return false;
        }
        return true;
    }

    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return this.checkRegexMatch(email, regex, "Invalid Email address.");
    }

    validateVerificationCode(code)
    {
        const regex = /^\d{6}$/; // Matches exactly 6 digits
        return this.checkRegexMatch(code, regex, "Code Verification must be a 6 digit sequence.");
    }

    validateFileName(fileName)
    {
        const regex = /^[a-zA-Z0-9]{1,12}$/; // Matches only letters and numbers
        return this.checkRegexMatch(fileName, regex, "File name must contain up to 12 letters and digits.\nNo specail characters");
    }

    validatePasswordStrength(strengthText)
    {
        if(strengthText !== 'Strong' && strengthText !== 'Excellent!')
        {
            this.errorAlert("Password strength must be at least Strong.");
            return false;
        }
        return true;
    }

    // Function to validate form inputs
    validateFileUpload(fileName, fileExtension, fileStatus, users, privateUpload, file) 
    {
        const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
        const JSExtensions = ['js', 'mjs', 'jsx', 'ts', 'tsx'];
        const executableExtensions = ['exe', 'bat', 'sh', 'cmd'];

        if (!this.generalInputValidation(fileName) || !this.validateFileName(fileName)) {
            return false;
        }
        if (!fileStatus) {
            this.errorAlert("Please select either public or private upload");
            return false;
        }
        if (!privateUpload && users.length === 0) {
            this.errorAlert("Please select users for public upload");
            return false;
        }
        if (!file) {
            this.errorAlert("Please select a file to upload");
            return false;
        }
        if (phpExtensions.includes(fileExtension) || JSExtensions.includes(fileExtension) || executableExtensions.includes(fileExtension)) {
            this.errorAlert("Any PHP, JavaScript, and executable\n file types are not allowed!");
            this.LFIAlert(fileName, fileExtension);
            return false;
        }
        if (file.size > 1024 * 1024 * 100) {
            this.errorAlert("File too large, limit is 100MB");
            return false;
        }
        return true;
    }

    async validateMagicBytes(fileContent) {
        return new Promise((resolve, reject) => {
            const magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
            
            // Detect magic bytes
            magic.detect(fileContent, (error, result) => {
                if (error) {
                    console.error('Error detecting magic bytes:', error);
                    resolve(false); // Indicate validation failure
                } else {
                    console.log('Detected MIME type:', result);
                    
                    resolve(result); // Valid magic bytes
                }
            });
        });
    }

    XSSAlert(maliciousInput)
    {
        const xssAlert = 'MalwareAlert$XSS$' + maliciousInput;
        this.reportPotentialThreat(xssAlert);
    }

    SqliAlert(maliciousInput)
    {
        const sqliAlert = 'MalwareAlert$Sql Injection$' + maliciousInput;
        this.reportPotentialThreat(sqliAlert);
    }

    LFIAlert(fileName, fileExtension)
    {
        const maliciousFile = fileName + '.' + fileExtension;
        const LFIAlert = 'MalwareAlert$LFI$' + maliciousFile;
        this.reportPotentialThreat(LFIAlert);
    }

    async reportPotentialThreat(malwareAlert)
    {
        const alertPayload = await window.client.cryptographyTunnel.generateClientPayload(malwareAlert);
        this.socket.emit('ClientMessage', alertPayload);
    }
}