const socket = io({
    query: {
      newUser: false
    }
  });

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
        listItem.textContent = file.name;
        listItem.onclick = function() {
            showFileDetails(file);
        };
        fileListItems.appendChild(listItem);
    });
}

// Function to display file details
function showFileDetails(file) {
    var fileDetailsElement = document.getElementById("fileDetails");
    fileDetailsElement.innerHTML = "<h2>" + file.name + "</h2>";

    // Display shared with information
    var sharedWithList = "<p>Shared with:</p><ul>";
    file.sharedWith.forEach(function(user) {
        sharedWithList += "<li>" + user + "</li>";
    });
    sharedWithList += "</ul>";
    fileDetailsElement.innerHTML += sharedWithList;

    // Show file details element
    fileDetailsElement.style.display = "block";
}

// Function to display shared files
function displaySharedFiles() {
    const sharedFilesContainer = document.getElementById('sharedWithMeDetails');
    sharedFilesContainer.innerHTML = '<h2>Files Shared with You</h2><ul>';

    sharedFiles.forEach(user => {
        sharedFilesContainer.innerHTML += `<li><strong>${user.user}:</strong><ul>`;
        user.files.forEach(file => {
            sharedFilesContainer.innerHTML += `<li>${file}</li>`;
        });
        sharedFilesContainer.innerHTML += `</ul></li>`;
    });

    sharedFilesContainer.innerHTML += '</ul>';
}

// Populate file list on page load
window.onload = function() {
    populateFileList();
    // Call the function to display shared files
displaySharedFiles();
};
