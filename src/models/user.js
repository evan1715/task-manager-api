const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task.js');

/*  - When we create a mongoose model, we're passing an object in as a the second argument to the model. That's the const User model in this case.
    -- Behind the scenes, Mongoose converts it into what's known as a schema in order to take advantage of middleware functionality.
    - mongoose.Schema() is going to use the argument to pass an object which defines all of the properties for that schema.
*/
    
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true, //This will ensure the email is unique per user and not reused.
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid.");
            }
        }
    },
    password: {
        type: 'String',
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Password cannot contain the word password.");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be a positive number.");
            }
        }
    },
    //Video 107: We're going to add tokens to the user as an array of objects in order to allow multiple logins across devices to the same user and saving them to the database.
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        //This is going to allow us to store the buffer with binary image data from the uploaded avatar in the database.
        type: Buffer
    }
    /*  Video 118: Working with Timestamps
        - In order to set up our timestamps, we provide a second argument to userSchema which is also an object
    */
}, {
    timestamps: true
});

/*  Video 114: The User/Task Relationship
    - .virtual is virtual because we're not actually changing what we store for the user document. It is just a way for Mongoose to figure out how these two things are related.
    -- It takes two arguments. The first is any name for the virtual field, the second is where we're going to configure the individual field.
    -- This is not stored in the DB. It is just for Mongoose to be able to figure out who owns what and how they're related.
    -- The foreignField is the name on the other thing, in this case on the task that's going to create this relationship, which we set up for it to be the 'owner'
    -- The localField is where the local data is stored. We have the owner objectID on the task that is associated with the _id of the user here.
*/
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

/*  Video 112: Hiding Private Data
    - To get an object with our raw user data attached which is going to remove all of the stuff Mongoose has on it to perform things like the save operation. We want back an object with just our user data. So, we'll use .toObject()
    - We'll use the delete operator to delete stuff off of that object such as password and tokens.
    - Using the .toJSON will allow us to use this function without actually calling it in the user routers.
    -- When we send res.send(), it's calling JSON.stringify() behind the scenes.
    -- .toJSON gets called whenever the object gets stringified.
    -- The benefit with this is now we can manipulate what exactly comes back when we stringify the object.
*/
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar; //decreases size of profile

    return userObject;
}

/*  Video 106: JSON Web Tokens JWT
    - The return value from jwt.sign() is the new token.
    - .sign() takes two arguments. The first is an object, the second is a string.
    -- The object contains the data that's going to be embedded in the token. In this case, it'll be a unique identifier for the user who's being authenticated. The user's ID works in this case. Other pieces of information could be provided if needed.
    -- The string is going to be secret which is going to be used to sign a token to ensure that it hasn't been tampered with or altered.
    - https://www.base64decode.org/ to decode tokens. It's the second section of the token, after the first period.
    - To verify a JWT, we can use jwt.verify(). The first argument is the token, the second is the secret to use.
    -- The verify part is in the auth.js file.
    -- It needs to be the same secret the token was created with.
    - To have the token expire, we can add a third argument as an object onto jwt.sign() to add options. To expire, it's expiresIn: ''
    -- ex: const token = jwt.sign({ _id: 'placeholder' }, 'thisismynewcourse', { expiresIn: '7 days' });
    
    Video 107: Generating Authentication Tokens
    - To create the generateAuthToken(), we must create a separate schema first then pass that into the model.
    - This'll be set up as a standard function since we're going to need to use the this binding.
    - .statics methods are accessible on the model, sometimes called model methods, and .methods is accessible on the instances, sometimes called instance methods.
    - Since _id is an object ID, we're going to use .toString() since JWT is expecting a string.
    - Adding user.tokens so the user can login from multiple sources and then saving the tokens to the database.
    -- In the DB, it'll have a subdocument that automatically generates an ID for them.
*/
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token: token });
    await user.save();

    return token;
}

/*  Video 105: Logging in Users
    - To create the findByCredentials() function, we must create a separate schema first then pass that into the model. */
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: email });

    if (!user) {
        throw new Error("Unable to login.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Unable to login.");
    }

    return user;
}

/*  Video 103: Securely Storing Passwords Part 1
    - With bcrypt.hash(), the first argument is the plain text password. 
    -- The second is the number of rounds we want to perform. 
    - Rounds are how many times the hashing algorithm is executed.
    -- If we use too few rounds, it makes it easier to hack. If we use too many, it takes too long and our application becomes useless. We'll use 8.
    - The hashed password is what we'll store in the database.
    - With using encrpytion algorithms, we can get the original password back.
    - When using hashing algorithms, we cannot get the original password back.
    - To see if the original password matches the hashed password, we use bcrypt.compre() which takes two arguments.
    -- The first is the plain text password. The second is the hashed password.
    -- It will come back as a boolean.
    - To set up the middleware, we're going to use a method on userSchema
    - .pre for doing something before an event, like before validation or before saving.
    - .post for doing something just after an event, such as after the user has been saved.
    - The first argument will be the name of the event. In this case, 'save'. 
    - The second is the function to run. This needs to be a standard function, not an arrow function because the 'this' binding plays an important role and arrow functions don't bind 'this'
    - The purpose of userSchema.pre() is to run some code before the user is saved. To tell it to know when we're done running our code, we include next() at the bottom.
    - The first thing we want to do is to make sure the password is actually being changed. If the password is already hashed, we don't want to hash it again.
*/
userSchema.pre('save', async function (next) {
    const user = this;
    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

/*  Video 116: Cascade Delete Tasks
    - To delete user tasks when a user deletes their account, this could be set up in two locations.
    - One being where the user deletes their account or in the middleware. Here, we're going to set it up in the middleware.
*/
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;