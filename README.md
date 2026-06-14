# Hostel Management System

## Overview

Hostel Management System is a backend-driven hostel administration platform designed to simplify student management, room allocation, complaint handling, fee tracking, and operational monitoring.

The system provides RESTful APIs for managing hostel operations while maintaining structured relationships between students, rooms, complaints, and administrative activities.

---

## Features

### Student Management

* Student registration and profile management
* Academic and personal information tracking
* Internship and skill information management
* Student activity monitoring

### Room Allocation

* Room assignment and reallocation
* Room capacity validation
* Occupancy tracking
* Allocation status management

### Complaint Management

* Complaint registration and tracking
* Status updates and resolution workflow
* Student complaint history

### Fee Management

* Fee record maintenance
* Payment tracking
* Financial record management

### Activity Logging

* Administrative activity tracking
* Student operation history
* Allocation and status change logs

### Database Optimization

* MongoDB indexing for efficient queries
* Relationship-based data modeling using Mongoose
* Structured document design

---

## Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### API Architecture

* RESTful APIs
* MVC Architecture

---

## Project Structure

```text
Hostel-Management-System/
│
├── app.js
├── package.json
├── .gitignore
├── .env.example
│
├── controllers/
│   ├── studentController.js
│   ├── roomController.js
│   ├── complaintController.js
│   └── ...
│
├── models/
│   ├── Student.js
│   ├── Room.js
│   ├── Complaint.js
│   └── ...
│
├── routes/
│   ├── studentRoutes.js
│   ├── roomRoutes.js
│   ├── complaintRoutes.js
│   └── ...
│
└── config/
```

---

## API Modules

### Student APIs

* Create Student
* Update Student
* Delete Student
* Fetch Student Details

### Room APIs

* Allocate Room
* Reallocate Room
* Manage Occupancy
* Room Availability Tracking

### Complaint APIs

* Register Complaint
* Update Complaint Status
* Resolve Complaints
* Complaint History

### Administrative APIs

* Activity Logging
* Hostel Operations Management

---

## Database Design

The application uses MongoDB with Mongoose schemas and relationship-based references to manage:

* Students
* Rooms
* Complaints
* Allocations
* Activity Logs

The system also implements database indexing to improve query performance and scalability.

---

## Future Enhancements

* JWT Authentication
* Role-Based Access Control (Admin / Warden / Student)
* Pagination and Advanced Filtering
* Dashboard Analytics
* Email Notifications
* Docker Deployment
* Cloud Hosting

---

## Setup

### Install Dependencies

```bash
npm install
```

### Create Environment File

Create a `.env` file using:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

### Start Server

```bash
npm start
```

---

## Author

Akshat Goyal
