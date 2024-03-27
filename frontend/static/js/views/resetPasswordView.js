import AbstractView from "./AbstractView.js";

export default class ResetPasswordView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Reset Password");
  }

  async getHtml() {
    return `<div class="limiter">
          <div class="container-reset100" style="background-image: url('static/css/images/bg-01.jpg');">
            <div class="wrap-reset100 p-t-30 p-b-50">
              <span class="reset100-form-title p-b-41">
                Reset Your Password
              </span>
              <form id="resetPasswordForm" class="reset100-form validate-form p-b-33 p-t-5">
                          <div class="wrap-input-reset100 validate-input" data-validate="Enter password">
                              <input class="input-reset100" type="text" name="password" id="password-reset" placeholder="Password">
                              <span class="focus-input-reset100" data-placeholder="&#xe80f;"></span>
                              <span class="btn-show-pass">
                                  <i class="fa-solid fa-eye" id="eye-reset"></i>
                              </span>
                              <div id="password-strength-reset" class="password-strength-reset">
                                  <div class="strength-text">Password Requirements:</div>
                                  <div class="requirements">
                                      <div class="requirement" id="length-req">
                                          <input type="checkbox" id="length-check" disabled> Minimum 8 characters
                                      </div>
                                      <div class="requirement" id="lower-req">
                                          <input type="checkbox" id="lower-check" disabled> At least 1 lowercase letter
                                      </div>
                                      <div class="requirement" id="upper-req">
                                          <input type="checkbox" id="upper-check" disabled> At least 1 uppercase letter
                                      </div>
                                      <div class="requirement" id="special-req">
                                          <input type="checkbox" id="special-check" disabled> At least 1 special character (!@#$%^&*-)
                                      </div>
                                  </div>
                                  <div class="strength-meter">
                                      <div class="strength-bar-reset" id="strength-bar-reset"></div>
                                  </div>
                                  <div class="password-strength-text" id="password-strength-text"></div>
                              </div>
                          </div>      
                <div class="container-reset100-form-btn m-t-32">
                  <button id="resetPasswordButton" type="submit" class="reset100-form-btn">
                                  Reset
                              </button>
                </div>
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

    const inputFields = document.querySelectorAll('.input-reset100'); // Corrected selector

    // Focus input
    inputFields.forEach(addInputBlurEventListener);
    
    // Validate form6
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    resetPasswordForm.addEventListener("submit", handleFormSubmission);
 
    // Show/Hide password
    const eyeIcon = document.getElementById("eye-reset");
    const passwordInput = document.getElementById("password-reset");
    eyeIcon.addEventListener("click", togglePasswordVisibility);

    // Set initial password visibility
    setPasswordVisibility(passwordInput, eyeIcon);

    function addInputBlurEventListener(input) { 
        input.addEventListener("blur", function () {
            toggleInputClass(input);
        });
    }

    // Show/Hide password event handler
    function togglePasswordVisibility() {
        const eyeIcon = document.getElementById("eye-reset");
        const passwordInput = document.getElementById("password-reset");
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

    document.getElementById('password-reset').addEventListener('input', function() {
        const password = this.value;
        checkPasswordStrength(password);
    });

    // Update the checkPasswordStrength function
    function checkPasswordStrength(password) {
      const regexLength = /(?=.{8,})/;
      const regexLower = /(?=.*[a-z])/;
      const regexUpper = /(?=.*[A-Z])/;
      const regexSpecial = /(?=.*[!@#$%^&*-])/;

      const lengthCheck = document.getElementById('length-check');
      const lowerCheck = document.getElementById('lower-check');
      const upperCheck = document.getElementById('upper-check');
      const specialCheck = document.getElementById('special-check');

      lengthCheck.checked = regexLength.test(password);
      lowerCheck.checked = regexLower.test(password);
      upperCheck.checked = regexUpper.test(password);
      specialCheck.checked = regexSpecial.test(password);

      const strength = (regexLength.test(password) + regexLower.test(password) +
                          regexUpper.test(password) + regexSpecial.test(password)) / 4;

      const strengthBar = document.getElementById('strength-bar-reset');
      strengthBar.style.width = (strength * 100) + '%';
      strengthBar.style.backgroundColor = getStrengthColor(strength);

      updatePasswordStrengthText(strength);
    }

    // Add a function to update the password strength text
    function updatePasswordStrengthText(strength) {
      const passwordStrengthText = document.getElementById('password-strength-text');
      passwordStrengthText.textContent = getStrengthText(strength);
    }

    // Function to get the color based on the strength
    function getStrengthColor(strength) {
      if (strength < 0.3) {
          return "#FF0000"; // Red for weak
      } else if (strength < 0.6) {
          return "#FFD700"; // Yellow for medium
      } else if(strength < 0.9) {
          return "#00FF00"; // Green for strong
      } else {
          return "#006400"; // darker green
      }
    }

    // Function to get the text based on the strength
    function getStrengthText(strength) {
      if (strength < 0.3) {
          return "Weak";
      } else if (strength < 0.6) {
          return "Medium";
      }  else if (strength < 0.9) {
          return "Strong";
      } else {
          return "Excellent!";
      }
    }

    function validate(password)
    {
        const strengthText = document.getElementById('password-strength-text').textContent;
        return validator.generalInputValidation(password) && 
            validator.validatePasswordStrength(strengthText);
    }

    async function handleFormSubmission(event) {
      event.preventDefault(); 
      
      const password = document.getElementsByName("password")[0].value;
  
      messageBox.style.display = "none"; 

      if(validate(password))
      {
          messageBox.style.display = "block";
          messageBox.style.color = "green"
          messageBox.innerText = "Password reset successfully!";
          const resetPasswordRequest = 'ResetPassword$' + password;
          const resetPasswordResult = await window.client.transferToServer(resetPasswordRequest, 'resetPasswordResult');

          if(resetPasswordResult === 'Success')
          {
            await window.client.authenticate();
            window.client.navigateTo('/menu');
          }
      }
    }
  }
}