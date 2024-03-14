const { v4: uuidv4 } = require('uuid');

function generateUniqueUserId() 
{
    return uuidv4();
}

async function initializeUsersEmailsMap(DBHandler, usersArray)
{
    let map = new Map();
    for(const user of usersArray)
    {
        if(user !== '')
        {
            const userEmail = await DBHandler.getUserEmail(user);

            map.set(user, userEmail);
        }
    }

    return map;
}  

function generateVerificationCode()
{
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return code;
}
  

module.exports = {generateUniqueUserId, initializeUsersEmailsMap, generateVerificationCode}