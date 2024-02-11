const mongoose = require("mongoose");
const config = require("./config");
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


class DataBaseHandler{
    constructor()
    {
        this.connectToDB();
    }

    async connectToDB()
    {
        try{
            await mongoose.connect(config.DB_URI);
            console.log("Connected to MongoDB");
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
            return "Success"; // fileName is valid
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


    async deleteAllUsers() {
        try {
            // Delete all user documents from the Users collection
            const deleteResult = await User.deleteMany({});
            console.log(`${deleteResult.deletedCount} users deleted`);
        } catch (error) {
            console.error("Error deleting users:", error);
        }
    }
}

module.exports = {DataBaseHandler};