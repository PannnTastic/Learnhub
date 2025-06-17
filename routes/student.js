const express = require('express');
const { body, validationResult } = require('express-validator');

module.exports = (db) => {
    const router = express.Router();

// Student Dashboard
router.get('/dashboard', (req, res) => {
    
    const userId = req.session.user.id;
    
    const enrolledCoursesQuery = `
        SELECT c.*, e.enrolled_at, e.completion_percentage, u.first_name, u.last_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
    `;
    
    db.query(enrolledCoursesQuery, [userId], (err, enrolledCourses) => {
        if (err) {
            console.error(err);
            enrolledCourses = [];
        }
        
        res.render('student/dashboard', { enrolledCourses });
    });
});

// My Courses
router.get('/courses', (req, res) => {
    
    const userId = req.session.user.id;
    
    const query = `
        SELECT c.*, e.enrolled_at, e.completion_percentage, u.first_name, u.last_name,
               cat.name as category_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        JOIN categories cat ON c.category_id = cat.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
    `;
    
    db.query(query, [userId], (err, courses) => {
        if (err) {
            console.error(err);
            courses = [];
        }
        
        res.render('student/courses', { enrolledCourses: courses });
    });
});

// Course Learning Page
router.get('/courses/:id', (req, res) => {
    
    const courseId = req.params.id;
    const userId = req.session.user.id;
    
    // Check if user is enrolled
    const enrollmentQuery = `
        SELECT e.id as enrollment_id, c.*, u.first_name, u.last_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        WHERE e.user_id = ? AND e.course_id = ?
    `;
    
    db.query(enrollmentQuery, [userId, courseId], (err, enrollmentResults) => {
        if (err || enrollmentResults.length === 0) {
            req.flash('error_msg', 'You are not enrolled in this course');
            return res.redirect('/student/courses');
        }
        
        const course = enrollmentResults[0];
        const enrollmentId = course.enrollment_id;
        
        // Get modules and lessons
        const modulesQuery = `
            SELECT m.*, l.id as lesson_id, l.title as lesson_title, l.type as lesson_type,
                   l.duration, l.position as lesson_position, l.is_free,
                   p.completed as lesson_completed
            FROM modules m
            LEFT JOIN lessons l ON m.id = l.module_id
            LEFT JOIN progress p ON (l.id = p.lesson_id AND p.enrollment_id = ?)
            WHERE m.course_id = ?
            ORDER BY m.position, l.position
        `;
        
        db.query(modulesQuery, [enrollmentId, courseId], (err, moduleResults) => {
            if (err) {
                console.error(err);
                moduleResults = [];
            }
            
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
                        position: row.lesson_position,
                        is_free: row.is_free,
                        completed: row.lesson_completed || false
                    });
                }
            });
            
            res.render('student/course-learn', { 
                course, 
                modules: Object.values(modules),
                enrollmentId 
            });
        });
    });
});

// Lesson Content
router.get('/courses/:courseId/lessons/:lessonId', (req, res) => {
    
    const { courseId, lessonId } = req.params;
    const userId = req.session.user.id;
    
    // Check enrollment and get lesson
    const lessonQuery = `
        SELECT l.*, m.title as module_title, c.title as course_title, e.id as enrollment_id
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON (c.id = e.course_id AND e.user_id = ?)
        WHERE l.id = ? AND c.id = ?
    `;
    
    db.query(lessonQuery, [userId, lessonId, courseId], (err, results) => {
        if (err || results.length === 0) {
            req.flash('error_msg', 'Lesson not found or access denied');
            return res.redirect(`/student/courses/${courseId}`);
        }
        
        const lesson = results[0];
        
        // Get progress
        db.query('SELECT completed FROM progress WHERE enrollment_id = ? AND lesson_id = ?', 
                [lesson.enrollment_id, lessonId], (err, progressResults) => {
            
            const isCompleted = progressResults.length > 0 && progressResults[0].completed;
            
            res.render('student/lesson', { 
                lesson, 
                isCompleted,
                courseId 
            });
        });
    });
});

// Mark lesson as complete
router.post('/courses/:courseId/lessons/:lessonId/complete', (req, res) => {
    
    const { courseId, lessonId } = req.params;
    const userId = req.session.user.id;
    
    // Get enrollment ID
    db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', 
            [userId, courseId], (err, enrollmentResults) => {
        if (err || enrollmentResults.length === 0) {
            req.flash('error_msg', 'Enrollment not found');
            return res.redirect(`/student/courses/${courseId}`);
        }
        
        const enrollmentId = enrollmentResults[0].id;
        
        // Insert or update progress
        const progressQuery = `
            INSERT INTO progress (enrollment_id, lesson_id, completed, completed_at)
            VALUES (?, ?, TRUE, NOW())
            ON DUPLICATE KEY UPDATE completed = TRUE, completed_at = NOW()
        `;
        
        db.query(progressQuery, [enrollmentId, lessonId], (err, result) => {
            if (err) {
                console.error(err);
                req.flash('error_msg', 'Error updating progress');
            } else {
                req.flash('success_msg', 'Lesson marked as complete');
                
                // Update enrollment completion percentage
                updateCompletionPercentage(enrollmentId, courseId);
            }
            
            res.redirect(`/student/courses/${courseId}/lessons/${lessonId}`);
        });
    });
});

// Submit feedback
router.post('/courses/:id/feedback', [
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', 'Please provide a valid rating');
        return res.redirect(`/student/courses/${req.params.id}`);
    }
    
    
    const courseId = req.params.id;
    const userId = req.session.user.id;
    const { rating, review } = req.body;
    
    // Get enrollment ID
    db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', 
            [userId, courseId], (err, enrollmentResults) => {
        if (err || enrollmentResults.length === 0) {
            req.flash('error_msg', 'You must be enrolled to submit feedback');
            return res.redirect(`/student/courses/${courseId}`);
        }
        
        const enrollmentId = enrollmentResults[0].id;
        
        // Check if feedback already exists
        db.query('SELECT id FROM feedback WHERE enrollment_id = ?', [enrollmentId], (err, feedbackResults) => {
            if (feedbackResults.length > 0) {
                // Update existing feedback
                db.query('UPDATE feedback SET rating = ?, review = ? WHERE enrollment_id = ?', 
                        [rating, review || null, enrollmentId], (err, result) => {
                    if (err) {
                        console.error(err);
                        req.flash('error_msg', 'Error updating feedback');
                    } else {
                        req.flash('success_msg', 'Feedback updated successfully');
                    }
                    res.redirect(`/student/courses/${courseId}`);
                });
            } else {
                // Insert new feedback
                db.query('INSERT INTO feedback (enrollment_id, rating, review) VALUES (?, ?, ?)', 
                        [enrollmentId, rating, review || null], (err, result) => {
                    if (err) {
                        console.error(err);
                        req.flash('error_msg', 'Error submitting feedback');
                    } else {
                        req.flash('success_msg', 'Feedback submitted successfully');
                    }
                    res.redirect(`/student/courses/${courseId}`);
                });
            }
        });
    });
});

// Profile
router.get('/profile', (req, res) => {
    res.render('student/profile', { user: req.session.user });
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
        return res.redirect('/student/profile');
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
            return res.redirect('/student/profile');
        }

        // Update session data
        req.session.user.first_name = first_name;
        req.session.user.last_name = last_name;
        req.session.user.username = username;
        req.session.user.email = email;

        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/student/profile');
    });
});

// Helper function to update completion percentage
function updateCompletionPercentage(enrollmentId, courseId) {
    
    
    const query = `
        SELECT 
            COUNT(l.id) as total_lessons,
            COUNT(p.id) as completed_lessons
        FROM modules m
        JOIN lessons l ON m.id = l.module_id
        LEFT JOIN progress p ON (l.id = p.lesson_id AND p.enrollment_id = ? AND p.completed = TRUE)
        WHERE m.course_id = ?
    `;
      db.query(query, [enrollmentId, courseId], (err, results) => {
        if (!err && results.length > 0) {
            const { total_lessons, completed_lessons } = results[0];
            const percentage = total_lessons > 0 ? (completed_lessons / total_lessons) * 100 : 0;
            
            db.query('UPDATE enrollments SET completion_percentage = ? WHERE id = ?', 
                    [percentage, enrollmentId], (err) => {
                if (err) console.error('Error updating completion percentage:', err);
            });
        }
    });
}

return router;
};
