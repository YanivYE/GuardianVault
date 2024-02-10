document.addEventListener('DOMContentLoaded', function () {
    var publicButton = document.getElementById("publicButton");
    var privateButton = document.getElementById("privateButton");
    var userSelectGroup = document.getElementById("userSelectGroup");

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
    });

    // Dummy list of users
    var users = ["User1", "User2", "User3", "User4", "User5"];

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
});
