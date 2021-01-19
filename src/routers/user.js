const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user.js'); //Video 101: Separate Route Files
const auth = require('../middleware/authentication.js');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account.js');
const router = new express.Router();

//Video 97: Integrating Async/Await - changing the format from promises to async
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    //In order to have users logged in once they create an account, we add a token to them as it's created.
    try {
        const token = await user.generateAuthToken();
        sendWelcomeEmail(user.email, user.name)
        await user.save();
        res.status(201).send({ user: user, token: token });
    } catch (error) {
        res.status(400).send(error);
    }
});

//Video 105: Logging in Users
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        //Video 107: Generating Authentication Tokens
        const token = await user.generateAuthToken();
        res.send({ user: user, token: token });
    } catch (error) {
        res.status(400).send();
    }
});

//Video 111: Logging Out
router.post('/users/logout', auth, async (req, res) => {
    try {
        //filter((token)) is the object that has a token property and the _id property
        //Filter to find the specific token we're logging out of.
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

//Log user out of all locations
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        //Set the tokens to an empty array to rid them all.
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) { 
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

//We shouldn't be able to get other users' profile so we're going to comment this section out.
// //https://mongoosejs.com/docs/queries.html
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id;

//     try {
//         const user = await User.findById(_id);

//         if (!user) {
//             return res.status(404).send();
//         }

//         res.send(user);
//     } catch (error) {
//         res.status(500).send();
//     }
// });

/*  Video 98: Resource Updating Endpoints Part 1
    - Setting up HTTP endpoints for updating resources
    - The .patch() method is designed for updating an existing resource.
    - Under await User.findByIdAndUpdate(), {
        - The first argument we'll pass is the user we're attempting to update using req.params.id
        - The second argument is the update we're trying to make by providing the object with the various fields we want to update. {
            - Unlike with the MongoDB native driver, there's no need to use anything like the $set operator. Mongoose handles that for us.
            - Instead of using a static name with { name: 'sample_name' }, we want to take the updates in as the request body with an HTTP request using req.body
        }
        - The third argument is an options object. Here we're going to set up a couple of options to get things working the way we want them. {
            - The first option is { new: true } which is going to return the new user as opposed to the existing one that was found before the update.\
            - The second option is runValidators: true to ensure that we run validation for the update so that if we tried to update the name to something nonexistent, it'll fail.
            -- Anytime we're allowing the user to write data to the database, we want to make sure we validate so it comes in the format we're expecting.
        }
        - A few things that could happen that we want to make sure we handle {
            - The update went well
            - The update went poorly
            - There was no user to update with that ID
        }
    }
    - To convert an object into an array of its properties, we use Object.keys() with the object we're trying to work with. In this case, Object.keys(req.body)
    - .every is an array method that takes a callback function as its one and only argument. This callback function gets called for every function in the array. {
        - If we always get true as the return value, then every will return true. If we get any false, then every will return false.
        - We could use the shorthand of updates.every((update) => allowedUpdates.includes(update)) since we're just returning something inside an arrow function. However, instead, I'm still going to use updates.every((update) => { return allowedUpdates.includes(update); }); to show a more explicit code of what's going on.
    }
    - Even though a user already wasn't able to update properties that didn't exist, the goal here is to give the user information with why things aren't going as expected.
    - In general, the routes for updating resources are the most complex as seen below compared to other express handlers that are done above.

    Video 113: Authenticating User Endpoints
    - Changed '/users/:id' to '/users/me' so that only the logged in user can update their account and not others, and added auth.
    - Changed all req.* to req.user since we changed the route to '/users/me'
*/
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }

    try {
        //Replace this line below to take advantage of middleware.
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        //The findByIdAndUpdate method bypasses Mongoose. It performs a direct operation on the database.
        // const user = await User.findById(req.params.id); //Video 113: No longer need this since we changed the route to '/users/me'
        updates.forEach((update) => {
            //Use bracket notation to access a property dynamically.
            req.user[update] = req.body[update];
        });
        //This is where our middleware is actually going to get executed
        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Video 100: Resource Deleting Endpoints
router.delete('/users/me', auth, async (req, res) => { //Changed '/users/:id' to '/users/me' so that only the logged in user can delete their account and not others.
    try {
        // const user = await User.findByIdAndDelete(req.user._id);

        // if (!user) {
        //     return res.status(404).send();
        // }
        //Video 113: await req.user.remove() will do the same thing as above.
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (error) {
        res.status(500).send();
    }
});

/*  Video 123-125: File uploads
    - Under multer, we can add limits beside dest. Limits is an object because there is multiple different limits we can set.
    - The fileSize will consider things in bytes. If it's megabytes, it will be 1 million as 1000000.
    - To reject or accept certain file types, we can add on fileFilter() which takes three arguments which is (req, file, callback).
    - Callback is usually abbreviate cb as the argument in fileFilter, but I'm going to use callback.
    - file.originalname.endsWith('.pdf')
    - callback(new Error("File must be a PDF"));
    - callback(undefined, true) //undefined if nothing went wrong and true if a file is going to be expected.
    - callback(undefined, false) //undefined is no error and false is to reject the upload.
    - regex101.com

    Video 126: Handling Express Errors
    - We've added an error handling function to the route to extract the error message and report just that and not a whole html file.

    Video 127: Adding Images to User Profiles
    - Added authentication to the avatar upload. Putting it before upload so they're authenticated before uploading.
    - By getting rid of dest: 'avatars' in multer, the upload.single() router will instead send it to the function instead of the folder.
    - req.file.buffer - .buffer contains a buffer of all of the binary data for that file.
    - To delete an image, set req.user.avatar = undefined;

    Video 129: Auto-Cropping and Image Formatting
    - In the post router for the avatars, we've added a buffer to contain and save the modified image file that we'll save to the database using the sharp npm.
    -- .toBuffer() converts it back to a buffer that we can access. 
    -- .png() converts the image to the png file format and does not take any arguments.
    -- .resize() will resize the image by giving it an object property.
*/
const upload = multer({ 
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error("Please upload a supported image file type."))
        }
        callback(undefined, true);
    }
});

//The argument in upload.single must match the KEY value in posting the request
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

//Delete the avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

//Video 128: Serving up Files
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }
        //.set takes two arguments. The name of the response header we're trying to set and the value we're trying to set on it.
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});


module.exports = router;