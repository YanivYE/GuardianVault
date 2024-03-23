import AbstractView from "./AbstractView.js";

export default class LoginView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Login");
        this.setMessageBox(document.getElementById("message"));
    }

    async getHtml() {
        return `<div class="limiter">
            <div class="container-login100" style="background-image: url('static/css/images/bg-01.jpg');">
                <div class="wrap-login100 p-t-30 p-b-50">
                    <span class="login100-form-title p-b-41">
                        Account Login
                    </span>
                    <form id="loginForm" class="login100-form validate-form p-b-33 p-t-5">
        
                        <div class="wrap-input-login100 validate-input" data-validate="Enter username">
                            <input class="input-login100" type="text" name="username" placeholder="Username">
                            <span class="focus-input-login100" data-placeholder="&#xe82a;"></span>
                        </div>
        
                        <div class="wrap-input-login100 validate-input" data-validate="Enter password">
                            <input class="input-login100" type="text" name="password" id="password-login" placeholder="Password">
                            <span class="focus-input-login100" data-placeholder="&#xe80f;"></span>
                            <span class="btn-show-pass-login">
                                <i class="fa-solid fa-eye" id="eye-login"></i>
                            </span>
                            </div>
        
                        <div class="container-forgot-login100-form-btn m-t-32">
                            <button id="forgotPass" class="forgot-login100-form-btn">
                                Forgot Password?
                            </button>
                        </div>
        
                        <div class="container-login100-form-btn m-t-32">
                            <button id="loginButton" type="submit" class="login100-form-btn">
                                Login
                            </button>
                        </div>
                        <div id="message" style="color: red; display: none;"></div>
        
                        <div class="container-signup-login100-form-btn m-t-32">
                            <button id="signupButton" class="signup-login100-form-btn">
                                New Here? &nbsp;<span class="underline-text"> Sign Up</span>
                            </button>
                            </div>
                    </form>
                </div>
            </div>
        </div>`;
    }

    async executeViewScript()
    {
        const validator = this.inputValidator;
        const inputFields = document.querySelectorAll(".input-login100");

        // Focus input
        inputFields.forEach(addInputBlurEventListener);

        // Validate form
        const loginForm = document.getElementById("loginForm");
        loginForm.addEventListener("submit", handleFormSubmission);

        // Show/Hide password
        const eyeIcon = document.getElementById("eye-login");
        const passwordInput = document.getElementById("password-login");
        eyeIcon.addEventListener("click", togglePasswordVisibility);

        // Set initial password visibility
        setPasswordVisibility(passwordInput, eyeIcon);

        // Navigation event handlers
        document.getElementById("signupButton").addEventListener("click", navigateToSignup);
        document.getElementById("forgotPass").addEventListener("click", navigateToForgotPassword);
    
        // Focus input event handler
        function addInputBlurEventListener(input) {
            input.addEventListener("blur", function () {
                toggleInputClass(input);
            });
        }

        // Validate form event handler
        async function handleFormSubmission(event) {
            event.preventDefault(); // Prevent default form submission

            const inputFields = document.querySelectorAll(".input-login100");
            let check = true;

            inputFields.forEach(function (input) {
                if (!validate(input)) {
                    showValidate(input);
                    check = false;
                }
            });

            if (check) {
                await logging(); // Call the logging function if validation passes
            }
        }

        // Show/Hide password event handler
        function togglePasswordVisibility() {
            const eyeIcon = document.getElementById("eye-login");
            const passwordInput = document.getElementById("password-login");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Set initial password visibility
        function setPasswordVisibility(passwordInput, eyeIcon) {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Toggle input class
        function toggleInputClass(input) {
            if (input.value.trim() !== "") {
                input.parentElement.classList.add("has-val");
            } else {
                input.parentElement.classList.remove("has-val");
            }
        }

        // Login function
        async function logging() {
            const username = document.getElementsByName("username")[0].value;
            const password = document.getElementsByName("password")[0].value;
            
            if(validateUserInput(username, password))
            {
                window.client.username = username;

                const loginRequest = "Login$" + username + "$" + password;
                const loginResult = await window.client.transferToServer(loginRequest, "loginResult");
    
                if (loginResult === "Success") {
                    window.client.navigateTo("/codeVerification");
                } else {
                    const message = document.getElementById("message");
                    message.innerText = "Login failed. Username or password are incorrect";
                    message.style.display = "block";
                }
            }
        }

        // Navigation functions
        function navigateToSignup() {
            window.client.navigateTo("/signup");
        }

        function navigateToForgotPassword() {
            window.client.navigateTo("/forgotPassword");
        }

        // Validation functions
        function validate(input) {
            return input.value.trim() !== "";
        }

        function showValidate(input) {
            const thisAlert = input.parentElement;
            thisAlert.classList.add("alert-validate");
        }

        function validateUserInput(username, password)
        {
            return validator.validateUsername(username) && validator.validatePassword(password);
        }
    }
}