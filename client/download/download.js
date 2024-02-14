// Sample file data
var files = [
    { name: "File 1", sharedWith: ["User 1", "User 2"] },
    { name: "File 2", sharedWith: ["User 3", "User 4"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
    { name: "File 3", sharedWith: ["User 2", "User 5"] },
];

// Mock data for files shared with the user
const sharedFiles = [
    { user: 'User 1', files: ['File A', 'File B'] },
    { user: 'User 2', files: ['File C', 'File D'] },
    { user: 'User 3', files: ['File E', 'File F', 'File G'] },
    { user: 'User 3', files: ['File E', 'File F', 'File G'] },
    { user: 'User 3', files: ['File E', 'File F', 'File G'] },
    { user: 'User 3', files: ['File E', 'File F', 'File G'] },
    // Add more mock data as needed
];

// Function to populate file list
function populateFileList() {
    var fileListItems = document.getElementById("fileListItems");
    fileListItems.innerHTML = ""; // Clear existing list items

    files.forEach(function(file) {
        var listItem = document.createElement("li");
        var fileButton = document.createElement("button"); // Create button element
        fileButton.textContent = file.name; // Set button text
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
    const sharedFilesContainer = document.getElementById('sharedFilesList');
    sharedFilesContainer.innerHTML = ''; // Clear existing content

    sharedFiles.forEach(user => {
        const userItem = document.createElement('li');
        const userHeader = document.createElement('span');
        userHeader.textContent = `${user.user} (${user.files.length} files)`;
        // Add a click event listener to toggle the display of shared files
        userHeader.addEventListener('click', function() {
            toggleSharedFiles(this);
        });
        userItem.appendChild(userHeader);

        const userFiles = document.createElement('ul');
        user.files.forEach(file => {
            const fileButton = document.createElement('button'); // Create button element
            fileButton.textContent = file; // Set button text
            fileButton.classList.add('file-button'); // Add a class for styling
            fileButton.addEventListener('click', function() { // Add click event listener
                toggleFile(this);
            });
            const fileItem = document.createElement('li');
            fileItem.appendChild(fileButton); // Append button to list item
            userFiles.appendChild(fileItem); // Append list item to file list
        });

        // Initially hide the shared files list
        userFiles.style.display = 'none';
        userFiles.classList.add('shared-files');
        userItem.appendChild(userFiles);
        sharedFilesContainer.appendChild(userItem);
    });

    const sharedWithMeDetails = document.getElementById('sharedWithMeDetails');
    sharedWithMeDetails.innerHTML = ''; // Clear existing content

    sharedFiles.forEach(user => {
        const userSection = document.createElement('div');
        userSection.classList.add('shared-user-section');

        const userHeader = document.createElement('h3');
        userHeader.textContent = `${user.user} (${user.files.length} files)`;
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

    // const allButtons = document.querySelectorAll('.file-button');
    // allButtons.forEach(btn => {
    //     if (btn !== button) {
    //         btn.style.background='#003366';
    //     }
    // });

    if(button.style.background=='gray')
    {
        button.style.background='#003366';
    }
    else
    {
        button.style.background='gray';
    }
}

// Populate file list on page load
window.onload = function() {
    populateFileList();
    // Call the function to display shared files
    displaySharedFiles();
    
    // Add event listener to the download button
    document.getElementById('downloadButton').addEventListener('click', function() {
        // Gather selected files
        const selectedFiles = document.querySelectorAll('.file-selected');
        
        // Logic to handle download action with selected files
        // You can implement this according to your requirements
        // For example, you can create a download link for each selected file.
        selectedFiles.forEach(file => {
            // Logic to handle download for each selected file
            // For demonstration purpose, you can console log the file name
            console.log(file.textContent);
        });
    });
};