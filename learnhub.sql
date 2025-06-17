-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for learnhub
CREATE DATABASE IF NOT EXISTS `learnhub` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `learnhub`;

-- Dumping structure for table learnhub.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.categories: ~3 rows (approximately)
DELETE FROM `categories`;
INSERT INTO `categories` (`id`, `name`, `description`, `created_at`) VALUES
	(1, 'Web Development', 'Learn how to build websites and web applications', '2025-06-16 14:44:46'),
	(2, 'Data Science', 'Master data analysis and machine learning', '2025-06-16 14:44:46'),
	(3, 'Mobile Development', 'Create applications for iOS and Android', '2025-06-16 14:44:46');

-- Dumping structure for table learnhub.courses
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `instructor_id` int NOT NULL,
  `category_id` int NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `level` enum('beginner','intermediate','advanced') NOT NULL,
  `requirements` text,
  `objectives` text,
  `duration` varchar(50) DEFAULT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_instructor` (`instructor_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.courses: ~4 rows (approximately)
DELETE FROM `courses`;
INSERT INTO `courses` (`id`, `title`, `description`, `instructor_id`, `category_id`, `thumbnail`, `price`, `level`, `requirements`, `objectives`, `duration`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'Introduction to HTML & CSS', 'Learn the fundamentals of web development with HTML and CSS', 1, 1, NULL, 29.99, 'beginner', NULL, NULL, NULL, 'published', '2025-06-16 21:50:25', '2025-06-17 00:30:24'),
	(2, 'JavaScript Fundamentals', 'Master the basics of JavaScript programming', 1, 1, NULL, 39.99, 'beginner', NULL, NULL, NULL, 'published', '2025-06-16 21:50:25', '2025-06-17 00:30:26'),
	(3, 'Python for Data Science', 'Learn how to analyze data using Python', 1, 2, NULL, 49.99, 'intermediate', NULL, NULL, NULL, 'published', '2025-06-16 21:50:25', '2025-06-17 00:30:29'),
	(11, 'pdw', 'esxdrcgfvhbjnuhjgyvh nhbjunbkjg mnjkubjg vnmhjukg vnbmhnjkug v', 1, 1, NULL, 0.00, 'beginner', '', '', NULL, 'published', '2025-06-17 02:09:54', '2025-06-17 02:09:54');

-- Dumping structure for table learnhub.enrollments
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_accessed` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`user_id`,`course_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_course` (`course_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.enrollments: ~3 rows (approximately)
DELETE FROM `enrollments`;
INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `enrolled_at`, `last_accessed`, `completion_percentage`) VALUES
	(1, 3, 1, '2025-06-16 21:52:37', '2025-06-16 21:52:37', 10.00),
	(2, 3, 2, '2025-06-16 21:52:37', '2025-06-16 21:52:37', 100.00),
	(5, 3, 3, '2025-06-17 00:48:25', '2025-06-17 00:48:25', 25.00);

-- Dumping structure for table learnhub.feedback
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `rating` int NOT NULL,
  `review` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_enrollment` (`enrollment_id`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feedback_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.feedback: ~2 rows (approximately)
DELETE FROM `feedback`;
INSERT INTO `feedback` (`id`, `enrollment_id`, `rating`, `review`, `created_at`) VALUES
	(3, 1, 5, 'Great course! I learned a lot about HTML and CSS.', '2025-06-16 21:54:08'),
	(4, 2, 4, 'Very informative JavaScript course.', '2025-06-16 21:54:08');

-- Dumping structure for table learnhub.lessons
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `type` enum('video','text','quiz','assignment') NOT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `position` int NOT NULL DEFAULT '0',
  `is_free` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_module` (`module_id`),
  KEY `idx_type` (`type`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.lessons: ~12 rows (approximately)
DELETE FROM `lessons`;
INSERT INTO `lessons` (`id`, `module_id`, `title`, `content`, `type`, `video_url`, `duration`, `position`, `is_free`, `created_at`, `updated_at`) VALUES
	(1, 1, 'HTML Document Structure', 'Learn about DOCTYPE, HTML, HEAD, and BODY tags', 'text', NULL, 15, 1, 1, '2025-06-16 21:52:20', '2025-06-16 21:53:21'),
	(2, 1, 'HTML Elements', 'Explore common HTML elements like headings, paragraphs, and lists', 'video', NULL, 20, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:23'),
	(3, 2, 'CSS Selectors', 'Understanding different types of CSS selectors', 'text', NULL, 25, 1, 1, '2025-06-16 21:52:20', '2025-06-16 21:53:27'),
	(4, 2, 'CSS Box Model', 'Learn about padding, margin, and border', 'video', NULL, 30, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:29'),
	(5, 3, 'Variables and Data Types', 'Understand JavaScript variables and data types', 'video', NULL, 25, 1, 1, '2025-06-16 21:52:20', '2025-06-16 21:53:31'),
	(6, 3, 'Operators', 'Learn about arithmetic, comparison, and logical operators', 'text', NULL, 20, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:33'),
	(7, 4, 'Function Declaration', 'Different ways to declare functions in JavaScript', 'video', NULL, 30, 1, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:36'),
	(8, 4, 'Objects and Arrays', 'Working with complex data structures', 'quiz', NULL, 25, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:40'),
	(9, 5, 'Python Syntax', 'Basic syntax and structure of Python', 'video', NULL, 30, 1, 1, '2025-06-16 21:52:20', '2025-06-16 21:53:42'),
	(10, 5, 'Variables and Data Types', 'Understanding Python data types', 'text', NULL, 25, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:48'),
	(11, 6, 'Introduction to Pandas', 'Getting started with the Pandas library', 'video', NULL, 35, 1, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:51'),
	(12, 6, 'Data Frames', 'Working with data frames in Pandas', 'assignment', NULL, 40, 2, 0, '2025-06-16 21:52:20', '2025-06-16 21:53:53');

-- Dumping structure for table learnhub.modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `position` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_course` (`course_id`),
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.modules: ~7 rows (approximately)
DELETE FROM `modules`;
INSERT INTO `modules` (`id`, `course_id`, `title`, `description`, `position`, `created_at`, `updated_at`) VALUES
	(1, 1, 'HTML Basics', 'Understanding HTML structure and elements', 1, '2025-06-16 21:51:27', '2025-06-16 21:51:59'),
	(2, 1, 'CSS Fundamentals', 'Styling your HTML with CSS', 2, '2025-06-16 21:51:27', '2025-06-16 21:52:00'),
	(3, 2, 'JavaScript Syntax', 'Basic syntax and data types', 1, '2025-06-16 21:51:27', '2025-06-16 21:52:06'),
	(4, 2, 'Functions and Objects', 'Working with functions and objects in JavaScript', 2, '2025-06-16 21:51:27', '2025-06-16 21:52:08'),
	(5, 3, 'Python Basics', 'Introduction to Python programming', 1, '2025-06-16 21:51:27', '2025-06-16 21:52:13'),
	(6, 3, 'Data Analysis with Pandas', 'Learn to manipulate data with Pandas', 2, '2025-06-16 21:51:27', '2025-06-16 21:52:15'),
	(19, 11, 'html', 'belajarhtml', 1, '2025-06-17 02:10:34', '2025-06-17 02:10:34');

-- Dumping structure for table learnhub.progress
CREATE TABLE IF NOT EXISTS `progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enrollment_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`enrollment_id`,`lesson_id`),
  KEY `idx_enrollment` (`enrollment_id`),
  KEY `idx_lesson` (`lesson_id`),
  CONSTRAINT `progress_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.progress: ~6 rows (approximately)
DELETE FROM `progress`;
INSERT INTO `progress` (`id`, `enrollment_id`, `lesson_id`, `completed`, `completed_at`) VALUES
	(16, 1, 1, 1, '2025-06-16 21:53:57'),
	(17, 1, 2, 1, '2025-06-16 21:53:57'),
	(18, 1, 3, 0, NULL),
	(19, 2, 5, 1, '2025-06-16 21:53:57'),
	(20, 2, 6, 0, NULL),
	(21, 5, 10, 1, '2025-06-17 00:48:32');

-- Dumping structure for table learnhub.support_messages
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','resolved') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.support_messages: ~1 rows (approximately)
DELETE FROM `support_messages`;
INSERT INTO `support_messages` (`id`, `user_id`, `subject`, `message`, `status`, `created_at`, `updated_at`) VALUES
	(2, 1, 'Video not loading', 'I cannot access the video in lesson 2 of the HTML course.', 'open', '2025-06-16 21:54:18', '2025-06-16 21:54:18');

-- Dumping structure for table learnhub.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','instructor','admin') NOT NULL DEFAULT 'student',
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `bio` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table learnhub.users: ~4 rows (approximately)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `profile_image`, `bio`, `created_at`, `updated_at`) VALUES
	(1, 'inst', 'instructor@learnhub.com', '$2b$10$VAmvMw00A5muijoKGn.nYeTtLLte/xMjibzXW9RALPSuKg8d3SQwG', 'instructor', 'Nabil', 'Nasruddin', NULL, NULL, '2025-06-16 21:44:25', '2025-06-16 21:44:25'),
	(2, 'admin', 'admin@learnhub.com', '$2b$10$VAmvMw00A5muijoKGn.nYeTtLLte/xMjibzXW9RALPSuKg8d3SQwG', 'admin', 'Ahmad', 'Alfan', NULL, '', '2025-06-16 21:22:56', '2025-06-16 21:45:02'),
	(3, 'student', 'student@learnhub.com', '$2b$10$VAmvMw00A5muijoKGn.nYeTtLLte/xMjibzXW9RALPSuKg8d3SQwG', 'student', 'Sascha', 'Danu', NULL, NULL, '2025-06-16 21:45:34', '2025-06-16 21:45:34'),
	(5, 'Zeus', 'zeus@learnhub.com', '$2b$10$VAmvMw00A5muijoKGn.nYeTtLLte/xMjibzXW9RALPSuKg8d3SQwG', 'instructor', 'Ardilia', 'Apriandi', NULL, 'fearless !', '2025-06-17 02:14:26', '2025-06-17 02:15:50');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
