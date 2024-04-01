// Importing AbstractView class for inheritance
import AbstractView from "./AbstractView.js";

// Class definition for ForgotPasswordView inheriting from AbstractView
export default class ForgotPasswordView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Forgot Password"); // Setting title for the view
    }

    // Method to return HTML structure for the forgot password form
    async getHtml() {
        return `
        <div class="limiter">
            <div class="container-forgot100" style="background-image: url('static/css/images/bg-01.jpg');">
                <div class="wrap-forgot100 p-t-30 p-b-50">
                    <span class="forgot100-form-title p-b-41">
                        Forgot Password
                    </span>
                    <form id="forgotPasswordForm" class="forgot100-form validate-form p-b-33 p-t-5">
                        <div class="wrap-input-forgot100 validate-input-forgot" data-validate="Enter username">
                            <input class="input-forgot100" type="text" name="username" placeholder="Username">
                            <span class="focus-input-forgot100" data-placeholder="&#xe82a;"></span>
                        </div>

                        <div class="container-forgot100-form-btn m-t-32">
                            <button id="forgotPasswordButton" type="submit" class="forgot100-form-btn">
                                Validate
                            </button>
                        </div>

                        <h2>‎ </h2>
                        <div id="message" style="color: red; display: none;"></div> 

                    </form>
                </div>
            </div>
        </div>`;
    }

    // Method to execute scripts for the view
    async executeViewScript() {
        // Retrieving input validator from the parent class
        const validator = this.inputValidator;
        // Retrieving message box element
        const messageBox = document.getElementById("message");

        // Setting message box for input validation messages
        validator.setMessageBox(messageBox);

        // Adding submit event listener to the form
        document.getElementById("forgotPasswordForm").addEventListener('submit', async function (event) {
            event.preventDefault(); // Preventing default form submission behavior
            
            // Retrieving username input value and trimming whitespaces
            const username = document.getElementsByName("username")[0].value.trim();
            
            // Validating username input
            if (validator.generalInputValidation(username)) {
                window.client.username = username; // Setting username in client object
                
                // Hiding any existing error message
                messageBox.style.display = "none";
                
                // Creating request string for forgot password and sending to server
                const forgotPasswordRequest = 'ForgotPassword$' + username;
                const forgotPasswordResult = await window.client.transferToServer(forgotPasswordRequest, 'forgotPasswordResult');
                
                // Handling response from server
                if (forgotPasswordResult === "Fail") {
                    // Displaying error message if username doesn't exist
                    validator.errorAlert("Username doesn't exist.");
                } else if(forgotPasswordResult === "User Connected")
                {
                    validator.errorAlert("Login Failed. Username already connected.");
                } else {
                    // Navigating to code verification page if username exists
                    window.client.navigateTo('/codeVerification');
                }
            }
        });
    }
}
