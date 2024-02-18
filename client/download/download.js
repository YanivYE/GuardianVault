const socket = io({
    query: {
      newUser: false
    }
  });


document.addEventListener('DOMContentLoaded', async function () {
    var files = await getUserOwnFilesListFromServer();

    const sharedFiles = await getUserSharedFilesListFromServer();

    populateFileList();
    // Call the function to display shared files
    displaySharedFiles();

    // Get the elements
    const downloadTitle = document.getElementById('downloadTitle');
    const downloadContainer = document.getElementById('downloadContainer');
    
    // Function to adjust the position of the title based on the container's size
    function adjustTitlePosition() {
        const containerHeight = downloadContainer.clientHeight - 580;
        downloadTitle.style.top = `${containerHeight}px`;
    }
    
    // Call the function initially and on window resize
    adjustTitlePosition();
    window.addEventListener('resize', adjustTitlePosition);
    
    document.getElementById("downloadForm").addEventListener('submit', async function(event) {
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



    async function getUserOwnFilesListFromServer() {
        try {
            const ownFileListPayload = await sendToServerPayload('ownFileList$');
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
            const sharedFileListPayload = await sendToServerPayload('sharedFileList$');
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
    function populateFileList() {
        var fileListItems = document.getElementById("fileListItems");
        fileListItems.innerHTML = ""; // Clear existing list items

        files.forEach(function(file) {
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
    function displaySharedFiles() {
        const sharedWithMeDetails = document.getElementById('sharedFilesList');
        sharedWithMeDetails.innerHTML = ''; // Clear existing content

        sharedFiles.forEach(user => {
            const userSection = document.createElement('div');
            userSection.classList.add('shared-user-section');

            const userHeader = document.createElement('h3');
            const filesAmount = user.files.length;
            userHeader.textContent = `${user.user} (${filesAmount} ${filesAmount === 1 ? 'file' : 'files'})`;
            userHeader.classList.add('shared-user-header');
            userHeader.addEventListener('click', function() {
                toggleSharedFiles(this);
            });

            const userFilesList = document.createElement('ul');
            userFilesList.classList.add('shared-user-files');
            userFilesList.style.display = 'none';

            user.files.forEach(file => {
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
            });

            userSection.appendChild(userHeader);
            userSection.appendChild(userFilesList);
            sharedWithMeDetails.appendChild(userSection);
        });
    }


    // Function to toggle the display of shared files
    function toggleSharedFiles(element) {
        // Toggle the display of shared files list
        const sharedFilesList = element.nextElementSibling;
        sharedFilesList.style.display = sharedFilesList.style.display === 'none' ? 'block' : 'none';
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
        const downloadFilePayload = await sendToServerPayload(downloadFileRequest);
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
                const serverPayload = await receivePayloadFromServer(fileBlockPayload);
                const [blockIndex, block, totalBlocksStr] = serverPayload.split('$');

                console.log(blockIndex);

                const currentBlockIndex = parseInt(blockIndex);
                const currentTotalBlocks = parseInt(totalBlocksStr);
    
                if (totalBlocks === -1) {
                    totalBlocks = currentTotalBlocks;
                }
    
                if (currentBlockIndex === receivedBlocks) {
                    fileData += block;
                    receivedBlocks++;
    
                    // Emit upload result for each block
                    socket.emit('uploadBlockResult', 'Success');
    
                    // If this is the last block, resolve with the full file data
                    if (receivedBlocks === totalBlocks) {
                        resolve(fileData);
                    }
                } 
            });
        });
    }

});



