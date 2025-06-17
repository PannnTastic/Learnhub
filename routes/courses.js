const express = require('express');

module.exports = (db) => {
    const router = express.Router();

// List all courses
router.get('/', (req, res) => {
    
    const { category, level, search } = req.query;
    
    let query = `
        SELECT c.*, u.first_name, u.last_name, cat.name as category_name,
               COUNT(e.id) as total_enrollments
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.status = 'published'
    `;
    
    const queryParams = [];
    
    if (category) {
        query += ' AND c.category_id = ?';
        queryParams.push(category);
    }
    
    if (level) {
        query += ' AND c.level = ?';
        queryParams.push(level);
    }
    
    if (search) {
        query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    // Get categories for filter
    db.query('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) {
            categories = [];
        }
        
        db.query(query, queryParams, (err, courses) => {
            if (err) {
                console.error(err);
                courses = [];
            }
            res.render('courses/list', { courses, categories, filters: { category, level, search } });
        });
    });
});

// Course details
router.get('/:id', (req, res) => {
    
    const courseId = req.params.id;
    
    const courseQuery = `
        SELECT c.*, u.first_name, u.last_name, u.bio as instructor_bio, 
               cat.name as category_name, COUNT(e.id) as total_enrollments
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.id = ? AND c.status = 'published'
        GROUP BY c.id
    `;
    
    const modulesQuery = `
        SELECT m.*, COUNT(l.id) as lesson_count
        FROM modules m
        LEFT JOIN lessons l ON m.id = l.module_id
        WHERE m.course_id = ?
        GROUP BY m.id
        ORDER BY m.position
    `;
    
    const feedbackQuery = `
        SELECT f.rating, f.review, f.created_at, u.first_name, u.last_name
        FROM feedback f
        JOIN enrollments e ON f.enrollment_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.course_id = ?
        ORDER BY f.created_at DESC
        LIMIT 10
    `;
    
    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err || courseResults.length === 0) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/courses');
        }
        
        const course = courseResults[0];
        
        // Check if user is enrolled
        let isEnrolled = false;
        if (res.locals.user) {
            db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', 
                    [res.locals.user.id, courseId], (err, enrollmentResults) => {
                if (!err && enrollmentResults.length > 0) {
                    isEnrolled = true;
                }
                
                // Get modules
                db.query(modulesQuery, [courseId], (err, modules) => {
                    if (err) modules = [];
                    
                    // Get feedback
                    db.query(feedbackQuery, [courseId], (err, feedback) => {
                        if (err) feedback = [];
                        
                        // Calculate average rating
                        const avgRating = feedback.length > 0 ? 
                            feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;
                        
                        res.render('courses/detail', { 
                            course, 
                            modules, 
                            feedback, 
                            avgRating: Math.round(avgRating * 10) / 10,
                            isEnrolled 
                        });
                    });
                });
            });
        } else {
            // Get modules
            db.query(modulesQuery, [courseId], (err, modules) => {
                if (err) modules = [];
                
                // Get feedback
                db.query(feedbackQuery, [courseId], (err, feedback) => {
                    if (err) feedback = [];
                    
                    // Calculate average rating
                    const avgRating = feedback.length > 0 ? 
                        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;
                    
                    res.render('courses/detail', { 
                        course, 
                        modules, 
                        feedback, 
                        avgRating: Math.round(avgRating * 10) / 10,
                        isEnrolled 
                    });
                });
            });
        }
    });
});

// Enroll in course (requires authentication)
router.post('/:id/enroll', (req, res) => {
    if (!res.locals.user || res.locals.user.role !== 'student') {
        req.flash('error_msg', 'Please login as a student to enroll');
        return res.redirect('/auth/login');
    }
    
    
    const courseId = req.params.id;
    const userId = res.locals.user.id;
    
    // Check if already enrolled
    db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', 
            [userId, courseId], (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error_msg', 'Database error');
            return res.redirect(`/courses/${courseId}`);
        }
        
        if (results.length > 0) {
            req.flash('error_msg', 'You are already enrolled in this course');
            return res.redirect(`/courses/${courseId}`);
        }
        
        // Enroll user
        db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', 
                [userId, courseId], (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Error enrolling in course');
                return res.redirect(`/courses/${courseId}`);
            }
            
            req.flash('success_msg', 'Successfully enrolled in course');
            res.redirect(`/student/courses/${courseId}`);
        });    });
});

return router;
};
