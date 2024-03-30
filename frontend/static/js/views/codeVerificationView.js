import AbstractView from "./AbstractView.js";

export default class CodeVerificationView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Code Verification");
    }

    // Generates HTML for the code verification form
    async getHtml() {
        return `
            <div class="limiter">
                <div class="container-code100" style="background-image: url('static/css/images/bg-01.jpg');">
                    <div class="wrap-code100 p-t-30 p-b-50">
                        <span class="code100-form-title p-b-41">
                            Check Email For Verification Code
                        </span>
                        <form id="verifyCodeForm" class="code100-form validate-form p-b-33 p-t-5">
                            <div class="wrap-input-code100 validate-input" data-validate="Enter code">
                                <input class="input-code100" type="text" name="code" placeholder="Code">
                                <span class="focus-input-code100" data-placeholder="✔"></span>
                            </div>
                            <div class="container-code100-form-btn m-t-32">
                                <button id="verifyCodeButton" type="submit" class="code100-form-btn">
                                    Verify
                                </button>
                            </div>
                            <h2>‎ </h2>
                            <div id="message" style="color: red; display: none;"></div> 
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // Executes scripts associated with the view
    async executeViewScript() {
        // Initialize validator and message box
        const validator = this.inputValidator;
        const messageBox = document.getElementById("message");
        validator.setMessageBox(messageBox);

        // Event listener for form submission
        document.getElementById("verifyCodeForm").addEventListener('submit', async function (event) {
            event.preventDefault();
            // Retrieve verification code from form
            const verificationCode = document.getElementsByName("code")[0].value;
            messageBox.style.display = "none"; // Hide message box initially

            // Perform input validation and verification code validation
            if (validator.generalInputValidation(verificationCode) && validator.validateVerificationCode(verificationCode)) {
                // Construct verify code request
                const verifyCodeRequest = 'VerifyEmailCode$' + verificationCode;
                // Send code verification request to the server
                const codeVerificationResult = await window.client.transferToServer(verifyCodeRequest, 'codeVerificationResult');
                
                // Handle verification result
                if (codeVerificationResult === "Fail") {
                    // Display error message for incorrect verification code
                    validator.errorAlert("Wrong Verification Code!");
                } else if (codeVerificationResult === "passwordReset") {
                    // Navigate to password reset page if verification successful
                    window.client.navigateTo('/resetPassword');
                } else {
                    // Authenticate and navigate to menu if verification successful
                    await window.client.authenticate();
                    window.client.navigateTo('/menu');
                }
            }
        });
    }
}
