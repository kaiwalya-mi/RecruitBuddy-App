# Recruit Buddy

A candidate skill validation platform for technical recruiters.

## Overview

Recruit Buddy is a web application designed to help technical recruiters assess candidates' skills in Rust, TypeScript, and AI knowledge. The platform allows candidates to submit code samples and answer questions, while recruiters can view metrics and add custom questions.

## Features

- Code submission and evaluation for Rust and TypeScript
- AI knowledge assessment
- Recruiter dashboard with metrics visualization
- Custom question functionality

## Project Structure

- `frontend/`: React TypeScript application
- `backend/`: Rust server application

## Getting Started

### Prerequisites

- Node.js and npm for the frontend
- Rust and Cargo for the backend

### Running the Application

1. Start the backend server:
   ```
   cd backend
   cargo run
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Access the application:
   - Candidate Portal: http://localhost:3000/
   - Recruiter Dashboard: http://localhost:3000/recruiter