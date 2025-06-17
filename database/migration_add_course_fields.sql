-- Migration: Add Requirements and Objectives to Courses Table
-- Add columns for course requirements and learning objectives

USE learnhub;

-- Add requirements column
ALTER TABLE courses 
ADD COLUMN requirements TEXT AFTER level;

-- Add objectives column  
ALTER TABLE courses 
ADD COLUMN objectives TEXT AFTER requirements;

-- Add duration column (optional)
ALTER TABLE courses 
ADD COLUMN duration VARCHAR(50) AFTER objectives;

-- Update existing courses to have default values (optional)
-- UPDATE courses SET requirements = NULL WHERE requirements IS NULL;
-- UPDATE courses SET objectives = NULL WHERE objectives IS NULL;

-- Verify the changes
-- DESCRIBE courses;
