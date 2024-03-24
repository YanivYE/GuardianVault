import AbstractView from "./AbstractView.js";

export default class DownloadView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Download");
  }

  async getHtml() {
    return `<div class="container-download100" style="background-image: url('static/css/images/bg-01.jpg');">
            <div class="wrap-download100 p-t-30 p-b-50 download-form">
                <span class="download100-form-title p-b-41"> <!-- New div wrapper -->
                    Download File
                </span>
                <div  id="downloadContainer">
                    <div class="download-container">
                        <h2>Search Files</h2>
                        <div class="search-container">
                            <input type="search" id="searchBar" placeholder="Search files...">
                            <button id="searchButton">Search</button>
                        </div>
                        <h2>Your Files</h2>
                        <div id="fileList">
                            <ul id="fileListItems">
                            </ul>
                        </div>
                        <h2>Files Shared with You</h2>
                        <div id="fileList">
                            <ul id="sharedFilesList">
                            </ul>
                        </div>
                        <h2>‎ </h2>
                        
                        <button id="deleteFileButton">Delete File</button>

                        <div class="spacer"></div>

                        <form id="downloadForm">
                            <button type="submit" id="downloadButton">Download</button>
                        </form>

                        <div class="spacer"></div>

                        <div class="form-group" id="downloadLoader" style="display: none;">
                            <div class="loader"></div>
                        </div>

                        <div class="spacer"></div>

                        <div id="message" style="color: red; display: none;"></div>
                    </div>
                </div> 
            </div>
        </div>`;
  }

  async executeViewScript()
  {
    const socket = window.client.socket;

    const cryptographyTunnel = window.client.cryptographyTunnel;

    const messageBox = document.getElementById("message");

    // Check if user is logged in, if not, redirect to login page
    if (!window.client.logedIn) {
        window.client.navigateTo('/login');
    }

    // Initialize files arrays
    let files = [];
    let sharedFiles = [];

    await displayFiles();
    setupEventListeners();

    // Display user files and shared files
    async function displayFiles() {
        files = await getUserOwnFilesListFromServer();
        sharedFiles = await getUserSharedFilesListFromServer();
        populateFileList();
        displaySharedFiles();
    }

    // Setup event listeners
    function setupEventListeners() {
        const searchButton = document.getElementById('searchButton');
        const downloadForm = document.getElementById('downloadForm');
        const deleteButton = document.getElementById('deleteFileButton');

        searchButton.addEventListener('click', handleSearch);
        downloadForm.addEventListener('submit', handleDownload);
        deleteButton.addEventListener('click', handleDelete);
    }

    // Handle search functionality
    function handleSearch() {
        const searchTerm = document.getElementById('searchBar').value.toLowerCase();
        const filteredOwnFiles = files.filter(file => file.toLowerCase().includes(searchTerm));
        const filteredSharedFiles = sharedFiles.filter(user =>
            user.files.some(file => file.toLowerCase().includes(searchTerm))
        );
        populateFileList(filteredOwnFiles);
        displaySharedFiles(filteredSharedFiles);
    }

    // Handle file download
    async function handleDownload(event) {
        event.preventDefault();
        const selectedFiles = document.querySelectorAll('.file-button[style="background: gray;"]');
        for (const file of selectedFiles) {
            const fileName = file.textContent;
            const owner = file.getAttribute('owner');
            await downloadFile(fileName, owner);
        }
    }

    // Handle file deletion
    async function handleDelete(event) {
        event.preventDefault();
        const selectedFiles = document.querySelectorAll('.file-button[style="background: gray;"]');
        for (const file of selectedFiles) {
            const fileName = file.textContent;
            const owner = file.getAttribute('owner');
            await deleteFile(fileName, owner);
        }
    }

    // Display user files list
    function populateFileList(filteredFiles = files) {
        const fileListItems = document.getElementById("fileListItems");
        fileListItems.innerHTML = "";
        filteredFiles.forEach(file => {
            const listItem = document.createElement("li");
            const fileButton = createFileButton(file, null);
            listItem.appendChild(fileButton);
            fileListItems.appendChild(listItem);
        });
    }

    // Create file button element
    function createFileButton(file, user) {
        const fileButton = document.createElement("button");
        fileButton.textContent = file;
        const username = user === null ? null : user.user;
        fileButton.setAttribute('owner', username);
        fileButton.classList.add('file-button');
        fileButton.addEventListener('click', function () {
            toggleFile(this);
        });
        return fileButton;
    }

    // Display shared files
    function displaySharedFiles(filteredFiles = sharedFiles) {
        const sharedWithMeDetails = document.getElementById('sharedFilesList');
        sharedWithMeDetails.innerHTML = '';
        filteredFiles.forEach(user => {
            const userSection = createUserSection(user);
            sharedWithMeDetails.appendChild(userSection);
        });
    }

    // Create user section element
    function createUserSection(user) {
        const userSection = document.createElement('div');
        userSection.classList.add('shared-user-section');
    
        const userFilesList = createUserFilesList(user);
        const userHeader = createUserHeader(user, userFilesList);
    
        userSection.appendChild(userHeader);
        userSection.appendChild(userFilesList);
    
        return userSection;
    }

    // Create user header element
    function createUserHeader(user, userFilesList) {
        const userHeader = document.createElement('h3');
        const filesAmount = user.files.length;
        const sharedUserName = `${user.user} (${filesAmount} ${filesAmount === 1 ? 'file' : 'files'})`;
        const arrowIcon = createArrowIcon();
    
        userHeader.appendChild(arrowIcon);
        userHeader.textContent += sharedUserName;
        userHeader.classList.add('shared-user-header');
        userHeader.addEventListener('click', function () {
            toggleSharedFiles(userFilesList, arrowIcon, userHeader, sharedUserName);
        });
    
        return userHeader;
    }

    // Create arrow icon element
    function createArrowIcon() {
        const arrowIcon = document.createElement('span');
        arrowIcon.textContent = '\u25B6 ';
        arrowIcon.classList.add('arrow-icon');
        arrowIcon.style.cursor = 'pointer';
        return arrowIcon;
    }

    // Create user files list element
    function createUserFilesList(user) {
        const userFilesList = document.createElement('ul');
        userFilesList.classList.add('shared-user-files');
        userFilesList.style.display = 'none';
        user.files.forEach(file => {
            const fileButton = createFileButton(file, user);
            const fileItem = document.createElement('li');
            fileItem.appendChild(fileButton);
            userFilesList.appendChild(fileItem);
        });
        return userFilesList;
    }

    // Toggle display of shared files
    function toggleSharedFiles(element, arrowIcon, userHeader, sharedUserName) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
        arrowIcon.textContent = element.style.display === 'none' ? '\u25B6 ' : '\u25BC ';
        userHeader.textContent = "";
        userHeader.appendChild(arrowIcon);
        userHeader.textContent += sharedUserName;
    }

    // Toggle file selection
    function toggleFile(button) {
        const allButtons = document.querySelectorAll('.file-button');
        allButtons.forEach(btn => {
            if (btn !== button) {
                btn.style.background = '#003366';
            }
        });
        button.style.background = button.style.background === 'gray' ? '#003366' : 'gray';
    }

    // Get user's own files list from server
    async function getUserOwnFilesListFromServer() {
        try {
            const ownFileListRequest = 'ownFileList$';
            const ownFileListResult = await window.client.transferToServer(ownFileListRequest, 'ownFileListResult');
            if (ownFileListResult === "empty") {
                return [];
            } else {
                return ownFileListResult.split(',');
            }
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    // Get user's shared files list from server
    async function getUserSharedFilesListFromServer() {
        try {
            const sharedFileListRequest = 'sharedFileList$';
            const sharedFileListResult = await window.client.transferToServer(sharedFileListRequest, 'sharedFileListResult');
            if (sharedFileListResult === "empty") {
                return [];
            } else {
                return convertStringToFilesList(sharedFileListResult);
            }
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    // Convert string to files list
    function convertStringToFilesList(str) {
        const filesList = [];
        const userFilesPairs = str.split('#');
        for (const pair of userFilesPairs) {
            if (pair !== '') {
                const [user, files] = pair.split(':');
                const fileList = files.split(',');
                filesList.push({ user, files: fileList });
            }
        }
        return filesList;
    }

    async function downloadFile(fileName, fileOwner)
    {
        var fileDownloaded = false;
        messageBox.style.display = "none";
        document.getElementById('downloadButton').disabled = true;
        document.getElementById('downloadLoader').style.display = 'block';
        const downloadFileRequest = 'DownloadFile$' + fileName + '$' + fileOwner;
        const downloadFilePayload = await cryptographyTunnel.generateClientPayload(downloadFileRequest);
        socket.emit('ClientMessage', downloadFilePayload);

        const fileData = await assembleFileContent();
        
        document.getElementById('downloadLoader').style.display = 'none';
        
        if(fileData && !fileDownloaded)
        {
            fileDownloaded = true;
            
            try {
                getFileInBrowser(fileData, fileName);
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }
    }

    function assembleFileContent() {
        return new Promise((resolve, reject) => {
            let fileData = "";
            let totalBlocks = -1;
            let receivedBlocks = 0;

            socket.on('fileBlock', async (fileBlockPayload) => {
                const serverPayload = await cryptographyTunnel.receivePayloadFromServer(fileBlockPayload);
                const [blockIndex, block, totalBlocksStr] = serverPayload.split('$');

                const currentBlockIndex = parseInt(blockIndex);
                const currentTotalBlocks = parseInt(totalBlocksStr);

                if (totalBlocks === -1) {
                    totalBlocks = currentTotalBlocks;
                }

                if (currentBlockIndex === receivedBlocks) {
                    fileData += block;
                    receivedBlocks++;

                    // If this is the last block, resolve with the full file data
                    if (receivedBlocks === totalBlocks) {
                        resolve(fileData);
                    }
                } 
            });
        });
    }

    function getFileInBrowser(fileData, fileName)
    {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', fileData, true);
        xhr.responseType = 'blob';

        xhr.onload = function () {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);

                a.click();

                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Display success message
                messageBox.style.display = "block";
                messageBox.style.color = "green";
                messageBox.innerText = "File downloaded successfully!";
                document.getElementById('downloadButton').disabled = false;
            } else {
                console.error('Failed to download file:', xhr.statusText);
            }
        };

        xhr.onerror = function () {
            console.error('Failed to download file:', xhr.statusText);
        };

        xhr.send();
    }

    async function deleteFile(fileName, fileOwner)
    {
        messageBox.style.display = "none"; 
        document.getElementById('downloadLoader').style.display = 'block';

        const deleteFileRequest = 'DeleteFile$' + fileName + '$' + fileOwner;
        const deleteFileResult = await window.client.transferToServer(deleteFileRequest, 'deleteFileResult');

        if(deleteFileResult === 'Success')
        {
            await displayFiles();

            document.getElementById('downloadLoader').style.display = 'none';

            messageBox.style.display = "block";
            messageBox.style.color = "green";
            messageBox.innerText = "File deleted successfully!";
        }
    }
  }
}