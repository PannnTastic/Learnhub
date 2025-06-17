const express = require('express');
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

// Instructor Dashboard
router.get('/dashboard', (req, res) => {
    
    const instructorId = req.session.user.id;
    
    const statsQuery = `
        SELECT 
            COUNT(DISTINCT c.id) as total_courses,
            COUNT(DISTINCT e.id) as total_enrollments,
            AVG(f.rating) as avg_rating
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN feedback f ON e.id = f.enrollment_id
        WHERE c.instructor_id = ?
    `;
    
    const recentCoursesQuery = `
        SELECT c.*, COUNT(e.id) as enrollments
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.instructor_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 5
    `;
    
    db.query(statsQuery, [instructorId], (err, statsResults) => {
        const stats = statsResults[0] || { total_courses: 0, total_enrollments: 0, avg_rating: 0 };
        
        db.query(recentCoursesQuery, [instructorId], (err, courses) => {
            if (err) courses = [];
            
            res.render('instructor/dashboard', { 
                stats: {
                    ...stats,
                    avg_rating: Math.round((stats.avg_rating || 0) * 10) / 10
                },
                recentCourses: courses 
            });
        });
    });
});

// My Courses
router.get('/courses', (req, res) => {
    
    const instructorId = req.session.user.id;
    
    const query = `
        SELECT c.*, cat.name as category_name, COUNT(e.id) as total_enrollments
        FROM courses c
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.instructor_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, [instructorId], (err, courses) => {
        if (err) {
            console.error(err);
            courses = [];
        }
        
        res.render('instructor/courses', { courses });
    });
});

// Add Course Form
router.get('/courses/add', (req, res) => {
    
    
    db.query('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) categories = [];
        res.render('instructor/add-course', { categories });
    });
});

// Handle Add Course
router.post('/courses/add', upload.single('thumbnail'), [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category_id').isInt({ min: 1 }),
    body('level').isIn(['beginner', 'intermediate', 'advanced']),
    body('price').isFloat({ min: 0 })
], (req, res) => {    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect('/instructor/courses/add');
    }

    const { title, description, category_id, level, price, status, objectives, requirements } = req.body;
    const instructorId = req.session.user.id;
    
    // Handle thumbnail upload
    let thumbnail = null;
    if (req.file) {
        thumbnail = req.file.filename;
    }
    
    // Process objectives and requirements arrays
    const objectivesText = Array.isArray(objectives) ? objectives.filter(obj => obj.trim() !== '').join('\n') : '';
    const requirementsText = Array.isArray(requirements) ? requirements.filter(req => req.trim() !== '').join('\n') : '';
    
    // Set default status if not provided
    const courseStatus = status || 'draft';

    const insertQuery = `
        INSERT INTO courses (title, description, instructor_id, category_id, level, price, status, thumbnail, objectives, requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [title, description, instructorId, category_id, level, price, courseStatus, thumbnail, objectivesText, requirementsText], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error creating course');
            return res.redirect('/instructor/courses/add');
        }

        req.flash('success_msg', 'Course created successfully');
        res.redirect('/instructor/courses');
    });
});

// Edit Course Form
router.get('/courses/edit/:id', (req, res) => {
    
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    
    const courseQuery = 'SELECT * FROM courses WHERE id = ? AND instructor_id = ?';
    const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
    
    db.query(courseQuery, [courseId, instructorId], (err, courseResults) => {
        if (err || courseResults.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/instructor/courses');
        }
        
        db.query(categoriesQuery, (err, categories) => {
            if (err) categories = [];
            res.render('instructor/edit-course', { 
                course: courseResults[0], 
                categories 
            });
        });
    });
});

// Handle Edit Course
router.post('/courses/edit/:id', upload.single('thumbnail'), [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category_id').isInt({ min: 1 }),
    body('level').isIn(['beginner', 'intermediate', 'advanced']),
    body('price').isFloat({ min: 0 }),
    body('status').isIn(['draft', 'published', 'archived'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect(`/instructor/courses/edit/${req.params.id}`);
    }

    const { title, description, category_id, level, price, status, requirements, objectives } = req.body;
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    
    // Handle thumbnail upload
    let thumbnail = null;
    if (req.file) {
        thumbnail = req.file.filename;
    }

    let updateQuery, updateParams;
    
    if (thumbnail) {
        updateQuery = `
            UPDATE courses 
            SET title = ?, description = ?, category_id = ?, level = ?, price = ?, status = ?, requirements = ?, objectives = ?, thumbnail = ?
            WHERE id = ? AND instructor_id = ?
        `;
        updateParams = [title, description, category_id, level, price, status, requirements, objectives, thumbnail, courseId, instructorId];
    } else {
        updateQuery = `
            UPDATE courses 
            SET title = ?, description = ?, category_id = ?, level = ?, price = ?, status = ?, requirements = ?, objectives = ?
            WHERE id = ? AND instructor_id = ?
        `;
        updateParams = [title, description, category_id, level, price, status, requirements, objectives, courseId, instructorId];
    }

    db.query(updateQuery, updateParams, (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating course');
            return res.redirect(`/instructor/courses/edit/${courseId}`);
        }

        req.flash('success_msg', 'Course updated successfully');
        res.redirect('/instructor/courses');
    });
});

// Course Content Management
router.get('/courses/:id/content', (req, res) => {
    
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    
    // Check course ownership
    db.query('SELECT * FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, courseResults) => {
        if (err || courseResults.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/instructor/courses');
        }
        
        const course = courseResults[0];
        
        // Get modules and lessons
        const modulesQuery = `
            SELECT m.*, l.id as lesson_id, l.title as lesson_title, l.type as lesson_type,
                   l.duration, l.position as lesson_position
            FROM modules m
            LEFT JOIN lessons l ON m.id = l.module_id
            WHERE m.course_id = ?
            ORDER BY m.position, l.position
        `;
        
        db.query(modulesQuery, [courseId], (err, moduleResults) => {
            if (err) moduleResults = [];
            
            // Group lessons by modules
            const modules = {};
            moduleResults.forEach(row => {
                if (!modules[row.id]) {
                    modules[row.id] = {
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        position: row.position,
                        lessons: []
                    };
                }
                
                if (row.lesson_id) {
                    modules[row.id].lessons.push({
                        id: row.lesson_id,
                        title: row.lesson_title,
                        type: row.lesson_type,
                        duration: row.duration,
                        position: row.lesson_position
                    });
                }
            });
            
            res.render('instructor/course-content', { 
                course, 
                modules: Object.values(modules) 
            });
        });
    });
});

// Add Module Form
router.get('/courses/:id/modules/add', (req, res) => {
    
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    
    db.query('SELECT id, title FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/instructor/courses');
        }
        
        res.render('instructor/add-module', { course: results[0] });
    });
});

// Handle Add Module
router.post('/courses/:id/modules/add', [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('position').isInt({ min: 0 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please provide a valid module title');
        return res.redirect(`/instructor/courses/${req.params.id}/modules/add`);
    }

    const { title, description, position } = req.body;
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    

    // Verify course ownership
    db.query('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/instructor/courses');
        }

        const insertQuery = 'INSERT INTO modules (course_id, title, description, position) VALUES (?, ?, ?, ?)';
        
        db.query(insertQuery, [courseId, title, description || null, position], (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Error creating module');
                return res.redirect(`/instructor/courses/${courseId}/modules/add`);
            }

            req.flash('success_msg', 'Module created successfully');
            res.redirect(`/instructor/courses/${courseId}/content`);
        });
    });
});

// Add Lesson Form
router.get('/courses/:courseId/modules/:moduleId/lessons/add', (req, res) => {
    
    const { courseId, moduleId } = req.params;
    const instructorId = req.session.user.id;
    
    const query = `
        SELECT c.id as course_id, c.title as course_title, m.id as module_id, m.title as module_title
        FROM courses c
        JOIN modules m ON c.id = m.course_id
        WHERE c.id = ? AND m.id = ? AND c.instructor_id = ?
    `;
    
    db.query(query, [courseId, moduleId, instructorId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Module not found');
            return res.redirect(`/instructor/courses/${courseId}/content`);
        }
        
        res.render('instructor/add-lesson', { 
            course: { id: results[0].course_id, title: results[0].course_title },
            module: { id: results[0].module_id, title: results[0].module_title }
        });
    });
});

// Handle Add Lesson
router.post('/courses/:courseId/modules/:moduleId/lessons/add', [
    body('title').notEmpty().trim(),
    body('content').optional().trim(),
    body('type').isIn(['video', 'text', 'quiz', 'assignment']),
    body('duration').isInt({ min: 0 }),
    body('position').isInt({ min: 0 }),
    body('video_url').optional().isURL()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all required fields correctly');
        return res.redirect(`/instructor/courses/${req.params.courseId}/modules/${req.params.moduleId}/lessons/add`);
    }

    const { title, content, type, duration, position, video_url, is_free } = req.body;
    const { courseId, moduleId } = req.params;
    const instructorId = req.session.user.id;
    

    // Verify ownership
    const verifyQuery = `
        SELECT c.id FROM courses c
        JOIN modules m ON c.id = m.course_id
        WHERE c.id = ? AND m.id = ? AND c.instructor_id = ?
    `;
    
    db.query(verifyQuery, [courseId, moduleId, instructorId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Module not found');
            return res.redirect(`/instructor/courses/${courseId}/content`);
        }

        const insertQuery = `
            INSERT INTO lessons (module_id, title, content, type, video_url, duration, position, is_free)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [
            moduleId, title, content || null, type, video_url || null, 
            duration, position, is_free ? 1 : 0
        ], (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Error creating lesson');
                return res.redirect(`/instructor/courses/${courseId}/modules/${moduleId}/lessons/add`);
            }

            req.flash('success_msg', 'Lesson created successfully');
            res.redirect(`/instructor/courses/${courseId}/content`);
        });
    });
});

// Course Analytics
router.get('/courses/:id/analytics', (req, res) => {
    
    const courseId = req.params.id;
    const instructorId = req.session.user.id;
    
    // Verify ownership
    db.query('SELECT * FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, courseResults) => {
        if (err || courseResults.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/instructor/courses');
        }
        
        const course = courseResults[0];
        
        // Get analytics data
        const analyticsQuery = `
            SELECT 
                COUNT(DISTINCT e.id) as total_enrollments,
                AVG(e.completion_percentage) as avg_completion,
                COUNT(DISTINCT f.id) as total_feedback,
                AVG(f.rating) as avg_rating
            FROM enrollments e
            LEFT JOIN feedback f ON e.id = f.enrollment_id
            WHERE e.course_id = ?
        `;
        
        const enrollmentsTrendQuery = `
            SELECT DATE(enrolled_at) as date, COUNT(*) as count
            FROM enrollments 
            WHERE course_id = ? 
            GROUP BY DATE(enrolled_at)
            ORDER BY date DESC
            LIMIT 30
        `;
        
        const feedbackQuery = `
            SELECT f.rating, f.review, f.created_at, u.first_name, u.last_name
            FROM feedback f
            JOIN enrollments e ON f.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = ?
            ORDER BY f.created_at DESC
        `;
        
        db.query(analyticsQuery, [courseId], (err, analyticsResults) => {
            const analytics = analyticsResults[0] || {};
            
            db.query(enrollmentsTrendQuery, [courseId], (err, trendResults) => {
                if (err) trendResults = [];
                
                db.query(feedbackQuery, [courseId], (err, feedbackResults) => {
                    if (err) feedbackResults = [];
                    
                    res.render('instructor/course-analytics', { 
                        course,
                        analytics: {
                            ...analytics,
                            avg_completion: Math.round((analytics.avg_completion || 0) * 10) / 10,
                            avg_rating: Math.round((analytics.avg_rating || 0) * 10) / 10
                        },
                        enrollmentsTrend: trendResults,
                        feedback: feedbackResults
                    });
                });
            });
        });
    });
});

// Profile
router.get('/profile', (req, res) => {
    res.render('instructor/profile', { user: req.session.user });
});

// Update Profile
router.post('/profile', [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('bio').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please fill all fields correctly');
        return res.redirect('/instructor/profile');
    }

    const { first_name, last_name, username, email, bio } = req.body;
    const userId = req.session.user.id;
    

    const updateQuery = `
        UPDATE users 
        SET first_name = ?, last_name = ?, username = ?, email = ?, bio = ?
        WHERE id = ?
    `;

    db.query(updateQuery, [first_name, last_name, username, email, bio || null, userId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating profile');
            return res.redirect('/instructor/profile');
        }

        // Update session data        req.session.user.first_name = first_name;
        req.session.user.last_name = last_name;
        req.session.user.username = username;
        req.session.user.email = email;
        
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/instructor/profile');
    });
});

return router;
};
