(function ($) {
    "use strict";

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

    $('.validate-form').on('submit', function(){
        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }

        return check;
    });

    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate(input) {
        if($(input).val().trim() == ''){
            return false;
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

    document.getElementById('signupButton').addEventListener('click', async function() {
        try {
          const response = await fetch('/signup', { method: 'GET' });
    
          if (response.ok) {
            // Redirect to the signup page
            window.location.href = '/signup';
          } else {
            // Handle error responses
            console.error('Failed to fetch signup page');
          }
        } catch (error) {
          console.error('Error during fetch:', error);
        }
      });

})(jQuery);
