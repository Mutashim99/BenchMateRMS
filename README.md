# BenchMate - Resource Sharing and Management System

BenchMate is a full-stack web application that allows students to upload, browse, search, and download academic resources such as notes, assignments, and past papers. It helps maintain a structured platform for sharing study materials between seniors and juniors.

---

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React (Functional Components and Hooks)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JSON Web Tokens (JWT) for authentication

---

## Features

- User signup and login using JWT authentication
- Upload study resources with metadata
- View and download tracking
- Search across multiple fields
- Pagination support
- Unique view counting (per user or device)
- Protected API routes
- Organized resource categorization by university, department, semester, and course

---

## Environment Variables

Create a `.env` file in the backend directory with the following values:

- DATABASE_URL=postgresql://user:password@localhost:5432/benchmate
- JWT_SECRET=your_jwt_secret


---

## Setup Instructions

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
#FrontEnd
```bash
cd frontend
npm install
npm run dev
```
## API Endpoints
```bash
Authentication
Method	Endpoint	Description
POST	/api/auth/signup	Register a new user
POST	/api/auth/login	Login user and return JWT token
GET	/api/auth/me	Get details of the currently logged-in user
Resources
Method	Endpoint	Description
POST	/api/resources	Upload a new resource
GET	/api/resources	Retrieve paginated list of all resources
GET	/api/resources/:id	Retrieve a single resource by ID (counts unique view per user/device)
POST	/api/resources/:id/download	Track download count for the resource
GET	/api/resources/search?query=...&type=...&page=...	Search and filter resources
DELETE	/api/resources/:id	Delete a resource (only uploader can delete)

```

## License

- MIT License © 2025 BenchMate Project
