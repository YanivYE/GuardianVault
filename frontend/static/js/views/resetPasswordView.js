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
                              <input class="input-reset100" type="password" name="password" id="password" placeholder="Password">
                              <span class="focus-input-reset100" data-placeholder="&#xe80f;"></span>
                              <span class="btn-show-pass">
                                  <i class="fa-solid fa-eye-reset" id="eye"></i>
                              </span>
                              <div id="password-strength" class="password-strength">
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
    /*==================================================================
    [ Focus input ]*/
    document.querySelectorAll('.input-reset100').forEach(function(input) {
      input.addEventListener('blur', function() {
          if (this.value.trim() !== "") {
              this.classList.add('has-val');
          } else {
              this.classList.remove('has-val');
          }
      });
    });

    function togglePassword() {
        const eye = document.querySelector("#eye");
        const passwordInput = document.querySelector("#password");

        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);

        // Corrected the class name for the eye icon
        eye.classList.toggle("fa-eye-slash", type === "password");
    }

    // Call the togglePassword function on document load
    togglePassword();

    // Add an event listener for the Show Password button
    document.querySelector('.btn-show-pass').addEventListener('click', function () {
        togglePassword();
    });

    document.getElementById("resetPasswordForm").addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const message = document.getElementById("message");
        const password = document.getElementsByName("password")[0].value;
    
        message.style.display = "none"; 
    
        const strength = getPasswordStrength(password);

        if (strength > 0.6) { 
            message.style.display = "block";
            message.style.color = "green"
            message.innerText = "Password reset successfully!";
            const resetPasswordRequest = 'ResetPassword$' + password;
            const resetPasswordResult = await window.client.transferToServer(resetPasswordRequest, 'resetPasswordResult');

            if(resetPasswordResult === 'Success')
            {
                window.client.logedIn = true;
                window.client.navigateTo('/menu');
            }
        } else {
            message.style.display = "block";
            message.style.color = "red"
            message.innerText = "Password strength must be at least strong!";
        }
    });
    

    function getPasswordStrength(password) {
      const regexLength = /(?=.{8,})/;
      const regexLower = /(?=.*[a-z])/;
      const regexUpper = /(?=.*[A-Z])/;
      const regexSpecial = /(?=.*[!@#$%^&*-])/;

      const strength = (regexLength.test(password) + regexLower.test(password) +
                          regexUpper.test(password) + regexSpecial.test(password)) / 4;

      return strength;
    }

    document.getElementById('password').addEventListener('input', function() {
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
  }
}