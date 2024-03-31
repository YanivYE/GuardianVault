import AbstractView from "./AbstractView.js";

export default class UploadView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Upload");
    }

    async getHtml() {
        // HTML template for the upload view
        return `
            <div class="container-upload100" style="background-image: url('static/css/images/bg-01.jpg');">
                <div class="wrap-upload100 p-t-30 p-b-50">
                    <span class="upload100-form-title p-b-41">
                        Upload File
                    </span>
                    <div class="upload-container">
                        <form id="uploadForm" class="upload-form" enctype="multipart/form-data">
                            <!-- File Name Input -->
                            <div class="form-group">
                                <label for="fileName">File Name (without extension):</label>
                                <input type="text" class="input-text-upload" id="fileName" name="fileName" placeholder="Enter file name">
                            </div>
                            <!-- File Status Input -->
                            <div class="form-group">
                                <label for="fileStatus">File Status:</label>
                            </div>
                            <!-- File Status Buttons -->
                            <div class="file-status-buttons">
                                <button type="button" id="publicButton" class="file-status-button">Public</button>
                                <button type="button" id="privateButton" class="file-status-button">Private</button>
                            </div>
                            <!-- User Selection -->
                            <div class="form-group" id="userSelectGroup" style="display: none; margin-top: 10px;">
                                <label for="userSelect">Select Users:</label>
                                <div id="userCheckboxContainer">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="selectAllUsers" name="selectAllUsers">
                                        <label for="selectAllUsers">Select All</label>
                                    </div>
                                </div>
                            </div>
                            <!-- File Upload Input -->
                            <div class="file-upload" id="fileUpload">
                                <input type="file" id="fileInput-upload" class="file-input-upload" multiple>
                                <div class="file-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                                <span class="file-upload-text">Drag or select files</span>
                            </div>
                            <!-- Upload Button -->
                            <div class="form-group">
                                <button id="uploadButton" type="submit" class="upload-btn">Upload</button>
                            </div>
                            <!-- Loader -->
                            <div class="form-group" id="uploadLoader" style="display: none;">
                                <div class="loader"></div>
                            </div>
                            <!-- Error Message -->
                            <div id="message" style="color: red; display: none;"></div>
                        </form>
                    </div>
                </div>
            </div>`;
    }

    async executeViewScript() {
        // Setup event listeners and initialize components
        const validator = this.inputValidator;
        const messageBox = document.getElementById("message");

        // Set message box for validator
        validator.setMessageBox(messageBox);

        // Redirect to login page if not logged in
        if (!window.client.loggedIn) {
            window.client.navigateTo('/login');
        }

        // Event Listeners
        const publicButton = document.getElementById("publicButton");
        const privateButton = document.getElementById("privateButton");
        const uploadForm = document.getElementById("uploadForm");
        const selectAllCheckbox = document.getElementById('selectAllUsers');
        const fileInput = document.getElementById('fileInput-upload');
        const fileUpload = document.getElementById("fileUpload");
        const userSelectGroup = document.getElementById("userSelectGroup");
        const loader = document.getElementById('uploadLoader');

        // Setup event listeners
        setupEventListeners();
        getUsersListFromServer().then(users => generateUserCheckboxes(users));

        function setupEventListeners() {
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
            userSelectGroup.style.display = "block";
            publicButton.classList.add("active");
            privateButton.classList.remove("active");
        }

        function onPrivateButtonClick() {
            userSelectGroup.style.display = "none";
            privateButton.classList.add("active");
            publicButton.classList.remove("active");
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

        function clearUserSelection() {
            const checkboxes = document.querySelectorAll('input[name="users"]');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = false;
            });
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
        
        // Form submission event listener
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

            const file = fileInput.files[0]; // Get the selected file

            let fileExtension = "";
            let filePath = "";
            if (file) {
                fileExtension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
                filePath = file.name.includes('.') ? fileName + '.' + fileExtension : fileName;
            }

            // Validate form inputs
            if (await validator.validateFileUpload(fileName, fileExtension, fileStatus, users, privateUpload, file)) {
                const validationResult = await validateFileName(filePath, users);
                if (validationResult === "Success") {
                    document.getElementById("uploadButton").disabled = true;
                    // Read file content and upload
                    await readFileAndUpload(file, fileExtension);
                } else {
                    validator.errorAlert("File name is already taken");
                }
            }
        });

        // Function to read file content and upload
        async function readFileAndUpload(file, fileExtension) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const fileContent = event.target.result;
                await uploadFile(fileContent, file.size);
            };
            reader.readAsDataURL(file);
        }

        // Function to upload file
        async function uploadFile(fileContent, fileSize) {
            const blockSize = 1024 * 500; // 500KB chunk size
            const totalBlocks = Math.ceil(fileSize / blockSize);
            let offset = 0;
        
            if (fileSize > 1024 * 1024 * 50) { // 50MB
                validator.delayAlert("Large file size. Upload might take a while...");
            } else {
                messageBox.style.display = "none";
            }
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
                                console.error('Failed to upload block ' + blockIndex);
                                loader.style.display = 'none';
                                validator.errorAlert("Error occurred while uploading the file\nPlease try again later");
                            }
                        })
                        .catch(error => {
                            console.error('Error uploading block: ', error);
                            loader.style.display = 'none';
                            validator.errorAlert("Error occurred while uploading the file\nPlease try again later");
                        });
                } else {
                    loader.style.display = 'none';
                    validator.successAlert("File uploaded successfully!");
                    document.getElementById("uploadButton").disabled = false;
                }
            }
        
            // Start uploading the first chunk
            sendNextBlock();
        }
        
        // Function to validate file name
        async function validateFileName(fileName, shareWithUsers) {
            const validateFileNameRequest = 'validateName$' + fileName + '$' + shareWithUsers;
            return await window.client.transferToServer(validateFileNameRequest, 'validateNameResult');
        }
        
        // Function to send file block
        async function sendFileBlock(block, blockIndex, totalBlocks) {
            const uploadFileBlockRequest = 'UploadFileBlock$' + blockIndex + '$' + block + '$' + totalBlocks;
            return await window.client.transferToServer(uploadFileBlockRequest, 'uploadBlockResult');
        }
    }
}
