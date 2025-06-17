const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

module.exports = (db) => {
    const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Register page
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// Handle login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please provide valid email and password');
        return res.redirect('/auth/login');
    }    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Database error');
            return res.redirect('/auth/login');
        }

        if (results.length === 0) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Store user in session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_image: user.profile_image
        };

        req.flash('success_msg', 'Login successful');
        res.redirect('/dashboard');
    });
});

// Handle register
router.post('/register', [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'instructor'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect('/auth/register');
    }    const { first_name, last_name, username, email, password, role, bio } = req.body;

    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Database error');
            return res.redirect('/auth/register');
        }

        if (results.length > 0) {
            req.flash('error_msg', 'User with this email or username already exists');
            return res.redirect('/auth/register');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertQuery = `
            INSERT INTO users (first_name, last_name, username, email, password, role, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [first_name, last_name, username, email, hashedPassword, role, bio || null], (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Error creating account');
                return res.redirect('/auth/register');
            }

            req.flash('success_msg', 'Account created successfully. Please login.');
            res.redirect('/auth/login');
        });
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});

return router;
};
