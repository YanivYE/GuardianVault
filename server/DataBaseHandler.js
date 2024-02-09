const mongoose = require("mongoose");
const config = require("./config");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model('Users', userSchema);

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
            // Hash the input password
            const hashedPassword = await bcrypt.hash(password, 10);
    
            // Compare the hashed password from the database with the hashed version of the input password
            const passwordMatch = await bcrypt.compare(hashedPassword, user.passwordHash);
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

    async getAllUsers() {
        try {
            // Find all user documents in the User collection
            const users = await User.find();

            // Print each user's username
            users.forEach(user => {
                console.log("Username:", user.username);
            });
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }
}

module.exports = {DataBaseHandler};