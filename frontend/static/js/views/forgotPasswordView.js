import AbstractView from "./AbstractView.js";

export default class ForgotPasswordView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Forgot Password");
    }

    async getHtml() {
        return `<div class="limiter">
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
        </div>
        `;
    }

    async executeViewScript()
    {
        const validator = this.inputValidator;

        const messageBox = document.getElementById("message");

        validator.setMessageBox(messageBox);

        document.getElementById("forgotPasswordForm").addEventListener('submit', async function (event) {
            event.preventDefault();
        
            const username = document.getElementsByName("username")[0].value.trim(); // Trim to remove leading/trailing whitespaces
        
            if(validator.generalInputValidation(username))
            {
                window.client.username = username;
        
                messageBox.style.display = "none";
            
                const forgotPasswordRequest = 'ForgotPassword$' + username;
                const forgotPasswordResult = await window.client.transferToServer(forgotPasswordRequest, 'forgotPasswordResult');
            
                if (forgotPasswordResult === "Fail") {
                    messageBox.style.display = "block";
                    messageBox.innerText = "Username doesn't exist";
                } else {
                    window.client.navigateTo('/codeVerification');
                }
            }
        });
    }
} 