(function ($) {
    "use strict";

    const socket = window.client.socket;

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
            logging(); // Call the logging function if validation passes
        }
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
        return true; // Add more specific validation rules if needed
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

    async function logging() {
        const username = document.getElementsByName("username")[0].value;
        const password = document.getElementsByName("password")[0].value;

        window.client.username = username;
        
        const loginPayload = await window.client.sendToServerPayload('Login$' + username + '$' + password);
        // Send login information to the server
        socket.emit('ClientMessage', loginPayload);     
        
        // Wait for acknowledgement from the server
        socket.on('loginResult', async (operationResult) => {
            if(operationResult === "Success")
            {
                window.client.loadNextPage('/code-verification');
            }
            else{
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.innerText = "Login failed. Username or password are incorrect";
                errorMessage.style.display = 'block';
            }
        });
    }

    document.getElementById('signupButton').addEventListener('click', () => {
        window.client.loadNextPage('/signup');
    });

    document.getElementById('forgotPass').addEventListener('click', () => {
        window.client.loadNextPage('/forgot-password');
    });

})(jQuery);
