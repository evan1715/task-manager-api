const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    /*  Video 114: The User/Task Relationship
        - mongoose.Schema.Types.ObjectId is saying that the data stored and owner is going to be an ObjectId
        - Using ref (reference) to User, it'll connect with the user model.
    */
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);




module.exports = Task;