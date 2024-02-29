const socket = window.client.socket;

document.addEventListener('DOMContentLoaded', async function () 
{
    if (!window.client.logedIn) {
        window.client.loadNextPage('/login'); // Redirect to login page if not logged in
      }

    let files = await getUserOwnFilesListFromServer();

    let sharedFiles = await getUserSharedFilesListFromServer();

    displayUserFiles();

    // Get the elements
    const searchButton = document.getElementById('searchButton');
    const downloadForm = document.getElementById('downloadForm');
    const deleteButton = document.getElementById('deleteFileButton');

    // Add event listener for input event on search bar
    searchButton.addEventListener('click', function() {
        // Get the current value of the search bar
        const searchTerm = document.getElementById('searchBar').value.toLowerCase();

        const filteredOwnFiles = files.filter(file => file.toLowerCase().includes(searchTerm));

        // Filter the list of shared files based on the search term
        const filteredSharedFiles = sharedFiles.filter(user => {
            const filteredUserFiles = user.files.filter(file => file.toLowerCase().includes(searchTerm));
            return filteredUserFiles.length > 0;
        });

        // Update the display to show only the filtered file names
        populateFileList(filteredOwnFiles);
        displaySharedFiles(filteredSharedFiles);
    });

    deleteButton.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default form submission behavior
    
        // Gather selected files
        const selectedFiles = document.querySelectorAll('.file-button[style="background: gray;"]');
        
        selectedFiles.forEach(file => {
            // Extract owner's name and file name from the button's text content
            const fileName = file.textContent;
            const owner = file.getAttribute('owner');

            deleteFile(fileName, owner);
            
        });
    });
    
    
    downloadForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission behavior
    
        // Gather selected files
        const selectedFiles = document.querySelectorAll('.file-button[style="background: gray;"]');
        
        selectedFiles.forEach(file => {
            // Extract owner's name and file name from the button's text content
            const fileName = file.textContent;
            const owner = file.getAttribute('owner');
            
            downloadFile(fileName, owner);
        });
    });

    async function displayUserFiles()
    {
        populateFileList();
        displaySharedFiles();
    }

    async function getUserOwnFilesListFromServer() {
        try {
            const ownFileListPayload = await window.client.sendToServerPayload('ownFileList$');
            socket.emit('ClientMessage', ownFileListPayload); // Not sure why you're emitting here, but you can handle it based on your application's logic

            return new Promise((resolve, reject) => {
                socket.on('ownFileListResult', (filesList) => {
                    resolve(filesList);
                });

                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then((filesList) => {
                return filesList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    async function getUserSharedFilesListFromServer() {
        try {
            const sharedFileListPayload = await window.client.sendToServerPayload('sharedFileList$');
            socket.emit('ClientMessage', sharedFileListPayload); // Not sure why you're emitting here, but you can handle it based on your application's logic

            return new Promise((resolve, reject) => {
                socket.on('sharedFileListResult', (filesList) => {
                    resolve(filesList);
                });

                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then((filesList) => {
                return filesList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    // Function to populate file list
    function populateFileList(filteredFiles = []) {
        var fileListItems = document.getElementById("fileListItems");
        fileListItems.innerHTML = ""; // Clear existing list items

        // Use the filtered files if provided, otherwise use the original files array
        const filesToDisplay = filteredFiles.length > 0 ? filteredFiles : files;

        filesToDisplay.forEach(function(file) {
            var listItem = document.createElement("li");
            var fileButton = document.createElement("button"); // Create button element
            fileButton.textContent = file; // Set button text
            fileButton.classList.add('file-button'); // Add a class for styling
            fileButton.addEventListener('click', function() { // Add click event listener
                toggleFile(this);
            });
            listItem.appendChild(fileButton); // Append button to list item
            fileListItems.appendChild(listItem); // Append list item to file list
        });
    }

    // Function to display shared files
    function displaySharedFiles(filteredFiles = []) {
        const sharedWithMeDetails = document.getElementById('sharedFilesList');
        sharedWithMeDetails.innerHTML = ''; // Clear existing content

        const usersToDisplay  = filteredFiles.length > 0 ? filteredFiles : sharedFiles;

        usersToDisplay.forEach(user => {
            const userSection = document.createElement('div');
            userSection.classList.add('shared-user-section');
    
    
            const userHeader = document.createElement('h3');
            const filesAmount = user.files.length;
    
            const sharedUserName = `${user.user} (${filesAmount} ${filesAmount === 1 ? 'file' : 'files'})`;

            // Create arrow icon
            const arrowIcon = document.createElement('span');
            arrowIcon.textContent = '\u25B6 '; // Unicode for right-pointing triangle
            arrowIcon.classList.add('arrow-icon');
            arrowIcon.style.cursor = 'pointer';
            arrowIcon.addEventListener('click', function() {
                toggleSharedFiles(userFilesList, arrowIcon, userHeader, sharedUserName);
            });
            userHeader.appendChild(arrowIcon);
     
            userHeader.textContent += sharedUserName;
            userHeader.classList.add('shared-user-header');

    
            const userFilesList = document.createElement('ul');
            userFilesList.classList.add('shared-user-files');
            userFilesList.style.display = 'none';
    
            userHeader.addEventListener('click', function() {
                toggleSharedFiles(userFilesList, arrowIcon, userHeader, sharedUserName);
            });

            const searchTerm = document.getElementById('searchBar').value.toLowerCase();
            
            user.files.forEach(file => {
                if (file.toLowerCase().includes(searchTerm)) { // Check if the file matches the search term
                    const fileButton = document.createElement('button'); // Create button element
                    fileButton.textContent = file; // Set button text
                    fileButton.setAttribute('owner', user.user);
                    fileButton.classList.add('file-button'); // Add a class for styling
                    fileButton.addEventListener('click', function() { // Add click event listener
                        toggleFile(this);
                    });
                    const fileItem = document.createElement('li');
                    fileItem.appendChild(fileButton); // Append button to list item
                    userFilesList.appendChild(fileItem); // Append list item to file list
                }
            });
    
    
            userSection.appendChild(userHeader);
            userSection.appendChild(userFilesList);
            sharedWithMeDetails.appendChild(userSection);
        });
    }

    // Function to toggle the display of shared files
    function toggleSharedFiles(element, arrowIcon, userHeader, sharedUserName) {
        // Toggle the display of shared files list
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    
        // Toggle arrow icon
        if (arrowIcon.textContent == '\u25B6 '){
            userHeader.textContent = "";
            arrowIcon.textContent = '\u25BC '; // Unicode for down-pointing triangle
            userHeader.appendChild(arrowIcon);

            userHeader.textContent += sharedUserName;
        } else {
            userHeader.textContent = "";
            arrowIcon.textContent = '\u25B6 '; // Unicode for right-pointing triangle
            userHeader.appendChild(arrowIcon);

            userHeader.textContent += sharedUserName;
        
        }
    }


    // Function to toggle the display of individual file details
    function toggleFile(button) {

        const allButtons = document.querySelectorAll('.file-button');
        allButtons.forEach(btn => {
            if (btn !== button) {
                btn.style.background='#003366';
            }
        });

        if(button.style.background=='gray')
        {
            button.style.background='#003366';
        }
        else
        {
            button.style.background='gray';
        }
    }

    

    async function downloadFile(fileName, fileOwner)
    {
        var fileDownloaded = false;
        message.style.display = "none"; 
        document.getElementById('downloadLoader').style.display = 'block';
        const downloadFileRequest = 'DownloadFile$' + fileName + '$' + fileOwner;
        const downloadFilePayload = await window.client.sendToServerPayload(downloadFileRequest);
        socket.emit('ClientMessage', downloadFilePayload);

        const fileData = await assembleFileContent();
        
        document.getElementById('downloadLoader').style.display = 'none';
        
        if(fileData && !fileDownloaded)
        {
            fileDownloaded = true;
            
            try {
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
                        message.style.display = "block";
                        message.style.color = "green";
                        message.innerText = "File downloaded successfully!";
                    } else {
                        console.error('Failed to download file:', xhr.statusText);
                    }
                };
        
                xhr.onerror = function () {
                    console.error('Failed to download file:', xhr.statusText);
                };
        
                xhr.send();
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
                const serverPayload = await window.client.receivePayloadFromServer(fileBlockPayload);
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

    async function deleteFile(fileName, fileOwner)
    {
        message.style.display = "none"; 
        document.getElementById('downloadLoader').style.display = 'block';
        const deleteFileRequest = 'DeleteFile$' + fileName + '$' + fileOwner;
        const deleteFilePayload = await window.client.sendToServerPayload(deleteFileRequest);
        socket.emit('ClientMessage', deleteFilePayload);
        socket.on('deleteFileResult', async (deleteFileResult) => {
            if(deleteFileResult === 'Success')
            {
                files = await getUserOwnFilesListFromServer();

                sharedFiles = await getUserSharedFilesListFromServer();

                document.getElementById('downloadLoader').style.display = 'none';
                displayUserFiles();
                message.style.display = "block";
                message.style.color = "green";
                message.innerText = "File deleted successfully!";
            }
        });
    }

});



