-- LearnHub Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS learnhub;
USE learnhub;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    profile_image VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Create Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructor_id INT NOT NULL,
    category_id INT NOT NULL,
    thumbnail VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0.00,
    level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    requirements TEXT,
    objectives TEXT,
    duration VARCHAR(50),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status)
);

-- Create Modules Table (Course Sections)
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
);

-- Create Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type ENUM('video', 'text', 'quiz', 'assignment') NOT NULL,
    video_url VARCHAR(255),
    duration INT, -- in minutes
    position INT NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_module (module_id),
    INDEX idx_type (type)
);

-- Create Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_percentage DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id)
);

-- Create Progress Table
CREATE TABLE IF NOT EXISTS progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (enrollment_id, lesson_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_lesson (lesson_id)
);

-- Create Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_rating (rating)
);

-- Create Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- Create Sample Data
-- Insert Sample Users
INSERT INTO users (username, email, password, role, first_name, last_name, bio) VALUES
('john_student', 'john@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uQxTmIJe.P29doNdmUQSv.IjH21EuQR.', 'student', 'John', 'Doe', 'A passionate learner'),
('sarah_instructor', 'sarah@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uQxTmIJe.P29doNdmUQSv.IjH21EuQR.', 'instructor', 'Sarah', 'Smith', 'Experienced instructor with 10 years of teaching'),
('admin_user', 'admin@learnhub.com', '$2b$10$CwTycUXWue0Thq9StjUM0uQxTmIJe.P29doNdmUQSv.IjH21EuQR.', 'admin', 'Admin', 'User', 'System administrator');

-- Insert Sample Categories
INSERT INTO categories (name, description) VALUES
('Web Development', 'Learn how to build websites and web applications'),
('Data Science', 'Master data analysis and machine learning'),
('Mobile Development', 'Create applications for iOS and Android');

-- Insert Sample Courses
INSERT INTO courses (title, description, instructor_id, category_id, level, status, price) VALUES
('Introduction to HTML & CSS', 'Learn the fundamentals of web development with HTML and CSS', 2, 1, 'beginner', 'published', 29.99),
('JavaScript Fundamentals', 'Master the basics of JavaScript programming', 2, 1, 'beginner', 'published', 39.99),
('Python for Data Science', 'Learn how to analyze data using Python', 2, 2, 'intermediate', 'published', 49.99);

-- Insert Sample Modules
INSERT INTO modules (course_id, title, description, position) VALUES
(1, 'HTML Basics', 'Understanding HTML structure and elements', 1),
(1, 'CSS Fundamentals', 'Styling your HTML with CSS', 2),
(2, 'JavaScript Syntax', 'Basic syntax and data types', 1),
(2, 'Functions and Objects', 'Working with functions and objects in JavaScript', 2),
(3, 'Python Basics', 'Introduction to Python programming', 1),
(3, 'Data Analysis with Pandas', 'Learn to manipulate data with Pandas', 2);

-- Insert Sample Lessons
INSERT INTO lessons (module_id, title, content, type, duration, position, is_free) VALUES
(1, 'HTML Document Structure', 'Learn about DOCTYPE, HTML, HEAD, and BODY tags', 'text', 15, 1, TRUE),
(1, 'HTML Elements', 'Explore common HTML elements like headings, paragraphs, and lists', 'video', 20, 2, FALSE),
(2, 'CSS Selectors', 'Understanding different types of CSS selectors', 'text', 25, 1, TRUE),
(2, 'CSS Box Model', 'Learn about padding, margin, and border', 'video', 30, 2, FALSE),
(3, 'Variables and Data Types', 'Understand JavaScript variables and data types', 'video', 25, 1, TRUE),
(3, 'Operators', 'Learn about arithmetic, comparison, and logical operators', 'text', 20, 2, FALSE),
(4, 'Function Declaration', 'Different ways to declare functions in JavaScript', 'video', 30, 1, FALSE),
(4, 'Objects and Arrays', 'Working with complex data structures', 'quiz', 25, 2, FALSE),
(5, 'Python Syntax', 'Basic syntax and structure of Python', 'video', 30, 1, TRUE),
(5, 'Variables and Data Types', 'Understanding Python data types', 'text', 25, 2, FALSE),
(6, 'Introduction to Pandas', 'Getting started with the Pandas library', 'video', 35, 1, FALSE),
(6, 'Data Frames', 'Working with data frames in Pandas', 'assignment', 40, 2, FALSE);

-- Insert Sample Enrollments
INSERT INTO enrollments (user_id, course_id) VALUES
(1, 1),
(1, 2);

-- Insert Sample Progress
INSERT INTO progress (enrollment_id, lesson_id, completed, completed_at) VALUES
(1, 1, TRUE, NOW()),
(1, 2, TRUE, NOW()),
(1, 3, FALSE, NULL),
(2, 5, TRUE, NOW()),
(2, 6, FALSE, NULL);

-- Insert Sample Feedback
INSERT INTO feedback (enrollment_id, rating, review) VALUES
(1, 5, 'Great course! I learned a lot about HTML and CSS.'),
(2, 4, 'Very informative JavaScript course.');

-- Insert Sample Support Messages
INSERT INTO support_messages (user_id, subject, message, status) VALUES
(1, 'Video not loading', 'I cannot access the video in lesson 2 of the HTML course.', 'open');
