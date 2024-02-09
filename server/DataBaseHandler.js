const mongoose = require("mongoose");
const config = require("./config");


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

    async validateUserLogin(username, password)
    {
        const user = await User.findOne({ username, password });
        if (user) {
            console.log("user found");
            return true;
        }
        else {
            console.log("User does not exist");
            return false; // User not found or password incorrect
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