# LearnHub - E-Learning Platform

A comprehensive e-learning platform built with Node.js, Express.js, EJS, Bootstrap, and MySQL. LearnHub provides a complete solution for online education with role-based access control for administrators, instructors, and students.

## Features

### Admin Features
- **User Management**: Create, edit, and delete users (students, instructors, admins)
- **Course Management**: View and moderate all courses
- **Category Management**: Create and organize course categories
- **Dashboard**: View platform statistics and analytics

### Instructor Features
- **Course Creation**: Create and manage courses with modules and lessons
- **Content Management**: Add videos, text content, quizzes, and assignments
- **Course Analytics**: Track enrollments, completion rates, and student feedback
- **Student Progress**: Monitor student progress through courses

### Student Features
- **Course Enrollment**: Browse and enroll in published courses
- **Learning Progress**: Track completion status and progress through lessons
- **Interactive Learning**: Access videos, text content, quizzes, and assignments
- **Course Feedback**: Rate and review completed courses

### General Features
- **Responsive Design**: Bootstrap-powered responsive UI
- **Authentication**: Secure login/registration with bcrypt password hashing
- **Role-based Access**: Different dashboards and permissions for each user role
- **Search & Filter**: Search courses by title, category, level, and more
- **File Upload**: Support for course thumbnails and media files

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating, Bootstrap 5
- **Database**: MySQL
- **Authentication**: bcryptjs, express-session
- **File Upload**: Multer
- **Validation**: express-validator

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learnhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `learnhub`
   - Run the SQL schema file to create tables and sample data:
   ```bash
   mysql -u root -p learnhub < database/schema.sql
   ```

4. **Environment Configuration**
   - Copy `.env.example` to `.env` (if exists) or update `.env` file
   - Configure your database connection:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=learnhub
   SESSION_SECRET=your-secret-key
   PORT=3000
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Default User Accounts

The application comes with pre-configured demo accounts:

- **Admin**: 
  - Email: admin@learnhub.com
  - Password: password

- **Instructor**: 
  - Email: sarah@example.com
  - Password: password

- **Student**: 
  - Email: john@example.com
  - Password: password

## Project Structure

```
learnhub/
├── app.js                 # Main application file
├── package.json          # Project dependencies
├── .env                  # Environment variables
├── database/             
│   └── schema.sql        # Database schema and sample data
├── routes/               # Express route handlers
│   ├── auth.js          # Authentication routes
│   ├── admin.js         # Admin panel routes
│   ├── instructor.js    # Instructor dashboard routes
│   ├── student.js       # Student dashboard routes
│   └── courses.js       # Course browsing routes
├── views/                # EJS templates
│   ├── partials/        # Reusable template parts
│   ├── auth/            # Login/register pages
│   ├── admin/           # Admin panel views
│   ├── instructor/      # Instructor dashboard views
│   ├── student/         # Student dashboard views
│   └── courses/         # Course listing/detail views
└── public/               # Static assets
    └── uploads/          # Uploaded files directory
```

## API Routes

### Authentication
- `GET /auth/login` - Login page
- `POST /auth/login` - Handle login
- `GET /auth/register` - Registration page
- `POST /auth/register` - Handle registration
- `GET /auth/logout` - Logout

### Admin Routes (Protected - Admin only)
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - User management
- `GET /admin/courses` - Course management
- `GET /admin/categories` - Category management

### Instructor Routes (Protected - Instructor only)
- `GET /instructor/dashboard` - Instructor dashboard
- `GET /instructor/courses` - My courses
- `GET /instructor/courses/add` - Create new course
- `GET /instructor/courses/:id/content` - Manage course content

### Student Routes (Protected - Student only)
- `GET /student/dashboard` - Student dashboard
- `GET /student/courses` - My enrolled courses
- `GET /student/courses/:id` - Course learning interface
- `POST /student/courses/:id/feedback` - Submit course feedback

### Public Routes
- `GET /` - Home page
- `GET /courses` - Browse all courses
- `GET /courses/:id` - Course details
- `POST /courses/:id/enroll` - Enroll in course

## Database Schema

The application uses the following main tables:
- `users` - User accounts with role-based access
- `categories` - Course categories
- `courses` - Course information
- `modules` - Course sections/modules
- `lessons` - Individual lessons within modules
- `enrollments` - Student-course relationships
- `progress` - Student progress tracking
- `feedback` - Course ratings and reviews

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information about the problem
3. Include error messages, screenshots, and steps to reproduce

## Future Enhancements

- Video streaming integration
- Real-time chat/messaging
- Advanced analytics and reporting
- Mobile app development
- Integration with external learning tools
- Automated testing suite
- Docker containerization
