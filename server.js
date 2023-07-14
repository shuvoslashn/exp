// import packages
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// initializations
const app = express();
const port = process.env.PORT || 8080;
const uri = process.env.MONGO_URI;

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect mongoose
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connection.on('connected', () => {
    console.log(`Mongoose Default Connection Open`);
});
mongoose.connection.on('error', (error) => {
    console.log(`Mongoose Default Connection Error!`);
});

// user schema
const userSchema = new mongoose.Schema(
    {
        fname: String,
        lname: String,
        age: Number,
        email: String,
        password: String,
    },
    { timestamps: true }
);

// user model
const User = mongoose.model('User', userSchema);

//! check connection endpoint
app.get('/', (req, res) => {
    res.send(`test connection`);
});

//! API to create a user
app.post('/users', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(15);
        const hash = await bcrypt.hash(req.body.password, salt);
        const userObj = {
            fname: req.body.fname,
            lname: req.body.lname,
            age: req.body.age,
            email: req.body.email,
            password: hash,
        };
        const user = new User(userObj);
        await user.save();
        res.json(user);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! API to login a user
app.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(404).json({ message: `User Not Found` });
        } else {
            const isValidPassword = await bcrypt.compare(
                password,
                user.password
            );
            if (!isValidPassword) {
                res.status(401).json({ message: `Wrong Password` });
            } else {
                const token = jwt.sign(
                    {
                        email: user.email,
                        id: user._id,
                    },
                    process.env.SECRET_KEY
                );
                const userObj = user.toJSON();
                userObj['accessToken'] = token;
                res.json(userObj);
            }
        }
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! API to get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! API to get a user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        res.json(user);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! API to Update a user by ID
app.put('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndUpdate(id, { new: true });
        if (user) {
            user.fname = req.body.fname;
            user.lname = req.body.lname;
            res.json(user);
        } else {
            res.status(404).json({ message: `User not found!` });
        }
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! API to Delete a user
app.delete('/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        res.json(user);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

// server listening
app.listen(port, () => {
    console.log(`server running at ${port}`);
});
