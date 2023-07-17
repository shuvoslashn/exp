const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('./../../models/User');
const authenticateToken = require('./../../middleware/auth');
const router = express.Router();

//* API to create a user
router.post(
    '/',
    [
        body('fname', 'fname is required').notEmpty(),
        body('lname', 'lname is required').notEmpty(),
        body('email', 'please enter a valid email').notEmpty().isEmail(),
        body('age', 'age is required').notEmpty().isNumeric(),
        body(
            'password',
            'Please enter a password with 6 or more characters'
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: errors });
            }
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
    }
);

//* API to login a user
router.post('/login', async (req, res) => {
    try {
        const { email, password, type, refreshToken } = req.body;
        if (!type) {
            res.status(401).json({ message: 'type is not defined' });
        } else {
            if (type == 'email') {
                await handleEmailLogin(email, res, password);
            } else {
                handleRefreshLogin(refreshToken, res);
            }
        }
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//* Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: `User not found!` });
        }
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//* API to get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//* API to get a user by ID
router.get('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        res.json(user);
    } catch (error) {
        console.log(error);
        res.json({ message: `Internal Server Error!` });
    }
});

//! login functions starts ----------------x-------------------
function handleRefreshLogin(refreshToken, res) {
    if (!refreshToken) {
        res.status(401).json({
            message: `refreshToken is not defined`,
        });
    } else {
        jwt.verify(
            refreshToken,
            process.env.SECRET_KEY,
            async (err, payload) => {
                if (err) {
                    res.status(401).json({
                        message: `Unauthorized`,
                    });
                } else {
                    const id = payload.id;
                    const user = await User.findById(id);
                    if (!user) {
                        res.status(401).json({
                            message: `Unauthorized`,
                        });
                    } else {
                        getUserToken(user, res);
                    }
                }
            }
        );
    }
}

async function handleEmailLogin(email, res, password) {
    const user = await User.findOne({ email: email });
    if (!user) {
        res.status(404).json({ message: `User Not Found` });
    } else {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: `Wrong Password` });
        } else {
            getUserToken(user, res);
        }
    }
}

function getUserToken(user, res) {
    const accessToken = jwt.sign(
        {
            email: user.email,
            id: user._id,
        },
        process.env.SECRET_KEY,
        { expiresIn: '2 days' }
    );
    const refreshToken = jwt.sign(
        {
            email: user.email,
            id: user._id,
        },
        process.env.SECRET_KEY,
        { expiresIn: '30 days' }
    );
    const userObj = user.toJSON();
    userObj['accessToken'] = accessToken;
    userObj['refreshToken'] = refreshToken;
    res.json(userObj);
}
// login functions ends -----------------------------------

module.exports = router;
