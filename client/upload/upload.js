const socket = io({
    query: {
      newUser: false
    }
  });

document.addEventListener('DOMContentLoaded', async function () {
    var publicButton = document.getElementById("publicButton");
    var privateButton = document.getElementById("privateButton");
    var userSelectGroup = document.getElementById("userSelectGroup");
    var uploadForm = document.getElementById("uploadForm");
    var errorMessage = document.getElementById("error-message"); // Error message element

    // Hide the userSelectGroup field initially
    userSelectGroup.style.display = "none";

    // Add event listener to public button
    publicButton.addEventListener("click", function() {
        // Show the userSelectGroup field when the public button is clicked
        userSelectGroup.style.display = "block";
        // Add "active" class to public button and remove it from private button
        publicButton.classList.add("active");
        privateButton.classList.remove("active");
    });

    // Add event listener to private button
    privateButton.addEventListener("click", function() {
        // Hide the userSelectGroup field when the private button is clicked
        userSelectGroup.style.display = "none";
        // Add "active" class to private button and remove it from public button
        privateButton.classList.add("active");
        publicButton.classList.remove("active");
        // Clear user selection if "Private" is chosen
        clearUserSelection();
    });

    // Add event listener for form submission
    uploadForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission
        
        // Validate inputs
        var fileName = document.getElementById("fileName").value.trim();
        var fileStatus = publicButton.classList.contains("active") || privateButton.classList.contains("active");
        var users = true; // Assume users are selected by default
        if (publicButton.classList.contains("active")) {
            users = document.querySelectorAll('input[name="users"]:checked').length > 0;
        }
        var files = document.getElementById('fileInput').files.length > 0;

        // Check if all inputs are valid
        if (fileName !== '' && fileStatus && users && files) {
            // All inputs are valid, proceed with form submission
            console.log("Form submission successful!");
            uploadFile(fileName, users, files);
        } else {
            // Display error message
            errorMessage.style.display = "block"; // Show error message
            errorMessage.innerText = "Please fill out all required fields."; // Set error message text
        }
    });

    // Dummy list of users
    var users = await getUsersListFromServer();

    console.log(users);

    // Dynamically generate checkboxes for each user
    var userCheckboxContainer = document.getElementById("userCheckboxContainer");
    users.forEach(function(user) {
        var checkboxDiv = document.createElement("div");
        checkboxDiv.classList.add("checkbox-item");

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "users";
        checkbox.value = user;
        checkbox.id = user;
        
        var label = document.createElement("label");
        label.htmlFor = user;
        label.appendChild(document.createTextNode(user));

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        userCheckboxContainer.appendChild(checkboxDiv);
    });

    // Add event listener for file selection
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', displayUploadedFile);

    // Function to display the uploaded file
    function displayUploadedFile() {
        const uploadedFileContainer = document.querySelector('.file-upload-text');
        
        // Check if a file is selected
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            
            // Display the file name in the file-upload-text span
            uploadedFileContainer.innerText = fileName;
        } else {
            // If no file is selected, clear the container
            uploadedFileContainer.innerText = 'Drag or select files';
        }
    }

    // Add event listener for drag and drop functionality
    var fileUpload = document.getElementById("fileUpload");
    fileUpload.addEventListener('click', function() {
        // Trigger click event on the input element
        fileInput.click();
    });

    fileUpload.addEventListener('dragover', function(event) {
        event.preventDefault();
        fileUpload.classList.add('drag-over');
    });

    fileUpload.addEventListener('dragleave', function() {
        fileUpload.classList.remove('drag-over');
    });

    fileUpload.addEventListener('drop', function(event) {
        event.preventDefault();
        fileUpload.classList.remove('drag-over');
        
        const fileList = event.dataTransfer.files;
        // Display the first file name in the file-upload-text span
        if (fileList.length > 0) {
            const fileName = fileList[0].name;
            document.querySelector('.file-upload-text').innerText = fileName;
        }
    });

    // Function to clear user selection
    function clearUserSelection() {
        var checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = false;
        });
    }

    function uploadFile(fileName, users, files)
    {

    }

    async function getUsersListFromServer() {
        try {
            const userListPayload = await sendToServerPayload('UsersList$');
            socket.emit('ClientMessage', userListPayload); // Not sure why you're emitting here, but you can handle it based on your application's logic
    
            return new Promise((resolve, reject) => {
                socket.on('usersListResult', (usersList) => {
                    resolve(usersList);
                });
    
                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then((usersList) => {
                return usersList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }
});
