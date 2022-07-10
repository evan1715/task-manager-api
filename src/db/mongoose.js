const mongoose = require('mongoose');

/*  Video 83: Setting up Mongoose
    - With mongoose, we won't specify the database name separately. Instead, we'll add it at the end of the URL :27017/task-manager-api
    - useCreateIndex is going to ensure that when Mongoose works with MongoDB, our indexes are created allowing us to quickly access the data we need.
    - mongoose.model() accepts two arguments. The first is the string name for the model and the second is the definition where we define all of the fields we want.
    - .save() doesn't take any arguments, it simply saves the data that we've stored. This returns a promise.
    Video 85: Data Validation and Sanitization: Part 1
    - Can use required: true to make a section required.
    - https://mongoosejs.com/docs/validation.html 
    - throw lets us create custom errors
    - validate(value) allows us to throw an error under custom conditions
    - npm i validator
    -- use npm modules for more generic or common things in order to help focus on coding the app itself
    - https://mongoosejs.com/docs/schematypes.html 
    -- this includes date, lowercase, uppercase, min, max, trim (to rid spaces), etc.
*/

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    /* To prevent deprecation warning of :
    (node:18748) DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. 
    See: https://mongoosejs.com/docs/deprecations.html#findandmodify 
    We're going to use useFindAndModify: false */
    // useFindAndModify: false,
    /* To prevent deprecation warning of:
    (node:6748) DeprecationWarning: current Server Discovery and Monitoring engine is deprecated, and will be removed in a future version. 
    To use the new Server Discover and Monitoring engine, pass option { useUnifiedTopology: true } to the MongoClient constructor.
    We're going to use useUnifiedTopology: true */
    useUnifiedTopology: true
});

// const Task = mongoose.model('Task', {
//     description: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     completed: {
//         type: Boolean,
//         default: false
//     }
// });








/*
const User = mongoose.model('User', {
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
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
    }
});

const me = new User({
    name: '  Andrew   ',
    email: 'MYEMAIL@MEAD.IO    ',
    password: 'phone098!'
});

me.save().then(() => {
    console.log(me);
}).catch((error) => {
    console.log("Error!", error);
});
*/