# MiniJira
-
A small full-stack project management app inspired by Jira. Built with **Node.js + Express + PostgreSQL** on the backend and **React (Vite)** on the frontend, using raw SQL via the `pg` package and JWT-based authentication.

The frontend is fully responsive and works on phones as well as desktop.

## Features

- User registration & login (JWT, bcrypt)
- Projects with **owner / manager / member** roles
- Stories grouped under projects, with status derived from their tasks
- Sprints (time-boxed cycles) per project
- Tasks belonging to one story and one sprint, assigned to one user
- Comments and link-style attachments per task
- Optional repository linkage per project (one-to-one)

---

## Project structure

```
minijira/
├── backend/
│   ├── db.js                  # pg.Pool connection
│   ├── server.js              # Express app entry
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── roles.js           # Owner / manager / member helpers
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── projects.js
│       ├── sprints.js
│       ├── stories.js
│       ├── tasks.js
│       ├── taskDetail.js
│       ├── comments.js
│       └── attachments.js
├── frontend/
│   └── src/
│       ├── api/               # axios calls per resource
│       ├── pages/             # one file per page
│       ├── components/        # reusable UI components
│       ├── auth.js            # token + user storage helpers
│       └── App.jsx
├── db_tables.sql              # provided schema
├── seed.sql                   # optional seed data
└── README.md
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 13+

---

## Database setup

1. Create a database (e.g. `minijira`):

   ```bash
   createdb minijira
   ```

2. Apply the schema:

   ```bash
   psql -d minijira -f db_tables.sql
   ```

3. (Optional) Apply the seed data:

   ```bash
   psql -d minijira -f seed.sql
   ```

   The seed users have password `password123`.

---

## Backend

```bash
cd backend
cp .env.example .env   # then edit values
npm install
npm run dev            # or: npm start
```

`.env` keys:

```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/minijira
JWT_SECRET=your_secret_key
```

The API is served at `http://localhost:5000/api`.

### API summary

| Resource | Path |
|----------|------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET /api/users/me`, `GET /api/users/search?q=` |
| Projects | `GET/POST /api/projects`, `GET/DELETE /api/projects/:id` |
| Members | `POST/DELETE /api/projects/:id/members[/:userID]` |
| Managers | `POST/DELETE /api/projects/:id/managers[/:userID]` |
| Repository | `POST /api/projects/:id/repository` |
| Sprints | `GET/POST/PUT/DELETE /api/projects/:projectID/sprints[/:sprintID]` |
| Stories | `GET/POST/PUT/DELETE /api/projects/:projectID/stories[/:storyID]` |
| Tasks | `GET/POST/PUT/DELETE /api/stories/:storyID/tasks[/:taskID]`, `GET /api/tasks/:taskID` |
| Comments | `GET/POST/DELETE /api/tasks/:taskID/comments[/:commentID]` |
| Attachments | `GET/POST/DELETE /api/tasks/:taskID/attachments[/:attachID]` |

All non-auth endpoints require an `Authorization: Bearer <token>` header.

### Role rules

- **Owner only**: add/remove members, add/remove managers, delete project, link repository.
- **Owner or manager**: create/edit/delete sprints, stories, tasks.
- **Members (owner/manager/member)**: view everything, comment, add attachments.
- **Assigned member**: can update only `taskStatus` on their assigned task.

Story status is computed on the fly from its tasks (`done` if all done, `in-progress` if any in-progress, otherwise `to-do`).

---

## Frontend

```bash
cd frontend
cp .env.example .env   # optional; defaults are fine
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api` to the backend on port `5000`.

To build for production:

```bash
npm run build
```

The built files land in `frontend/dist`.

### Pages

| Route | Page |
|-------|------|
| `/login` | Login |
| `/register` | Register |
| `/` | Dashboard – list of your projects |
| `/projects/:id` | Project detail – stories, sprints, team, repository |
| `/projects/:id/stories/:storyID` | Story detail – tasks |
| `/tasks/:taskID` | Task detail – info, comments, attachments |

The JWT is stored in `localStorage` and attached to every request through an axios interceptor. If the API returns a 401, the client clears the session and redirects to `/login`.

---

## Quick test flow

1. Run `db_tables.sql` (and optionally `seed.sql`).
2. Start the backend (`npm run dev` in `backend/`).
3. Start the frontend (`npm run dev` in `frontend/`).
4. Open `http://localhost:5173`, register a new user, and create a project.
5. From the **Team** tab on a project, search for another user and add them as member or manager.
6. Create a sprint, a story, then create tasks under the story.
7. Open a task to add comments and attachments.
