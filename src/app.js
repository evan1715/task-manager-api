const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./routers/user.js');
const taskRouter = require('./routers/task.js');

const app = express();
// const port = process.env.PORT;

//Maintenance message
// app.use((req, res, next) => {
//     res.status(503).send("Site is currently down. Check back soon.");
// });

//This configures Express to automatically configure the incoming JSON for us so that we have it accessible as an object we can use in our request handlers by using req.body
app.use(express.json());
app.use(userRouter); //Video 101: Separate Route files
app.use(taskRouter);

module.exports = app;