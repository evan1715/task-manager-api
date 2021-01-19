/*  Video 108: Express Middleware
    Without middleware: new request -> run route handler
    With middleware:    new request -> do something -> run route handler
    - When creating middleware throughout the app, it's best to define it in a separate file.
    - This 'something' is nothing more than a function that runs and we can set up this function to do whatever we want. Maybe log some statistics about the request so we can keep track of it in our server log or maybe check if there's a valid authentication token. Then we run the regular route handler or not, like if the user is not authenticated.
    - This needs to be located above our app.use() calls.
    - The 'next' argument is the thing that's specific to registering middleware. We must call next() in order for Express to know that we're done with the middleware function and that it should continue.
    - req.method will get us the method used such as get, put, post, etc.
    - req.path will give us the path
    - Status 503 is typically used for maintenance or unavailable.
    
    Video 109: Accepting Authentication Tokens
    - In routers/user.js, we've added authentication to router.get('/users')
    - The user login info will send an Authentication and a Bearer as a key-value pair as a Header. We need to access the Header information in order to login. So, to access the user's token, we'll use req.header('Authorization') to receive it.
    - To remove the Bearer  part of what we receive back, we'll use  .replace() which takes two arguments. The first is what we want to replace, the second is what we want to replace it with.
    - To make sure the token we received from the Header's Bearer is valid (that it isn't expired and was created by our server), we'll use jwt.verify()
    - We're going to give that route handler access to the user that we fetched from the DB with req.user = user; We've already fetched them, so there's no need for the route handlers to have to fetch the user again as that would waste resources and time.
    - So, this starts by looking for the header that the user is supposed to provide. It then validates that header. Then it finds the associated user. From there, either we call next() letting the route handler run or if they're not authenticated, we send back an error.
*/
// app.use((req, res, next) => {
//     if (req.method === 'GET') {
//         res.send("GET requests are disabled.");
//     } else {
//         next();
//     }
// });

const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: "Please authenticate." });;
    }

}

module.exports = auth;