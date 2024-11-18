require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();
const PORT = 3000;
const API_KEY = process.env.CAT_API_KEY;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'qwerty', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied');
}

app.use('/auth', authRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/admin', portfolioRoutes);
app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.render('server', { title: 'Welcome Page' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Registration', errorMessage: null });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', errorMessage: null });
});

app.get('/verify', (req, res) => {
    res.render('verify', { title: 'Verification', errorMessage: null });
});

app.get('/portfolio', isAuthenticated, (req, res) => {
    res.render('portfolio', { title: 'Portfolio', errorMessage: null });
});

app.get('/adminDashboard', (req, res) => {
    res.render('adminDashboard', { title: 'adminDashboard', errorMessage: null });
});

app.get('/catAPI', async (req, res) => {
    try {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search', {
            headers: { 'x-api-key': API_KEY }
        });
        const imageUrl = response.data[0].url;
        res.render('cat', { imageUrl });
    } catch (error) {
        console.error('Error fetching data from The Cat API', error);
        res.status(500).send('Error fetching data from The Cat API');
    }
});

app.get('/trivia', async (req, res) => {
    try {
        const response = await axios.get('https://the-trivia-api.com/api/questions');
        const triviaData = response.data;
        res.render('trivia', { triviaResults: triviaData });
    } catch (error) {
        console.error('Ошибка при получении данных викторины', error);
        res.status(500).send('Ошибка при получении данных викторины');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
