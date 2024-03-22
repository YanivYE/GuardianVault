import AbstractView from "./AbstractView.js";

export default class LoginView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Login");
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
                            <input class="input-login100" type="password" name="password" id="password-login" placeholder="Password">
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
                        <div id="errorMessage" style="color: red; display: none;"></div>
        
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
        // Focus input
        const inputFields = document.querySelectorAll(".input-login100");
        inputFields.forEach(function (input) {
            input.addEventListener("blur", function () {
                if (input.value.trim() !== "") {
                    input.parentElement.classList.add("has-val");
                } else {
                    input.parentElement.classList.remove("has-val");
                }
            });
        });

        // Validate form
        const loginForm = document.getElementById("loginForm");
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent default form submission

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
        });

        // Show/Hide password
        const eyeIcon = document.getElementById("eye-login");
        const passwordInput = document.getElementById("password-login");
        eyeIcon.addEventListener("click", function () {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        });

        // Login function
        async function logging() {
            const username = document.getElementsByName("username")[0].value;
            const password = document.getElementsByName("password")[0].value;

            window.client.username = username;

            const loginRequest = "Login$" + username + "$" + password;
            const loginResult = await window.client.transferToServer(loginRequest, "loginResult");

            if (loginResult === "Success") {
                window.client.navigateTo("/codeVerification");
            } else {
                const errorMessage = document.getElementById("errorMessage");
                errorMessage.innerText = "Login failed. Username or password are incorrect";
                errorMessage.style.display = "block";
            }
        }

        // Navigation
        document.getElementById("signupButton").addEventListener("click", function () {
            window.client.navigateTo("/signup");
        });

        document.getElementById("forgotPass").addEventListener("click", function () {
            window.client.navigateTo("/forgotPassword");
        });

        // Validation functions
        function validate(input) {
            if (input.value.trim() === "") {
                return false;
            }
            return true; // Add more specific validation rules if needed
        }

        function showValidate(input) {
            const thisAlert = input.parentElement;
            thisAlert.classList.add("alert-validate");
        }
    }
}