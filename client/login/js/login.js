(function ($) {
    "use strict";

    let socket;

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

    // Function to handle login
    async function login(username, password) {
        // Ensure that the socket connection exists
        if (socket) {
            // Example: sending login information to the server via the socket
            socket.emit('login', { username, password });
        } else {
            console.error('Socket connection not available.');
        }
    }

    document.getElementById('loginButton').addEventListener('click', () => {
        // Emit an event to the server
        window.socket.emit('Login', 'clicked on login button');
    });

    window.socket.on('MenuHtmlContent', (html) => {
      document.body.innerHTML = html;
    });

    // // Add event listener to login button
    // document.getElementById('loginButton').addEventListener('click', async function() {
    //     const username = document.getElementsByName("username")[0].value;
    //     const password = document.getElementsByName("password")[0].value;
    //     console.log(username, password);
    //     login(username, password);
    // });

})(jQuery);
