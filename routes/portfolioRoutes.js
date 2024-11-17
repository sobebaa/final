const express = require('express');
const PortfolioItem = require('../models/portfolio');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const items = await PortfolioItem.find();
        const isAdmin = req.originalUrl.startsWith('/admin'); 

        if (isAdmin) {
            res.render('adminDashboard', { items });
        } else {
            res.render('portfolio', { items });
        }
    } catch (err) {
        console.error('Error fetching portfolio items:', err);
        res.status(500).send('Error fetching portfolio items');
    }
});

router.get('/admin/dashboard', async (req, res) => {
    try {
        const items = await PortfolioItem.find();
        res.render('adminDashboard', { items });
    } catch (err) {
        console.error('Error fetching portfolio items for admin:', err);
        res.status(500).send('Error fetching portfolio items');
    }
});

router.post('/admin/add', async (req, res) => {
    const { title, description, images } = req.body;
    try {
        await PortfolioItem.create({ title, description, images: images.split(',') });
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Error adding portfolio item:', err);
        res.status(500).send('Error adding portfolio item');
    }
});

router.post('/admin/update/:id', async (req, res) => {
    const { title, description, images } = req.body;
    try {
        await PortfolioItem.findByIdAndUpdate(req.params.id, {
            title,
            description,
            images: images.split(','),
            updatedAt: new Date(),
        });
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Error updating portfolio item:', err);
        res.status(500).send('Error updating portfolio item');
    }
});

router.post('/admin/delete/:id', async (req, res) => {
    try {
        await PortfolioItem.findByIdAndDelete(req.params.id);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Error deleting portfolio item:', err);
        res.status(500).send('Error deleting portfolio item');
    }
});

module.exports = router;
