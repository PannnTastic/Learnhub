const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

module.exports = (db) => {
    const router = express.Router();

// Admin Dashboard
router.get('/dashboard', (req, res) => {
    
    // Get statistics
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        totalCourses: 'SELECT COUNT(*) as count FROM courses',
        totalEnrollments: 'SELECT COUNT(*) as count FROM enrollments',
        totalCategories: 'SELECT COUNT(*) as count FROM categories'
    };

    Promise.all([
        new Promise((resolve) => db.query(queries.totalUsers, (err, result) => resolve(result[0]?.count || 0))),
        new Promise((resolve) => db.query(queries.totalCourses, (err, result) => resolve(result[0]?.count || 0))),
        new Promise((resolve) => db.query(queries.totalEnrollments, (err, result) => resolve(result[0]?.count || 0))),
        new Promise((resolve) => db.query(queries.totalCategories, (err, result) => resolve(result[0]?.count || 0)))
    ]).then(([totalUsers, totalCourses, totalEnrollments, totalCategories]) => {
        res.render('admin/dashboard', { 
            totalUsers, 
            totalCourses, 
            totalEnrollments, 
            totalCategories 
        });
    });
});

// Users Management
router.get('/users', (req, res) => {
    const query = `
        SELECT id, username, email, role, first_name, last_name, created_at
        FROM users 
        ORDER BY created_at DESC
    `;
    
    db.query(query, (err, users) => {
        if (err) {
            console.error(err);
            users = [];
        }
        res.render('admin/users', { users });
    });
});

// Add User Form
router.get('/users/add', (req, res) => {
    res.render('admin/add-user');
});

// Handle Add User
router.post('/users/add', [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'instructor', 'admin'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect('/admin/users/add');
    }

    const { first_name, last_name, username, email, password, role, bio } = req.body;
    

    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Database error');
            return res.redirect('/admin/users/add');
        }

        if (results.length > 0) {
            req.flash('error_msg', 'User with this email or username already exists');
            return res.redirect('/admin/users/add');
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
                req.flash('error_msg', 'Error creating user');
                return res.redirect('/admin/users/add');
            }

            req.flash('success_msg', 'User created successfully');
            res.redirect('/admin/users');
        });
    });
});

// Edit User Form
router.get('/users/edit/:id', (req, res) => {
    
    const userId = req.params.id;
    
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/admin/users');
        }
        
        res.render('admin/edit-user', { user: results[0] });
    });
});

// Handle Edit User
router.post('/users/edit/:id', [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['student', 'instructor', 'admin'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect(`/admin/users/edit/${req.params.id}`);
    }

    const { first_name, last_name, username, email, role, bio } = req.body;
    const userId = req.params.id;
    

    const updateQuery = `
        UPDATE users 
        SET first_name = ?, last_name = ?, username = ?, email = ?, role = ?, bio = ?
        WHERE id = ?
    `;

    db.query(updateQuery, [first_name, last_name, username, email, role, bio || null, userId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating user');
            return res.redirect(`/admin/users/edit/${userId}`);
        }

        req.flash('success_msg', 'User updated successfully');
        res.redirect('/admin/users');
    });
});

// Delete User
router.post('/users/delete/:id', (req, res) => {
    const userId = req.params.id;
    
    
    // Don't allow deletion of current admin user
    if (parseInt(userId) === req.session.user.id) {
        req.flash('error_msg', 'You cannot delete your own account');
        return res.redirect('/admin/users');
    }
    
    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error deleting user');
        } else {
            req.flash('success_msg', 'User deleted successfully');
        }
        res.redirect('/admin/users');
    });
});

// Courses Management
router.get('/courses', (req, res) => {
    
    const query = `
        SELECT c.*, u.first_name, u.last_name, cat.name as category_name,
               COUNT(e.id) as total_enrollments
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, (err, courses) => {
        if (err) {
            console.error(err);
            courses = [];
        }
        res.render('admin/courses', { courses });
    });
});

// Add Course Form (Admin)
router.get('/courses/add', (req, res) => {
    const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
    const instructorsQuery = 'SELECT id, first_name, last_name, username FROM users WHERE role = "instructor" ORDER BY first_name';
    
    db.query(categoriesQuery, (err, categories) => {
        if (err) categories = [];
        
        db.query(instructorsQuery, (err, instructors) => {
            if (err) instructors = [];
            
            res.render('admin/add-course', { 
                categories,
                instructors
            });
        });
    });
});

// Handle Add Course (Admin)
router.post('/courses/add', upload.single('thumbnail'), [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category_id').isInt({ min: 1 }),
    body('instructor_id').isInt({ min: 1 }),
    body('level').isIn(['beginner', 'intermediate', 'advanced']),
    body('price').isFloat({ min: 0 }),
    body('status').isIn(['draft', 'published', 'archived'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect('/admin/courses/add');
    }

    const { title, description, category_id, instructor_id, level, price, status, requirements, objectives, duration } = req.body;
    
    // Handle thumbnail upload
    let thumbnail = null;
    if (req.file) {
        thumbnail = req.file.filename;
    }

    const insertQuery = `
        INSERT INTO courses (title, description, category_id, instructor_id, level, price, status, requirements, objectives, duration, thumbnail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [title, description, category_id, instructor_id, level, price, status, requirements, objectives, duration, thumbnail], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error creating course');
            return res.redirect('/admin/courses/add');
        }

        req.flash('success_msg', 'Course created successfully');
        res.redirect('/admin/courses');
    });
});

// Edit Course Form (Admin)
router.get('/courses/edit/:id', (req, res) => {
    const courseId = req.params.id;
    
    const courseQuery = `
        SELECT c.*, u.first_name, u.last_name, u.username, cat.name as category_name
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        WHERE c.id = ?
    `;
    const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
    const instructorsQuery = 'SELECT id, first_name, last_name, username FROM users WHERE role = "instructor" ORDER BY first_name';
    
    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err || courseResults.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/admin/courses');
        }
        
        db.query(categoriesQuery, (err, categories) => {
            if (err) categories = [];
            
            db.query(instructorsQuery, (err, instructors) => {
                if (err) instructors = [];
                
                res.render('admin/edit-course', { 
                    course: courseResults[0], 
                    categories,
                    instructors
                });
            });
        });
    });
});

// Handle Edit Course (Admin)
router.post('/courses/edit/:id', upload.single('thumbnail'), [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category_id').isInt({ min: 1 }),
    body('instructor_id').isInt({ min: 1 }),
    body('level').isIn(['beginner', 'intermediate', 'advanced']),
    body('price').isFloat({ min: 0 }),
    body('status').isIn(['draft', 'published', 'archived'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect(`/admin/courses/edit/${req.params.id}`);
    }    const { title, description, category_id, instructor_id, level, price, status, requirements, objectives } = req.body;
    const courseId = req.params.id;
    
    // Handle thumbnail upload
    let thumbnail = null;
    if (req.file) {
        thumbnail = req.file.filename;
    }

    let updateQuery, updateParams;
    
    if (thumbnail) {
        updateQuery = `
            UPDATE courses 
            SET title = ?, description = ?, category_id = ?, instructor_id = ?, level = ?, price = ?, status = ?, requirements = ?, objectives = ?, thumbnail = ?
            WHERE id = ?
        `;
        updateParams = [title, description, category_id, instructor_id, level, price, status, requirements, objectives, thumbnail, courseId];
    } else {
        updateQuery = `
            UPDATE courses 
            SET title = ?, description = ?, category_id = ?, instructor_id = ?, level = ?, price = ?, status = ?, requirements = ?, objectives = ?
            WHERE id = ?
        `;
        updateParams = [title, description, category_id, instructor_id, level, price, status, requirements, objectives, courseId];
    }

    db.query(updateQuery, updateParams, (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating course');
            return res.redirect(`/admin/courses/edit/${courseId}`);
        }

        req.flash('success_msg', 'Course updated successfully');
        res.redirect('/admin/courses');
    });
});

// Delete Course
router.post('/courses/delete/:id', (req, res) => {
    const courseId = req.params.id;
    
    
    db.query('DELETE FROM courses WHERE id = ?', [courseId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error deleting course');
        } else {
            req.flash('success_msg', 'Course deleted successfully');
        }
        res.redirect('/admin/courses');
    });
});

// Categories Management
router.get('/categories', (req, res) => {
    
    const query = `
        SELECT c.*, COUNT(co.id) as course_count
        FROM categories c
        LEFT JOIN courses co ON c.id = co.category_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, (err, categories) => {
        if (err) {
            console.error(err);
            categories = [];
        }
        res.render('admin/categories', { categories });
    });
});

// Add Category Form
router.get('/categories/add', (req, res) => {
    res.render('admin/add-category');
});

// Handle Add Category
router.post('/categories/add', [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please provide a valid category name');
        return res.redirect('/admin/categories/add');
    }

    const { name, description } = req.body;
    

    const insertQuery = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    
    db.query(insertQuery, [name, description || null], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error creating category');
            return res.redirect('/admin/categories/add');
        }

        req.flash('success_msg', 'Category created successfully');
        res.redirect('/admin/categories');
    });
});

// Edit Category Form
router.get('/categories/edit/:id', (req, res) => {
    
    const categoryId = req.params.id;
    
    db.query('SELECT * FROM categories WHERE id = ?', [categoryId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Category not found');
            return res.redirect('/admin/categories');
        }
        
        res.render('admin/edit-category', { category: results[0] });
    });
});

// Handle Edit Category
router.post('/categories/edit/:id', [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please provide a valid category name');
        return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }

    const { name, description } = req.body;
    const categoryId = req.params.id;
    

    const updateQuery = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';

    db.query(updateQuery, [name, description || null, categoryId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating category');
            return res.redirect(`/admin/categories/edit/${categoryId}`);
        }

        req.flash('success_msg', 'Category updated successfully');
        res.redirect('/admin/categories');
    });
});

// Delete Category
router.post('/categories/delete/:id', (req, res) => {
    const categoryId = req.params.id;
    
    
    db.query('DELETE FROM categories WHERE id = ?', [categoryId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error deleting category');
        } else {
            req.flash('success_msg', 'Category deleted successfully');
        }
        res.redirect('/admin/categories');
    });
});

return router;
};
