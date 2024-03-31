import AbstractView from "./AbstractView.js";

export default class LoginView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Login");
    }

    async getHtml() {
        return `
        <div class="limiter">
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

    async executeViewScript() {
        // Initialize validator
        const validator = this.inputValidator;
        const messageBox = document.getElementById("message");
        validator.setMessageBox(messageBox);

        // Event listeners
        const loginForm = document.getElementById("loginForm");
        loginForm.addEventListener("submit", handleFormSubmission);

        const eyeIcon = document.getElementById("eye-login");
        eyeIcon.addEventListener("click", togglePasswordVisibility);

        document.getElementById("signupButton").addEventListener("click", navigateToSignup);
        document.getElementById("forgotPass").addEventListener("click", navigateToForgotPassword);

        // Initializations
        const inputFields = document.querySelectorAll(".input-login100");
        inputFields.forEach(addInputBlurEventListener);
        setPasswordVisibility();

        // Function to toggle input class
        function addInputBlurEventListener(input) {
            input.addEventListener("blur", function () {
                toggleInputClass(input);
            });
        }

        // Function to toggle password visibility
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById("password-login");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to set initial password visibility
        function setPasswordVisibility() {
            const passwordInput = document.getElementById("password-login");
            const eyeIcon = document.getElementById("eye-login");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to toggle input class based on value
        function toggleInputClass(input) {
            const parentElement = input.parentElement;
            if (input.value.trim() !== "") {
                parentElement.classList.add("has-val");
            } else {
                parentElement.classList.remove("has-val");
            }
        }

        // Function to validate form inputs
        function validate(username, password) {
            return validator.generalInputValidation(username) && validator.generalInputValidation(password);
        }

        // Function to handle form submission
        async function handleFormSubmission(event) {
            event.preventDefault();
            const username = document.getElementsByName("username")[0].value;
            const password = document.getElementsByName("password")[0].value;
            
            if (validate(username, password)) {
                window.client.username = username;
                const loginRequest = "Login$" + username + "$" + password;
                const loginResult = await window.client.transferToServer(loginRequest, "loginResult");
    
                if (loginResult === "Success") {
                    window.client.navigateTo("/codeVerification");
                } 
                else if(loginResult === "User Connected")
                {
                    validator.errorAlert("Login Failed. Username already connected.");
                }
                else {
                    validator.errorAlert("Login Failed. Username or password are incorrect.");
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
    }
}
