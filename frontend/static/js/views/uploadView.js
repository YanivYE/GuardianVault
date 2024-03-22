import AbstractView from "./AbstractView.js";

export default class UploadView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Upload");
  }

  async getHtml() {
    return `<div class="container-upload100" style="background-image: url('static/css/images/bg-01.jpg');">
            <div class="wrap-upload100 p-t-30 p-b-50">
                <span class="upload100-form-title p-b-41">
                    Upload File
                </span>
                <div class="upload-container">
                    
                    <form id="uploadForm" class="upload-form" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="fileName">File Name(without extension):</label>
                            <input type="text" id="fileName" name="fileName" placeholder="Enter file name">
                        </div>

                        <div class="form-group">
                            <label for="fileStatus">File Status:</label>
                        </div>

                        <div class="file-status-buttons">
                            <button type="button" id="publicButton" class="file-status-button">Public</button>
                            <button type="button" id="privateButton" class="file-status-button">Private</button>
                        </div>

                        <div class="form-group" id="userSelectGroup" style="display: none; margin-top: 10px;">
                            <label for="userSelect">Select Users:</label>
                            <div id="userCheckboxContainer">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="selectAllUsers" name="selectAllUsers">
                                    <label for="selectAllUsers">Select All</label>
                                </div>
                            </div>
                        </div>

                        <div class="file-upload" id="fileUpload">
                            <input type="file" id="fileInput-upload" class="file-input-upload" multiple>
                            <div class="file-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                            <span class="file-upload-text">Drag or select files</span>
                        </div>
                        
                        <div class="form-group">
                            <button id="uploadButton" type="submit" class="upload-btn">Upload</button>
                        </div>

                        <div class="form-group" id="uploadLoader" style="display: none;">
                            <div class="loader"></div>
                        </div>

                        <div id="message" style="color: red; display: none;"></div> 
                    </form>
                </div>
            </div>
        </div>`;
  }

  async executeViewScript()
  {
    if (!window.client.logedIn) {
      window.client.navigateTo('/login'); // Redirect to login page if not logged in
    }
    
    var publicButton = document.getElementById("publicButton");
    var privateButton = document.getElementById("privateButton");
    var userSelectGroup = document.getElementById("userSelectGroup");
    var uploadForm = document.getElementById("uploadForm");
    var message = document.getElementById("message"); // Error message element
    var loader = document.getElementById('uploadLoader');
    
    // Hide the userSelectGroup field initially
    userSelectGroup.style.display = "none";
    
    // Add event listener to public button
    publicButton.addEventListener("click", function () {
        // Show the userSelectGroup field when the public button is clicked
        userSelectGroup.style.display = "block";
        // Add "active" class to public button and remove it from private button
        publicButton.classList.add("active");
        privateButton.classList.remove("active");
    });
    
    // Add event listener to private button
    privateButton.addEventListener("click", function () {
        // Hide the userSelectGroup field when the private button is clicked
        userSelectGroup.style.display = "none";
        // Add "active" class to private button and remove it from public button
        privateButton.classList.add("active");
        publicButton.classList.remove("active");
        // Clear user selection if "Private" is chosen
        clearUserSelection();
    });
    
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });
    
    // Wrap the code fetching users in an async function
    (async function () {
        var users = await getUsersListFromServer();
    
        // Dynamically generate checkboxes for each user
        var userCheckboxContainer = document.getElementById("userCheckboxContainer");
        users.forEach(function (user) {
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
    })();

    
    // Add event listener for file selection
    var fileInput = document.getElementById('fileInput-upload');
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

    function errorAlert(errorMessage)
    {
        message.style.display = "block"; // Show error message
        message.style.color = "red";
        message.innerText = errorMessage;
    }

    function successAlert(successMessage)
    {
        message.style.display = "block";
        message.style.color = "green";
        message.innerText = successMessage;
    }

    async function getUsersListFromServer() {
        try {

            const usersListRequest = 'UsersList$';
            const usersListResult = await window.client.transferToServer(usersListRequest, 'usersListResult');

            if(usersListResult === "empty")
            {
                return [];
            }
            else{
                const usersList = usersListResult.split(',');
                return usersList;
            }
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }
    
    // Add event listener for form submission
    uploadForm.addEventListener('submit', async function (event) {
    
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
    
        var fileInput = document.getElementById('fileInput-upload');
        var file = fileInput.files[0]; // Get the selected file
    
        // Check if all inputs are valid
        if (fileName !== '' && fileStatus && (privateUpload || users.length > 0) && file) {
            const fileExtension = file.name.split('.').pop().toLowerCase(); // Extract the file extension and convert it to lowercase
    
            // List of PHP file extensions
            const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
            const JSExtentiosns = ['js', 'mjs', 'jsx', 'ts', 'tsx'];
            const executableExtentions = ['exe', 'bat', 'sh', 'cmd'];
    
            // Check if the file extension is in the list of PHP extensions
            if (phpExtensions.includes(fileExtension) || JSExtentiosns.includes(fileExtension) || executableExtentions.includes(fileExtension)) {
                errorAlert("Any PHP, JavaScript and executable \nfile types are not allowed!");
            } else {
                const filePath = fileName + '.' + fileExtension;
                const validationResult = await validateFileName(filePath, users);
                if (validationResult === "Success") {
                    const fileSize = file.size;
    
                    if (fileSize > 1024 * 1024 * 100) // 100MB
                    {
                        errorAlert("File too large, limit is 100MB")
                    } else {
                        document.getElementById("uploadButton").disabled = true;
                        // All inputs are valid, proceed with form submission
                        const reader = new FileReader();
    
                        reader.onload = async (event) => {
                            let fileContent = event.target.result;
    
                            await uploadFile(fileContent, fileSize);
                        };
                        reader.readAsDataURL(file);
                    }
                } else {
                    errorAlert("File name is already taken");
                }
            }
        } else {
            errorAlert("Please fill out all required fields first");
        }
    });
    
    async function uploadFile(fileContent, fileSize) {
        const blockSize = 1024 * 500; // 500KB chunk size
        const totalBlocks = Math.ceil(fileSize / blockSize);
        let offset = 0;
    
        message.style.display = "none";
        loader.style.display = 'block';
    
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
                            loader.style.display = 'none';
                            errorAlert("Error occurred while uploading the file\nPlease try again later");
                        }
                    })
                    .catch(error => {
                        console.error('Error uploading block: ', error);
                        // Handle the error
                        loader.style.display = 'none';
                        errorAlert("Error occurred while uploading the file\nPlease try again later");
                    });
            } else {
                // All chunks have been uploaded successfully
                loader.style.display = 'none';
                successAlert("File uploaded successfully!");
                document.getElementById("uploadButton").disabled = false;
            }
        }
    
        // Start uploading the first chunk
        sendNextBlock();
    }
    
    async function validateFileName(fileName, shareWithUsers) {
    
        const validateFileNameRequest = 'validateName$' + fileName + '$' + shareWithUsers;
        const validateNameResult = await window.client.transferToServer(validateFileNameRequest, 'validateNameResult');
    
        return validateNameResult
    }
    
    async function sendFileBlock(block, blockIndex, totalBlocks) {
    
        const uploadFileBlockRequest = 'UploadFileBlock$' + blockIndex + '$' + block + '$' + totalBlocks;
        const uploadBlockResult = await window.client.transferToServer(uploadFileBlockRequest, 'uploadBlockResult');
    
        return uploadBlockResult;
    }
  
  
  
  
  }
}