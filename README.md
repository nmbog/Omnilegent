# Omnilegent

Omnilegent is a full-stack web application designed to help readers track their books and reading progress. Whether you're diving into a new series or revisiting a favorite classic, Omnilegent simplifies organizing your reading journey.

The application was live at https://www.Omnilegent.co.

### Features

- Personalized Book Tracking: Log the books you’re currently reading, plan to read, or have finished.
- Progress Updates: Update your reading status, start date, and finish date with ease.
- User Authentication: Secure login and registration using encrypted passwords and JWT-based        authentication.
- Dynamic Interface: User-friendly design powered by Handlebars for dynamic content rendering.
- Robust Backend: Server logic ensures reliable performance and data security.
  
### Technologies Used
Backend: Node.js, Express.js
Frontend: Handlebars.js
Database: MySQL
Authentication: Bcrypt, JWT
Deployment: (Specify the hosting service used, e.g., Render, Railway, or Heroku)

### How It Works
1. Sign Up/Login: Create an account to access personalized features.
2. Add a Book: Add books to your library by filling out the details, or by searching
   the database!
3. Update Your Progress: Modify your reading status and track key dates.
4. Stay Organized: View and manage your entire book collection. Sort your
   tracked books by status -- "Not Started", "In Progress", "Completed", or "Did Not Finish"

### Getting Started Locally
While the project is live at Omnilegent.co, you can also set it up locally by following these steps:

### Prerequisites
- Node.js installed
- MySQL server configured
- A modern browser

### Installation
- Clone the repository:
  git clone https://github.com/your-username/omnilegent.git  
- Navigate to the project directory:
  cd omnilegent  
- Install dependencies:
  npm install  
- Configure the database:
  Create a MySQL database named omnilegent_db.
- Import the database schema provided in db/schema.sql (if available).
- Set up the environment variables in a .env file:
  DB_HOST=localhost  
  DB_USER=your_db_user  
  DB_PASSWORD=your_db_password  
  DB_NAME=omnilegent_db  

  JWT_SECRET=your_jwt_secret  
  PORT=3000  
- Start the application:
  npm start  
- Open http://localhost:3000 in your browser.
