document.addEventListener('DOMContentLoaded', async function () {
    const socket = window.client.socket;

    if (!window.client.logedIn) {
        window.client.loadNextPage('/login'); // Redirect to login page if not logged in
    }

    var publicButton = document.getElementById("publicButton");
    var privateButton = document.getElementById("privateButton");
    var userSelectGroup = document.getElementById("userSelectGroup");
    var uploadForm = document.getElementById("uploadForm");
    var message = document.getElementById("message"); // Error message element

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

    const selectAllCheckbox = document.getElementById('selectAllUsers');
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // Add event listener for form submission
    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission
        
        // Validate inputs
        var fileName = document.getElementById("fileName").value.trim();
        var fileStatus = publicButton.classList.contains("active") || privateButton.classList.contains("active");
        var users = []; // Initialize users as an empty array
        var privateUpload = true;
    
        if (publicButton.classList.contains("active")) {
            privateUpload = false;
            var checkedCheckboxes = document.querySelectorAll('input[name="users"]:checked');
            users = Array.from(checkedCheckboxes).map(checkbox => checkbox.value);
        }
    
        var fileInput = document.getElementById('fileInput');
        var file = fileInput.files[0]; // Get the selected file
        
        // Check if all inputs are valid
        if (fileName !== '' && fileStatus && (privateUpload || users.length > 0) && file) {
            const fileExtension = file.name.split('.').pop().toLowerCase(); // Extract the file extension and convert it to lowercase

            // List of PHP file extensions
            const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
        
            // Check if the file extension is in the list of PHP extensions
            if (phpExtensions.includes(fileExtension)) {
                message.style.display = "block"; // Show error message
                message.style.color = "red";
                message.innerText = "PHP files are not allowed!!!"; // Set error message text
            }
            else
            {
                const fileNameAndExtention = fileName + '.' + fileExtension;
                const validationResult = await validateFileName(fileNameAndExtention, users);
                if(validationResult === "Success")
                {
                    // All inputs are valid, proceed with form submission
                    const reader = new FileReader();

                    reader.onload = async (event) => {
                        let fileContent = event.target.result;
                        await uploadFile(fileContent);
                    };
                    reader.readAsDataURL(file);
                }
                else
                {
                    // Display error message
                    message.style.display = "block"; // Show error message
                    message.style.color = "red";
                    message.innerText = "File name is already taken"; // Set error message text
                }
            }
        } 
        else 
        {
            // Display error message
            message.style.display = "block"; // Show error message
            message.style.color = "red";
            message.innerText = "Please fill out all required fields."; // Set error message text
        }
    });

    async function uploadFile(fileContent) {
        const blockSize = 1024 * 500; // 500KB chunk size
        const fileSize = fileContent.length;
        const totalBlocks = Math.ceil(fileSize / blockSize);
        let offset = 0;
    
        message.style.display = "none";
        document.getElementById('uploadLoader').style.display = 'block';
    
        function sendNextBlock() {
            if (offset < fileSize) {
                const block = fileContent.slice(offset, offset + blockSize);
                const blockIndex = Math.ceil(offset / blockSize);
                
                sendFileBlock(block, blockIndex, totalBlocks)
                    .then(uploadBlockResult => {
                        if (uploadBlockResult === "Success") {
                            offset += blockSize;
                            sendNextBlock(); // Upload the next chunk recursively
                        } else {
                            // Handle the case where chunk upload failed
                            console.error('Failed to upload block ' + blockIndex);
                            document.getElementById('uploadLoader').style.display = 'none';
                            message.style.display = "block";
                            message.style.color = "red";
                            message.innerText = "Error occurred while uploading the file.";
                        }
                    })
                    .catch(error => {
                        console.error('Error uploading block: ', error);
                        // Handle the error
                        document.getElementById('uploadLoader').style.display = 'none';
                        message.style.display = "block";
                        message.style.color = "red";
                        message.innerText = "Error occurred while uploading the file.";
                    });
            } else {
                // All chunks have been uploaded successfully
                console.log("All blocks uploaded successfully");
                document.getElementById('uploadLoader').style.display = 'none';
                message.style.display = "block";
                message.style.color = "green";
                message.innerText = "File uploaded successfully!";
            }
        }
    
        // Start uploading the first chunk
        sendNextBlock();
    }

    

    var users = await getUsersListFromServer();

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

    async function validateFileName(fileName, shareWithUsers) {
        return new Promise(async (resolve, reject) => {
            const validateFileNameRequest = 'validateName$' + fileName + '$' + shareWithUsers;
            const validateFileNamePayload = await window.client.sendToServerPayload(validateFileNameRequest);
    
            socket.emit('ClientMessage', validateFileNamePayload);
            
            socket.on('validateNameResult', (validateNameResult) => {
                resolve(validateNameResult); // Resolve the promise with the result
            });
    
            // Handle errors if any
            socket.on('error', (error) => {
                reject(error); // Reject the promise with the error
            });
        });
    }

    async function sendFileBlock(block, blockIndex, totalBlocks) {
        try {
            const uploadFileBlockRequest = 'UploadFileBlock$' + blockIndex + '$' + block + '$' + totalBlocks;
            const uploadFileBlockPayload = await window.client.sendToServerPayload(uploadFileBlockRequest);
            
            socket.emit('ClientMessage', uploadFileBlockPayload);
    
            return new Promise((resolve, reject) => {
                socket.once('uploadBlockResult', uploadBlockResult => {
                    resolve(uploadBlockResult);
                });
    
                socket.once('error', error => {
                    reject(error);
                });
            });
        } catch (error) {
            throw error;
        }
    }
    

    async function getUsersListFromServer() {
        try {
            const userListPayload = await window.client.sendToServerPayload('UsersList$');
            socket.emit('ClientMessage', userListPayload); 
    
            return new Promise((resolve, reject) => {
                socket.on('usersListPayload', async (usersListPayload) => {
                    if(usersListPayload === "empty")
                    {
                        resolve([]);
                    }
                    else{
                        const usersString = await window.client.receivePayloadFromServer(usersListPayload);
                    
                        const usersList = usersString.split(',');
                        resolve(usersList);
                    }
                    
                });
    
                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then(async (usersList) => {
                return usersList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }
});
