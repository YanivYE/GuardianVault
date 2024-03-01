(function ($) {
    "use strict";

    const socket =  window.client.socket;
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = "";

    /*==================================================================
    [ Focus input ]*/
    $('.input100').each(function(){
        $(this).on('blur', function(){
            if($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })    
    })

    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit', function(event){
        event.preventDefault(); // Prevent default form submission

        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }

        if(check)
        {
            signingUp();
        }
    });

    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate(input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        } else {
            if($(input).val().trim() == ''){
                return false;
            }
        }
        if ($(input).attr('type') == 'password') {
            const password = $(input).val().trim();
            const strengthText = document.getElementById('password-strength-text').textContent;

            // Check if the password strength is "Strong" or "Excellent!"
            if (strengthText !== 'Strong' && strengthText !== 'Excellent!') {
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).removeClass('alert-validate');
    }

    /*==================================================================
    [ Show pass ]*/
    document.addEventListener('DOMContentLoaded', function () {

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
        togglePassword();

        // Add an event listener for the Show Password button
        document.querySelector('.btn-show-pass').addEventListener('click', function () {
            togglePassword();
        });
    });

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

        const strengthBar = document.getElementById('strength-bar');
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
        } else if(strength < 0.9)
        {
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

    async function signingUp() 
    {
        const username = document.getElementsByName("username")[0].value;
        const email = document.getElementsByName("email")[0].value;
        const password = document.getElementsByName("password")[0].value;

        window.client.username = username;
        
        const signupPayload = await window.client.sendToServerPayload('SignUp$' + username + '$' + email + '$' + password);
        socket.emit('ClientMessage', signupPayload);   
        
        socket.on('signupResult', async (operationResult) => {
            if(operationResult === "UsernameFail")
            {
                errorMessage.textContent = "SignUp failed. Username already exists";
                errorMessage.style.display = 'block';
            }
            else if(operationResult === "EmailFail")
            {
                errorMessage.textContent = "SignUp failed. Email already exists";
                errorMessage.style.display = 'block';
            }
            else
            {
                window.client.logedIn = true;
                window.client.loadNextPage('/menu');
            }
        });
    }

})(jQuery);
