const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();
const sendEmail = require('../modules/mailer');

const generate2FAToken = (userId) => {
    const payload = { userId };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });
};

router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, age, gender, email } = req.body;

    if (!username || !password || !firstName || !lastName || !age || !gender || !email) {
        req.session.errorMessage = 'All fields are required';
        return res.redirect('/register');
    }

    if (!Number.isInteger(Number(age)) || age < 18) {
        req.session.errorMessage = 'Age must be a valid number and at least 18';
        return res.redirect('/register');
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.session.errorMessage = 'User already exists';
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, firstName, lastName, age, gender, email });
        await newUser.save();

        const token = generate2FAToken(newUser._id);
        await sendEmail(newUser.email, 'Your 2FA Token', `Your 2FA token is: ${token}`);

        req.session.successMessage = 'Registration successful. Please check your email for a 2FA token.';
        return res.redirect('/verify');
    } catch (err) {
        console.error('Error during registration:', err);
        req.session.errorMessage = 'Registration failed';
        return res.redirect('/register');
    }
});

router.post('/verify', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            req.session.errorMessage = 'User not found';
            return res.redirect('/login');
        }

        req.session.user = user;
        res.redirect('/login');
    } catch (err) {
        req.session.errorMessage = 'Invalid or expired 2FA token';
        res.redirect('/verify');
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(400).send('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        req.session.user = user;

        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        return res.redirect('/portfolio');
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).send('Server error');
    }
});

module.exports = router;
