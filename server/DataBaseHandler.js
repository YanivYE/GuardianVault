const mongoose = require("mongoose");
const config = require("./Config");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('Users', userSchema);

const fileSchema = new mongoose.Schema({
    name: String,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'Users'}
});

const File = mongoose.model('Files', fileSchema);

const permissionSchema = mongoose.Schema({
    file: {type: mongoose.Schema.Types.ObjectId, ref: 'Files'},
    encryptionPassword: String,
    sharedUserNames: Array
});

const Permission = mongoose.model('Permissions', permissionSchema);

class DataBaseHandler{
    constructor()
    {
        this.connectToDB();
    }

    async connectToDB()
    {
        try{
            await mongoose.connect(config.DB_URI);
        } catch(error)
        {
            console.error(error);
        }
    }

    async validateUserLogin(username, password) {
        const user = await User.findOne({ username });
    
        // If user exists
        if (user) {    
            // Compare the hashed password from the database with the hashed version of the input password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log("User found and password is correct");
                return true;
            } else {
                console.log("Password incorrect");
                return false;
            }
        } else {
            console.log("User not found");
            return false;
        }
    }

    async validateUserSignup(username, email, password)
    {
        // Check if the username is already taken
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            // Username is already taken
            console.log("Username is already taken");
            return "UsernameFail";
        }

        // Check if the email is already taken
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            // Email is already taken
            console.log("Email is already taken");
            return "EmailFail";
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with the hashed password
        await User.create({ username, email, password: hashedPassword });

        // If both username and email are available, return true to indicate successful validation
        return "Success";
    }

    async validateFileName(fileName, connectedUserName)
    {
        const user = await User.findOne({ username: connectedUserName });

        // Find a file with the given name and owned by the user's ObjectId
        const file = await File.findOne({
            name: fileName,
            owner: user._id // Pass the ObjectId of the user
        });

        // If a file is found, it means the fileName is already taken by the connected user
        if (file) {
            return "Fail"; // fileName is not valid
        } else {
            await File.create({
                name: fileName,
                owner: user._id
            });
            return "Success"; 
        }
    }

    async setUsersPermissions(sharedUsers, fileName, connectedUserName, connectedUserPassword) {
        try {
            const user = await User.findOne({ username: connectedUserName });
    
            if (!user) {
                console.error('User not found.');
                return;
            }
    
            const file = await File.findOne({ name: fileName, owner: user._id });
    
            if (!file) {
                console.error('File not found.');
                return;
            }
    
            // Create a new permission entry directly using create()
            await Permission.create({
                file: file._id,
                encryptionPassword: connectedUserPassword,
                sharedUserNames: sharedUsers
            });    
        } catch (error) {
            console.error('Error occurred while setting users permissions:', error);
        }
    }

    async getUsersList()
    {
        try {
            // Retrieve all users from the Users collection
            const users = await User.find({}, 'username');
            // Extract usernames from the retrieved users
            const usersList = users.map(user => user.username);
            return usersList;
        } catch (error) {
            console.error("Error getting users list:", error);
            return [];
        }
    }

    async getFileEncryptionPassword(fileOwner, fileName)
    {
        try {
            // Find the user document corresponding to the specified file owner's name
            const owner = await User.findOne({ username: fileOwner });
            if (!owner) {
                console.error('Owner not found.');
                return null;
            }
    
            // Find the file document corresponding to the specified file name and owner's ObjectId
            const file = await File.findOne({ name: fileName, owner: owner._id });
            if (!file) {
                console.error('File not found.');
                return null;
            }
    
            // Find the permission document corresponding to the found file document
            const permission = await Permission.findOne({ file: file._id });
            if (!permission) {
                console.error('Permission not found.');
                return null;
            }
    
            // Return the encryption password from the permission document
            return permission.encryptionPassword;
        } catch (error) {
            console.error('Error getting file encryption password:', error);
            return null;
        }
    }

    async getUserFilesList(username)
    {
        try {
            // Find the user by username
            const user = await User.findOne({ username });
            if (!user) {
                console.error('User not found.');
                return [];
            }
    
            // Find all files owned by the user
            const files = await File.find({ owner: user._id }, 'name');
            // Extract file names from the retrieved files
            const fileList = files.map(file => file.name);
            return fileList;
        } catch (error) {
            console.error("Error getting user's files list:", error);
            return [];
        }
    }

    async getUserSharedFilesList(username)
    {
        try {
            // Find permissions where the specified username is listed as a shared user
            const permissions = await Permission.find({ sharedUserNames: username }).populate('file');
    
            // Map to store shared files organized by owners
            const sharedFilesMap = new Map();
    
            // Iterate through each permission
            for (const permission of permissions) {
                // Get the owner's username
                const owner = await User.findById(permission.file.owner, 'username');
    
                // If the owner exists and is not the same as the user requesting the shared files
                if (owner && owner.username !== username) {
                    // Add the file to the map under the owner's username
                    if (!sharedFilesMap.has(owner.username)) {
                        sharedFilesMap.set(owner.username, []);
                    }
                    sharedFilesMap.get(owner.username).push(permission.file.name);
                }
            }
    
            // Convert the map to the desired output format
            const sharedFiles = Array.from(sharedFilesMap).map(([user, files]) => ({ user, files }));
    
            return sharedFiles;
        } catch (error) {
            console.error("Error getting user's shared files list:", error);
            return [];
        }
    }

    async deleteAllUsers() {
        try {
            // Delete all user documents from the Users collection
            const deleteResult = await User.deleteMany({});
            console.log(`${deleteResult.deletedCount} users deleted`);
        } catch (error) {
            console.error("Error deleting users:", error);
        }
    }

    async deleteAllFiles() {
        try {
            // Delete all file documents from the Files collection
            const deleteResult = await File.deleteMany({});
            console.log(`${deleteResult.deletedCount} files deleted`);
        } catch (error) {
            console.error("Error deleting files:", error);
        }
    }
    
    async deleteAllPermissions() {
        try {
            // Delete all permission documents from the Permissions collection
            const deleteResult = await Permission.deleteMany({});
            console.log(`${deleteResult.deletedCount} permissions deleted`);
        } catch (error) {
            console.error("Error deleting permissions:", error);
        }
    }

    async initDataBase()
    {
        this.deleteAllUsers();
        this.deleteAllFiles();
        this.deleteAllPermissions();
        console.log("DB initialized Successfully");
    }   
}

module.exports = {DataBaseHandler};