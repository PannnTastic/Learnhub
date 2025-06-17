<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# LearnHub E-Learning Platform - Copilot Instructions

This is a comprehensive e-learning platform built with Node.js, Express.js, EJS, Bootstrap, and MySQL.

## Project Architecture

- **Backend**: Node.js with Express.js framework
- **Frontend**: EJS templating with Bootstrap 5 for responsive design
- **Database**: MySQL with proper foreign key relationships
- **Authentication**: Session-based with bcrypt password hashing
- **File Upload**: Multer for handling course thumbnails and media

## Key Conventions

1. **Route Structure**: Routes are organized by role (admin, instructor, student) and functionality
2. **Database Access**: Use `getDb()` helper function in routes to access database connection
3. **Authentication**: Use `requireAuth` and `requireRole` middleware for protected routes
4. **Views**: EJS templates with Bootstrap components, include partials for reusability
5. **Error Handling**: Use flash messages for user feedback
6. **Validation**: express-validator for form validation

## Database Schema

The application uses these main entities with proper relationships:
- Users (with roles: admin, instructor, student)
- Categories → Courses → Modules → Lessons
- Enrollments (user-course relationships)
- Progress (lesson completion tracking)
- Feedback (course ratings and reviews)

## Security Considerations

- All passwords are hashed with bcrypt
- Role-based access control is enforced
- SQL injection prevention through parameterized queries
- Session-based authentication with secure session configuration

## Code Style Guidelines

1. Use async/await for database operations where possible
2. Include proper error handling and user feedback
3. Follow RESTful route conventions
4. Use Bootstrap classes for consistent styling
5. Include appropriate icons from Bootstrap Icons
6. Maintain responsive design principles

## When making changes:

1. Always validate user input
2. Check user permissions before allowing actions
3. Provide clear user feedback for all operations
4. Maintain data consistency in database operations
5. Follow the established route and view structure
6. Use the existing authentication and authorization patterns
