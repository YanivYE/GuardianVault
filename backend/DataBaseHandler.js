// Import required modules
const mongoose = require("mongoose");
const config = require("./config");
const bcrypt = require('bcrypt');

// Define schemas for User, File, and Permission
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const fileSchema = new mongoose.Schema({
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }
});

const permissionSchema = mongoose.Schema({
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'Files' },
    encryptionPassword: String,
    sharedUserNames: Array
});

// Create models based on schemas
const User = mongoose.model('Users', userSchema);
const File = mongoose.model('Files', fileSchema);
const Permission = mongoose.model('Permissions', permissionSchema);

// Define class for database handling
class DataBaseHandler {
    constructor() {
        this.connectToDB();
    }

    // Connect to MongoDB
    async connectToDB() {
        try {
            await mongoose.connect(config.DB_URI);
        } catch (error) {
            console.error("Error connecting to the database:", error);
        }
    }

    // Validate user login credentials
    async validateUserLogin(username, password) {
        try {
            const user = await User.findOne({ username });
            if (!user) return false;

            const passwordMatch = await bcrypt.compare(password, user.password);
            return passwordMatch;
        } catch (error) {
            console.error("Error validating user login:", error);
            return false;
        }
    }

    // Validate user signup details
    async validateUserSignup(username, email, password) {
        try {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                console.log("Username is already taken");
                return "UsernameFail";
            }

            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                console.log("Email is already taken");
                return "EmailFail";
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({ username, email, password: hashedPassword });
            
            return "Success";
        } catch (error) {
            console.error("Error validating user signup:", error);
            return "Fail";
        }
    }

    // Validate if file name is available for the user
    async validateFileName(fileName, connectedUserName) {
        try {
            const user = await User.findOne({ username: connectedUserName });
            const file = await File.findOne({ name: fileName, owner: user._id });
            if (file) return "Fail";

            await File.create({ name: fileName, owner: user._id });
            return "Success";
        } catch (error) {
            console.error("Error validating file name:", error);
            return "Fail";
        }
    }

    // Set permissions for users on a file
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

            await Permission.create({
                file: file._id,
                encryptionPassword: connectedUserPassword,
                sharedUserNames: sharedUsers
            });
        } catch (error) {
            console.error('Error setting users permissions:', error);
        }
    }

    // Delete a file owned by the user
    async deleteOwnFile(fileName, fileOwner) {
        try {
            const owner = await User.findOne({ username: fileOwner });
            if (!owner) {
                console.error('Owner not found.');
                return;
            }

            const file = await File.findOne({ name: fileName, owner: owner._id });
            if (!file) {
                console.error('File not found.');
                return;
            }

            const permission = await Permission.findOne({ file: file._id });

            await File.deleteOne({ _id: file._id });

            if(permission) {
                await Permission.deleteOne({ _id: permission._id });
            }

            console.log(`File '${fileName}' owned by '${fileOwner}' deleted successfully.`);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Delete a shared file owned by the user
    async deleteSharedFile(fileName, fileOwner) {
        try {
            const owner = await User.findOne({ username: fileOwner });
            if (!owner) {
                console.error('Owner not found.');
                return;
            }

            const file = await File.findOne({ name: fileName, owner: owner._id });
            if (!file) {
                console.error('File not found.');
                return;
            }

            const permission = await Permission.findOne({ file: file._id });
            if (!permission) {
                console.error('Permission not found.');
                return;
            }

            await Permission.deleteOne({ _id: permission._id });

            console.log(`File '${fileName}' owned by '${fileOwner}' deleted successfully.`);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    // Delete a user and associated files and permissions
    async deleteUser(username) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                console.error('User not found.');
                return;
            }

            const userFiles = await File.find({ owner: user._id });

            for (const file of userFiles) {
                await Permission.deleteOne({ file: file._id });
            }

            await File.deleteMany({ owner: user._id });
            await User.deleteOne({ _id: user._id });
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }

    // Get a list of all users
    async getUsersList() {
        try {
            const users = await User.find({}, 'username');
            const usersList = users.map(user => user.username);
            return usersList;
        } catch (error) {
            console.error("Error getting users list:", error);
            return [];
        }
    }

    // Get email of a user by username
    async getUserEmail(username) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                console.error('User not found.');
                return "Fail";
            }

            return user.email;
        } catch (error) {
            console.error('Error getting user email:', error);
            return "Fail";
        }
    }

    // Get encryption password of a file owned by a user
    async getFileEncryptionPassword(fileOwner, fileName) {
        try {
            const owner = await User.findOne({ username: fileOwner });
            if (!owner) {
                console.error('Owner not found.');
                return null;
            }

            const file = await File.findOne({ name: fileName, owner: owner._id });
            if (!file) {
                console.error('File not found.');
                return null;
            }

            const permission = await Permission.findOne({ file: file._id });
            if (!permission) {
                console.error('Permission not found.');
                return null;
            }

            return permission.encryptionPassword;
        } catch (error) {
            console.error('Error getting file encryption password:', error);
            return null;
        }
    }

    // Get list of files owned by a user
    async getUserFilesList(username) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                console.error('User not found.');
                return [];
            }

            const files = await File.find({ owner: user._id }, 'name');
            const fileList = files.map(file => file.name);
            return fileList;
        } catch (error) {
            console.error("Error getting user's files list:", error);
            return [];
        }
    }

    // Get list of files shared with a user
    async getUserSharedFilesList(username) {
        try {
            const permissions = await Permission.find({ sharedUserNames: username }).populate('file');

            const sharedFilesMap = new Map();

            if (permissions) {
                for (const permission of permissions) {
                    const owner = await User.findById(permission.file.owner, 'username');

                    if (owner && owner.username !== username) {
                        if (!sharedFilesMap.has(owner.username)) {
                            sharedFilesMap.set(owner.username, []);
                        }
                        sharedFilesMap.get(owner.username).push(permission.file.name);
                    }
                }

                const sharedFiles = Array.from(sharedFilesMap).map(([user, files]) => ({ user, files }));
                return sharedFiles;
            }
        } catch (error) {
            console.error("Error getting user's shared files list:", error);
            return [];
        }
    }

    // Update password of a user
    async updateUserPassword(username, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const updatedUser = await User.findOneAndUpdate(
                { username: username },
                { password: hashedPassword },
                { new: true }
            );

            if (!updatedUser) {
                console.error('User not found.');
                return false;
            }

            console.log(`Password updated for user '${username}'`);
            return true;
        } catch (error) {
            console.error('Error updating user password:', error);
            return false;
        }
    }

    // Delete all users from the database
    async deleteAllUsers() {
        try {
            const deleteResult = await User.deleteMany({});
            console.log(`${deleteResult.deletedCount} users deleted`);
        } catch (error) {
            console.error("Error deleting users:", error);
        }
    }

    // Delete all files from the database
    async deleteAllFiles() {
        try {
            const deleteResult = await File.deleteMany({});
            console.log(`${deleteResult.deletedCount} files deleted`);
        } catch (error) {
            console.error("Error deleting files:", error);
        }
    }

    // Delete all permissions from the database
    async deleteAllPermissions() {
        try {
            const deleteResult = await Permission.deleteMany({});
            console.log(`${deleteResult.deletedCount} permissions deleted`);
        } catch (error) {
            console.error("Error deleting permissions:", error);
        }
    }

    // Initialize the database by deleting all data
    async initDataBase() {
        this.deleteAllUsers();
        this.deleteAllFiles();
        this.deleteAllPermissions();
        console.log("Database initialized successfully");
    }
}

// Export the DataBaseHandler class
module.exports = { DataBaseHandler };
