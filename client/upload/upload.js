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

    // Function to display the uploaded file
    function displayUploadedFile() {
        const fileInput = document.getElementById('fileUpload');
        const uploadedFileContainer = document.getElementById('uploadedFile');
        
        // Check if a file is selected
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            
            // Display the file name in the container
            uploadedFileContainer.innerHTML = `Uploaded File: ${fileName}`;
        } else {
            // If no file is selected, clear the container
            uploadedFileContainer.innerHTML = '';
        }
    }   
});