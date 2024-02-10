document.addEventListener('DOMContentLoaded', function () {
    var publicRadio = document.getElementById("public");
    var shareWithGroup = document.getElementById("shareWithGroup");

    // Hide the shareWith field initially
    shareWithGroup.style.display = "none";

    // Add event listener to publicRadio
    publicRadio.addEventListener("change", function() {
        if (this.checked) {
            if (this.value === "public") {
                // Show the shareWith field if public option is selected
                shareWithGroup.style.display = "block";
            } else {
                // Hide the shareWith field if private option is selected
                shareWithGroup.style.display = "none";
            }
        }
    });

    // Additional event listener for the "Private" radio button to hide the share-with field
    var privateRadio = document.getElementById("private");
    privateRadio.addEventListener("change", function() {
        if (this.checked) {
            shareWithGroup.style.display = "none";
        }
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
            uploadedFileContainer.innerText = 'Drag and drop files here or click to select';
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
});
