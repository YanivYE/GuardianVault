
console.log("hello");
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

