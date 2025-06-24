# Garbage Monitor - Waste Management System

A comprehensive waste management web application for monitoring and reporting dumpster issues across different neighborhoods.

**Authors**
- Ilienescu George Paul
- Popu Ioan Bogdan

**Video Demo**
https://drive.google.com/file/d/1TZlVB8BkOLTM5D1pdVOfjFDkZJgcXzES/view?usp=drive_link

## Features

- **User Authentication** - Role-based access (Citizens, Authorized Personnel, Decision Makers)
- **Report Management** - Create, view, search, and update waste-related reports
- **Location-Based Search** - Find reports by neighborhood and city
- **Download Reports** - Export reports in CSV, HTML, and PDF formats
- **Real-time Updates** - Track report status and resolution details
- **Automated Report Generation** - Daily and monthly reports

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Login page: `http://localhost:3000/login.html`
   - Reports page: `http://localhost:3000/report.html`

## Available Neighborhoods for Testing

When searching by location, use these existing neighborhoods:

- **tatarasi**
- **pacurari**
- **copou** 
- **Alexandru cel bun**

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Reports
- `GET /report` - Get user's reports
- `POST /report` - Create new report
- `GET /report/id/:id` - Get specific report
- `GET /report/by/city/:city/neighborhood/:neighborhood` - Search by location
- `GET /report/download?format=csv|html|pdf` - Download reports
- `PUT /report/id/:id` - Update report (personnel/admin only)

## Project Structure

```
├── src/
│   ├── app.js              # Main application entry
│   ├── core/               # Core framework components
│   ├── models/             # Database models
│   ├── modules/            # Feature modules (auth, reports, etc.)
│   └── utils/              # Utility functions
├── Frontend/               # Static files (HTML, CSS, JS)
├── database/               # JSON database files
├── config/                 # Configuration files
└── reports/                # Generated reports
```

## Technologies Used

- **Backend**: Node.js with custom framework
- **Database**: MongoDB with JSON file storage
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: JWT tokens
- **Report Generation**: Puppeteer for PDF, json2csv for CSV

## Development

The application uses a custom Node.js framework with:
- Custom router and middleware system
- MongoDB integration
- Role-based authentication
- Static file serving

## Notes

- Server runs on port 3000 by default
- MongoDB connection required for full functionality
- Generated reports are stored in `/reports` directory
- Console logging available for debugging 