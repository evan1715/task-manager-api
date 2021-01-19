//Video 101: Separate Route Files
const express = require('express');
const Task = require('../models/task.js');
const auth = require('../middleware/authentication.js');
const router = new express.Router();


router.post('/tasks', auth, async (req, res) => {
    /*  Video 114: The User/Task Relationship
        - Commented out the original const task line because new one was made.
        - Instead of specifying request.body, we're going to provide our own object under the new task.
        - We're going to provide all of the stuff from req.body with the addition of an owner property.
        - Using the ES6 operator ... with req.body, it's going to copy all of the properties from body over to this object.
        - The owner is not something that should be specified via the request. There's no need to pass the owner ID along with the data you send as part of the request body as it is all from the authentication token. So, we'll hardcode it as owner: req.user._id
        - This adds the owner property to the task to create that association of the task to the user.
    */
    //const task = new Task(req.body);
    const task = new Task ({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Fetch all tasks
/*  Video 119: Filtering Data
    - find all tasks by leaving it empty with
        const tasks = await Task.find({});
    - Either one of this will do the same thing:
        const tasks = await Task.find({ owner: req.user._id });
        res.send(tasks);
        //or
        await req.user.populate('tasks').execPopulate();
        res.send(req.user.tasks);
    - If we want /tasks?completed=true, we modify await req.user.populate('tasks').execPopulate(); to accept path and match.
    -- Then add req.query.completed to do something with the query on the url
    - The url will be a string and what we want back is a boolean of what is true or false for completed.
    -- To do this, we'll set req.query.completed === 'true' to take in the 'true' string.

    Video 120: Pagination Data
    - Pagination is the idea of creating pages of data at a time so that we're not fetching everything at once.
    - Regardless if it's multiple pages, infinite scrolling, or load more button at the bottom, the back end is the same.
    - There's two options we're going to add for pagination. One is limit, the other is skip. GET /tasks?limit=10 and &skip=0
    - Limit limits the amount of results per page. If skip is set to 0, you get the first ten results. If skip is set to ten, you get the second set of ten results on another page.
    - To add the features, we can use options under populate. It can take limit, skip, and sort.
    - parseInt() is an integrated JS feature that allows us to parse a string number into an integer.
    - req.query.limit will use the input from the url and req.query.skip will input from url. 

    Video 121: Sorting Data
    - Example: GET /tasks?sortBy=createdAt_asc or _desc for ascending or descending. ?sortBy=(anything specified)
    - In the sort section, createdAt -1 would be descending and 1 would be ascending.
*/  
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        //Parenthesis isn't necessary, but it makes it easier to read and understand.
        match.completed = (req.query.completed === 'true');
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_');
        //Ternary operator used: condition ? expressionIfTrue : expressionIfFalse
        sort[parts[0]] = (parts[1] === 'desc' ? -1 : 1);
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit), // /tasks?limit=#
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send();
    }
});

//Fetch task by id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        //Video 115: Authenticating Task Endpoints - removed original task line and replaced.
        //const task = await Task.findById(_id);
        const task = await Task.findOne({ _id: _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        } else {
            res.send(task);
        }
    } catch (error) {
        res.status(500).send();
    }
});

//Video 99 : Resource Updating Endpoints Part 2
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" });
    }

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        //Video 115: Authenticating Task Endpoints - removed the task below to create another under it.
        //const task = await Task.findById(req.params.id);
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => {
            //Use bracket notation to access a property dynamically.
            task[update] = req.body[update];
        });
        await task.save();

        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Video 100: Resource Deleting Endpoints
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        //Video 115: Authenticating Task Endpoints - changed the task variable.
        //const task = await Task.findByIdAndDelete(req.params.id);
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;