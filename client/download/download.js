// Function to create a file button element
function createFileButton(fileName, fileData) {
    const button = document.createElement('button');
    button.classList.add('fileButton');
    button.textContent = fileName;
    button.dataset.file = fileData;
    return button;
}

// Function to add files to a list
function addFilesToList(files, listId) {
    console.log(listId);
    const list = document.getElementById(listId);
    files.forEach(file => {
        const li = document.createElement('li');
        const button = createFileButton(file.name, file.data);
        // Add click event listener to handle single selection
        button.addEventListener('click', () => {
            const buttons = document.querySelectorAll('.fileButton');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            updateSelectedFiles();
        });
        li.appendChild(button);
        list.appendChild(li);
    });
}

// Function to update the selected files array
function updateSelectedFiles() {
    const buttons = document.querySelectorAll('.fileButton');
    selectedFiles = [];
    buttons.forEach(button => {
        if (button.classList.contains('active')) {
            selectedFiles.push(button.dataset.file);
        }
    });
}


// Sample data for demonstration
const yourFiles = [
    { name: 'File 1', data: 'file1' },
    { name: 'File 2', data: 'file2' },
    { name: 'File 3', data: 'file3' },
    { name: 'File 3', data: 'file3' },
    { name: 'File 3', data: 'file3' },
    { name: 'File 3', data: 'file3' },
    { name: 'File 3', data: 'file3' }
];

const sharedWithYou = [
    { name: 'Shared File 1', data: 'sharedFile1' },
    { name: 'Shared File 2', data: 'sharedFile2' },
    { name: 'Shared File 3', data: 'sharedFile3' },
    { name: 'Shared File 3', data: 'sharedFile3' },
    { name: 'Shared File 3', data: 'sharedFile3' },
    { name: 'Shared File 3', data: 'sharedFile3' },
    { name: 'Shared File 3', data: 'sharedFile3' }
];

// Variable to store the selected files
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Add files to the respective lists
    addFilesToList(yourFiles, "yourFilesSide");
    addFilesToList(sharedWithYou, 'sharedWithYou');
});

// Function to handle the download button click
document.getElementById('downloadButton').addEventListener('click', () => {
    // Perform download logic using the selectedFiles array
    console.log('Selected files:', selectedFiles);
});