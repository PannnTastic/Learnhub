const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'learnhub'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + db.threadId);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'learnhub-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(flash());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global variables for templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error_msg', 'Please log in to access this page');
        res.redirect('/auth/login');
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (req.session.user && roles.includes(req.session.user.role)) {
            next();
        } else {
            req.flash('error_msg', 'Access denied');
            res.redirect('/');
        }
    };
};

// Routes
const authRoutes = require('./routes/auth')(db);
const adminRoutes = require('./routes/admin')(db);
const courseRoutes = require('./routes/courses')(db);
const studentRoutes = require('./routes/student')(db);
const instructorRoutes = require('./routes/instructor')(db);

// Make database and upload available to routes before setting up routes
app.locals.db = db;
app.locals.upload = upload;

app.use('/auth', authRoutes);
app.use('/admin', requireAuth, requireRole(['admin']), adminRoutes);
app.use('/courses', courseRoutes);
app.use('/student', requireAuth, requireRole(['student']), studentRoutes);
app.use('/instructor', requireAuth, requireRole(['instructor']), instructorRoutes);

// Home route
app.get('/', (req, res) => {
    const query = `
        SELECT c.*, u.first_name, u.last_name, cat.name as category_name,
               COUNT(e.id) as total_enrollments
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.status = 'published'
        GROUP BY c.id
        ORDER BY total_enrollments DESC, c.created_at DESC
        LIMIT 6
    `;
    
    db.query(query, (err, courses) => {
        if (err) {
            console.error(err);
            courses = [];
        }
        res.render('index', { courses });
    });
});

// Dashboard route
app.get('/dashboard', requireAuth, (req, res) => {
    const user = req.session.user;
    
    if (user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (user.role === 'instructor') {
        res.redirect('/instructor/dashboard');
    } else if (user.role === 'student') {
        res.redirect('/student/dashboard');
    } else {
        res.redirect('/');    }
});

// Make database and upload available to routes
app.locals.db = db;
app.locals.upload = upload;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
