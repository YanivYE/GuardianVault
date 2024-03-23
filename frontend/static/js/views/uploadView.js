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

    // Buttons and Form Elements
    const publicButton = document.getElementById("publicButton");
    const privateButton = document.getElementById("privateButton");
    const uploadForm = document.getElementById("uploadForm");
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    const fileInput = document.getElementById('fileInput-upload');
    const fileUpload = document.getElementById("fileUpload");
    const userSelectGroup = document.getElementById("userSelectGroup");
    const message = document.getElementById("message"); // Error message element
    const loader = document.getElementById('uploadLoader');

    setupEventListeners();
    getUsersListFromServer().then(users => generateUserCheckboxes(users));

    // Setup Event Listeners
    function setupEventListeners() {
        // Add Event Listeners
        publicButton.addEventListener("click", onPublicButtonClick);
        privateButton.addEventListener("click", onPrivateButtonClick);
        selectAllCheckbox.addEventListener('change', onSelectAllCheckboxChange);
        fileInput.addEventListener('change', displayUploadedFile);
        fileUpload.addEventListener('click', onFileUploadClick);
        fileUpload.addEventListener('dragover', onFileUploadDragOver);
        fileUpload.addEventListener('dragleave', onFileUploadDragLeave);
        fileUpload.addEventListener('drop', onFileUploadDrop);
    }

    
    // Event Listener Functions
    function onPublicButtonClick() {
        // Show the userSelectGroup field when the public button is clicked
        userSelectGroup.style.display = "block";
        // Add "active" class to public button and remove it from private button
        publicButton.classList.add("active");
        privateButton.classList.remove("active");
    }

    function onPrivateButtonClick() {
        // Hide the userSelectGroup field when the private button is clicked
        userSelectGroup.style.display = "none";
        // Add "active" class to private button and remove it from public button
        privateButton.classList.add("active");
        publicButton.classList.remove("active");
        // Clear user selection if "Private" is chosen
        clearUserSelection();
    }

    function onSelectAllCheckboxChange() {
        const checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    function displayUploadedFile() {
        const uploadedFileContainer = document.querySelector('.file-upload-text');
        if (fileInput.files.length > 0) {
            uploadedFileContainer.innerText = fileInput.files[0].name;
        } else {
            uploadedFileContainer.innerText = 'Drag or select files';
        }
    }

    function onFileUploadClick() {
        fileInput.click();
    }

    function onFileUploadDragOver(event) {
        event.preventDefault();
        fileUpload.classList.add('drag-over');
    }

    function onFileUploadDragLeave() {
        fileUpload.classList.remove('drag-over');
    }

    function onFileUploadDrop(event) {
        event.preventDefault();
        fileUpload.classList.remove('drag-over');
        if (event.dataTransfer.files.length > 0) {
            document.querySelector('.file-upload-text').innerText = event.dataTransfer.files[0].name;
        }
    }

    // Other Functions
    function clearUserSelection() {
        const checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = false;
        });
    }

    function errorAlert(errorMessage) {
        showMessage(errorMessage, "red");
    }

    function successAlert(successMessage) {
        showMessage(successMessage, "green");
    }

    function showMessage(messageText, color) {
        message.style.display = "block";
        message.style.color = color;
        message.innerText = messageText;
    }

    async function getUsersListFromServer() {
        try {
            const usersListRequest = 'UsersList$';
            const usersListResult = await window.client.transferToServer(usersListRequest, 'usersListResult');

            return usersListResult === "empty" ? [] : usersListResult.split(',');
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    function generateUserCheckboxes(users) {
        const userCheckboxContainer = document.getElementById("userCheckboxContainer");
        users.forEach(function (user) {
            const checkboxDiv = document.createElement("div");
            checkboxDiv.classList.add("checkbox-item");
    
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "users";
            checkbox.value = user;
            checkbox.id = user;
    
            const label = document.createElement("label");
            label.htmlFor = user;
            label.appendChild(document.createTextNode(user));
    
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            userCheckboxContainer.appendChild(checkboxDiv);
        });
    }
    
    // Add event listener for form submission
    uploadForm.addEventListener('submit', async function (event) {
    
        event.preventDefault(); // Prevent default form submission
    
        // Get form inputs
        const fileName = document.getElementById("fileName").value.trim();
        const fileStatus = publicButton.classList.contains("active") || privateButton.classList.contains("active");
        let users = [];
        let privateUpload = true;

        // Determine users and upload status
        if (publicButton.classList.contains("active")) {
            privateUpload = false;
            const checkedCheckboxes = document.querySelectorAll('input[name="users"]:checked');
            users = Array.from(checkedCheckboxes).map(checkbox => checkbox.value);
        }

        const fileInput = document.getElementById('fileInput-upload');
        const file = fileInput.files[0]; // Get the selected file

        const fileExtension = file.name.split('.').pop().toLowerCase();

        // Validate form inputs
        if (validateInputs(fileName, fileExtension, fileStatus, users, privateUpload, file)) {
            const validationResult = await validateFileName(fileName + '.' + fileExtension, users);
            if (validationResult === "Success") {
                document.getElementById("uploadButton").disabled = true;
                // Read file content and upload
                readFileAndUpload(file);
            } else {
                errorAlert("File name is already taken");
            }
        }
    });

    // Function to validate form inputs
    function validateInputs(fileName, fileExtension, fileStatus, users, privateUpload, file) {
        const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
        const JSExtensions = ['js', 'mjs', 'jsx', 'ts', 'tsx'];
        const executableExtensions = ['exe', 'bat', 'sh', 'cmd'];

        if (fileName === '') {
            errorAlert("Please enter a file name");
            return false;
        }
        if (!fileStatus) {
            errorAlert("Please select either public or private upload");
            return false;
        }
        if (!privateUpload && users.length === 0) {
            errorAlert("Please select users for public upload");
            return false;
        }
        if (!file) {
            errorAlert("Please select a file to upload");
            return false;
        }
        if (phpExtensions.includes(fileExtension) || JSExtensions.includes(fileExtension) || executableExtensions.includes(fileExtension)) {
            errorAlert("Any PHP, JavaScript, and executable\n file types are not allowed!");
            return false;
        }
        if (file.size > 1024 * 1024 * 100) {
            errorAlert("File too large, limit is 100MB");
            return false;
        }
        return true;
    }

    // Function to read file content and upload
    function readFileAndUpload(file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target.result;
            await uploadFile(fileContent, file.size);
        };
        reader.readAsDataURL(file);
    }
    
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
        return await window.client.transferToServer(validateFileNameRequest, 'validateNameResult');
    }
    
    async function sendFileBlock(block, blockIndex, totalBlocks) {
        const uploadFileBlockRequest = 'UploadFileBlock$' + blockIndex + '$' + block + '$' + totalBlocks;
        return await window.client.transferToServer(uploadFileBlockRequest, 'uploadBlockResult');
    }
  
  }
}