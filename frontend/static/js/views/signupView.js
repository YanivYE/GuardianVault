import AbstractView from "./AbstractView.js";

export default class SignupView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Signup");
    }

    // Generate HTML content for signup view
    async getHtml() {
        return `
            <div class="limiter">
                <div class="container-signup100" style="background-image: url('static/css/images/bg-01.jpg');">
                    <div class="wrap-signup100 p-t-30 p-b-50">
                        <span class="signup100-form-title p-b-41">
                            Sign Up
                        </span>
                        <form id="signupForm" class="signup100-form validate-form p-b-33 p-t-5">
                            <div class="wrap-input-signup100 validate-input" data-validate="Enter username">
                                <input class="input-signup100" type="text" name="username" placeholder="Username">
                                <span class="focus-input-signup100" data-placeholder="&#xe82a;"></span>
                            </div>
                            <div class="wrap-input-signup100 validate-input" data-validate="Enter email">
                                <input class="input-signup100" type="text" name="email" placeholder="Email">
                                <span class="focus-input-signup100" data-placeholder="✉"></span>
                            </div>
                            <div class="wrap-input-signup100 validate-input" data-validate="Enter password">
                                <input class="input-signup100" type="text" name="password" id="password-signup" placeholder="Password">
                                <span class="focus-input-signup100" data-placeholder="&#xe80f;"></span>
                                <span class="btn-show-pass-signup">
                                    <i class="fa-solid fa-eye" id="eye-signup"></i>
                                </span>
                                <div id="password-strength-signup" class="password-strength-signup">
                                    <div class="strength-text">Password Requirements:</div>
                                    <div class="requirements-signup">
                                        <div class="requirement-signup" id="length-req-signup">
                                            <input type="checkbox" id="length-check-signup" disabled> Minimum 8 characters
                                        </div>
                                        <div class="requirement-signup" id="lower-req-signup">
                                            <input type="checkbox" id="lower-check-signup" disabled> At least 1 lowercase letter
                                        </div>
                                        <div class="requirement-signup" id="upper-req-signup">
                                            <input type="checkbox" id="upper-check-signup" disabled> At least 1 uppercase letter
                                        </div>
                                        <div class="requirement-signup" id="special-req-signup">
                                            <input type="checkbox" id="special-check-signup" disabled> At least 1 special character (!@#$%^&*-)
                                        </div>
                                    </div>
                                    <div class="strength-meter">
                                        <div class="strength-bar-signup" id="strength-bar-signup"></div>
                                    </div>
                                    <div class="password-strength-signup-text" id="password-strength-signup-text"></div>
                                </div>
                            </div>      
                            <div class="container-signup100-form-btn m-t-32">
                                <button id="signupButton" type="submit" class="signup100-form-btn">
                                    Sign Up
                                </button>
                            </div>
                            <div id="message" style="color: red; display: none;"></div>
                        </form>
                    </div>
                </div>
            </div>`;
    }

    // Execute script specific to signup view
    async executeViewScript() {
        const validator = this.inputValidator;
        const messageBox = document.getElementById("message");
        validator.setMessageBox(messageBox);
        const inputFields = document.querySelectorAll('.validate-input .input-signup100');

        // Add event listener to input fields for blur event
        inputFields.forEach(addInputBlurEventListener);
        const signupForm = document.getElementById("signupForm");
        signupForm.addEventListener("submit", handleFormSubmission);
        const eyeIcon = document.getElementById("eye-signup");
        const passwordInput = document.getElementById("password-signup");
        eyeIcon.addEventListener("click", togglePasswordVisibility);
        setPasswordVisibility(passwordInput, eyeIcon);

        // Add event listener to password input for input event
        document.getElementById('password-signup').addEventListener('input', function() {
            const password = this.value;
            checkPasswordStrength(password);
        });

        // Add blur event listener to input fields
        function addInputBlurEventListener(input) { 
            input.addEventListener("blur", function () {
                toggleInputClass(input);
            });
        }

        // Function to toggle password visibility
        function togglePasswordVisibility() {
            const eyeIcon = document.getElementById("eye-signup");
            const passwordInput = document.getElementById("password-signup");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to set initial password visibility
        function setPasswordVisibility(passwordInput, eyeIcon) {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to toggle input class based on input value
        function toggleInputClass(input) {
            if (input.value.trim() !== "") {
                input.parentElement.classList.add("has-val");
            } else {
                input.parentElement.classList.remove("has-val");
            }
        }

        // Function to check password strength and update UI
        function checkPasswordStrength(password) {
            const regexLength = /(?=.{8,})/;
            const regexLower = /(?=.*[a-z])/;
            const regexUpper = /(?=.*[A-Z])/;
            const regexSpecial = /(?=.*[!@#$%^&*-])/;

            const lengthCheck = document.getElementById('length-check-signup');
            const lowerCheck = document.getElementById('lower-check-signup');
            const upperCheck = document.getElementById('upper-check-signup');
            const specialCheck = document.getElementById('special-check-signup');

            lengthCheck.checked = regexLength.test(password);
            lowerCheck.checked = regexLower.test(password);
            upperCheck.checked = regexUpper.test(password);
            specialCheck.checked = regexSpecial.test(password);

            const strength = (regexLength.test(password) + regexLower.test(password) +
                regexUpper.test(password) + regexSpecial.test(password)) / 4;

            const strengthBar = document.getElementById('strength-bar-signup');
            strengthBar.style.width = (strength * 100) + '%';
            strengthBar.style.backgroundColor = getStrengthColor(strength);

            updatePasswordStrengthText(strength);
        }

        // Function to update the password strength text
        function updatePasswordStrengthText(strength) {
            const passwordStrengthText = document.getElementById('password-strength-signup-text');
            passwordStrengthText.textContent = getStrengthText(strength);
        }

        // Function to get the color based on the strength
        function getStrengthColor(strength) {
            if (strength < 0.3) {
                return "#FF0000"; // Red for weak
            } else if (strength < 0.6) {
                return "#FFD700"; // Yellow for medium
            } else if (strength < 0.9) {
                return "#00FF00"; // Green for strong
            } else {
                return "#006400"; // Darker green for excellent
            }
        }

        // Function to get the text based on the strength
        function getStrengthText(strength) {
            if (strength < 0.3) {
                return "Weak";
            } else if (strength < 0.6) {
                return "Medium";
            } else if (strength < 0.9) {
                return "Strong";
            } else {
                return "Excellent!";
            }
        }

        // Function to validate form inputs
        function validate(username, email, password) {
            const strengthText = document.getElementById('password-strength-signup-text').textContent;
            return validator.generalInputValidation(username) && 
                validator.generalInputValidation(email) &&
                validator.validateEmail(email) && 
                validator.generalInputValidation(password) && 
                validator.validatePasswordStrength(strengthText);
        }

        // Function to handle form submission
        async function handleFormSubmission(event) {
            event.preventDefault(); 
            const username = document.getElementsByName("username")[0].value;
            const email = document.getElementsByName("email")[0].value;
            const password = document.getElementsByName("password")[0].value;

            if (validate(username, email, password)) {
                window.client.username = username;

                const signupRequest = 'SignUp$' + username + '$' + email + '$' + password;
                const signupResult = await window.client.transferToServer(signupRequest, 'signupResult');

                if (signupResult === "UsernameFail") {
                    validator.errorAlert("Signup Failed. Username already exists.")
                } else if (signupResult === "EmailFail") {
                    validator.errorAlert("Signup Failed. Email already exists.")
                } else {
                    await window.client.authenticate();
                    window.client.navigateTo('/menu');
                }
            }
        }
    }
}
