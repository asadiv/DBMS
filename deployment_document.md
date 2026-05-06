# MiniJira – Deployment Document

---

## 1. Application Overview

MiniJira is a project management web application inspired by Jira. It allows software teams to manage their projects, track stories and tasks, organize work into sprints, and collaborate through comments and attachments.

**Who would use it:** Small development teams who need a lightweight tool to track their work without the complexity of full Jira.

### API Endpoints

| Method | URL | Description | Example Response |
|--------|-----|-------------|-----------------|
| POST | `/api/auth/register` | Register a new user | `{"data": {"token": "...", "user": {...}}}` |
| POST | `/api/auth/login` | Login and get JWT token | `{"data": {"token": "...", "user": {...}}}` |
| GET | `/api/users/me` | Get current logged in user | `{"data": {"userID": 1, "username": "..."}}` |
| GET | `/api/users/search?q=` | Search users by name | `{"data": [...]}` |
| GET | `/api/projects` | Get all projects for current user | `{"data": [...]}` |
| POST | `/api/projects` | Create a new project | `{"data": {...}}` |
| GET | `/api/projects/:id` | Get project details | `{"data": {...}}` |
| DELETE | `/api/projects/:id` | Delete a project (owner only) | `{"data": {...}}` |
| POST | `/api/projects/:id/members` | Add a member to project | `{"data": {...}}` |
| DELETE | `/api/projects/:id/members/:userID` | Remove a member | `{"data": {...}}` |
| POST | `/api/projects/:id/managers` | Add a manager to project | `{"data": {...}}` |
| POST | `/api/projects/:id/repository` | Link a repository to project | `{"data": {...}}` |
| GET | `/api/projects/:id/sprints` | List sprints in a project | `{"data": [...]}` |
| POST | `/api/projects/:id/sprints` | Create a sprint | `{"data": {...}}` |
| PUT | `/api/projects/:id/sprints/:sprintID` | Update a sprint | `{"data": {...}}` |
| DELETE | `/api/projects/:id/sprints/:sprintID` | Delete a sprint | `{"data": {...}}` |
| GET | `/api/projects/:id/stories` | List stories in a project | `{"data": [...]}` |
| POST | `/api/projects/:id/stories` | Create a story | `{"data": {...}}` |
| PUT | `/api/projects/:id/stories/:storyID` | Update a story | `{"data": {...}}` |
| DELETE | `/api/projects/:id/stories/:storyID` | Delete a story | `{"data": {...}}` |
| GET | `/api/stories/:storyID/tasks` | List tasks in a story | `{"data": [...]}` |
| POST | `/api/stories/:storyID/tasks` | Create a task | `{"data": {...}}` |
| PUT | `/api/stories/:storyID/tasks/:taskID` | Update a task | `{"data": {...}}` |
| DELETE | `/api/stories/:storyID/tasks/:taskID` | Delete a task | `{"data": {...}}` |
| GET | `/api/tasks/:taskID/comments` | List comments on a task | `{"data": [...]}` |
| POST | `/api/tasks/:taskID/comments` | Add a comment | `{"data": {...}}` |
| DELETE | `/api/tasks/:taskID/comments/:commentID` | Delete a comment | `{"data": {...}}` |
| GET | `/api/tasks/:taskID/attachments` | List attachments on a task | `{"data": [...]}` |
| POST | `/api/tasks/:taskID/attachments` | Add an attachment link | `{"data": {...}}` |
| GET | `/health` | Health check | `{"status": "ok"}` |

---

## 2. Architecture Diagram

```
Browser
   |
   | HTTPS (port 443) / HTTP (port 80)
   v
EC2 Instance (Ubuntu 24.04, t3.micro)
   |
   +-- Docker Container: minijira-frontend (Nginx)
   |       - Serves React frontend files
   |       - Routes /api requests to backend container internally
   |
   +-- Docker Container: minijira-backend (Node.js)
           - Handles all API requests
           - Connects to RDS PostgreSQL database
           |
           v
       AWS RDS (PostgreSQL)
           - Stores all application data
```

Both containers are managed by Docker Compose on the same EC2 instance. Nginx acts as a reverse proxy, routing `/api` requests to the backend container internally so there is no mixed content issue.

---

## 3. Tools and Technologies

| Tool | Why We Used It |
|------|---------------|
| Linux (Ubuntu 24.04) | Operating system for the EC2 server |
| Node.js + Express | Backend API framework, lightweight and simple for REST APIs |
| React + Vite | Frontend framework for building the user interface |
| PostgreSQL | Relational database to store all app data |
| Git | Version control to track code changes |
| GitHub | Remote repository to store code and trigger the pipeline |
| Docker | Containerise the app so it runs the same everywhere |
| Docker Compose | Run multiple containers (frontend + backend) together |
| GitHub Actions | Automate testing and deployment on every push |
| AWS EC2 | Cloud server to host the application |
| AWS RDS | Managed PostgreSQL database in the cloud |
| AWS ECR | Store Docker images in the cloud |
| Nginx | Serve the React frontend and proxy API requests to backend |
| Jest + Supertest | Automated testing for backend API routes |

---

## 4. Local Setup Instructions

Follow these steps to run MiniJira on your own machine using Docker.

**Prerequisites:** You need Docker and Docker Compose installed.

**Step 1:** Clone the repository

```bash
git clone https://github.com/asadiv/DBMS.git
cd DBMS
```

**Step 2:** Create the backend environment file

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your local PostgreSQL details:

```
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/minijira
JWT_SECRET=anyrandomstring
```

**Step 3:** Set up the database

```bash
psql -U postgres -c "CREATE DATABASE minijira;"
psql -U postgres -d minijira -f ../db_tables.sql
```

**Step 4:** Run with Docker Compose

```bash
cd ..
docker-compose up --build
```

**Step 5:** Open in browser

Go to `http://localhost` in your browser. The app should load.

---

## 5. CI/CD Pipeline Explanation

The pipeline is defined in `.github/workflows/deploy.yml` and runs automatically on every push to the `main` branch.

**What triggers it:** Any `git push` to the `main` branch.

**Job 1 — test-backend:** Spins up a temporary PostgreSQL database, runs the database schema on it, then runs all Jest tests against that temporary database. If any test fails, all subsequent jobs are cancelled.

**Job 2 — test-frontend:** Installs frontend dependencies and runs frontend tests.

**Job 3 — deploy-backend:** Only runs if both test jobs pass. It builds a Docker image of the backend and pushes it to AWS ECR (the Docker image registry).

**Job 4 — deploy-frontend:** Only runs if both test jobs pass. It builds a Docker image of the frontend (Nginx + React build) and pushes it to AWS ECR.

**Job 5 — deploy-ec2:** Only runs after jobs 3 and 4 complete successfully. It SSHes into the EC2 instance, pulls the latest Docker images from ECR, and restarts both containers using Docker Compose.

**If a test fails:** The deploy jobs never run. The server keeps running the previous working version. No broken code ever reaches production.
<img width="1245" height="465" alt="deploy succes" src="https://github.com/user-attachments/assets/853ba640-3ce8-4857-9f19-1983cad8dfc6" />

---

## 6. Deployment Steps

These are the exact steps taken to deploy MiniJira on AWS EC2.

**Step 1:** Launch EC2 instance on AWS Console — Ubuntu 24.04 LTS, t2.micro, created a key pair and downloaded the `.pem` file. Set security group to allow ports 22, 80, and 443.

**Step 2:** Connect to the instance

```bash
chmod 400 minijiraEC2.pem
ssh -i minijiraEC2.pem ubuntu@13.234.34.103
```

**Step 3:** Install Docker

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

Log out and back in to apply group changes.

**Step 4:** Install AWS CLI and configure credentials

```bash
sudo apt-get install -y awscli
aws configure
```

Entered AWS Access Key ID, Secret Key, and region `ap-south-1`.

**Step 5:** Clone the repository

```bash
git clone https://github.com/asadiv/DBMS.git
cd DBMS
```

**Step 6:** Create backend environment file

```bash
nano backend/.env
```

Added the following:

```
PORT=5000
DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/minijira?sslmode=no-verify
JWT_SECRET=secretkey
```

**Step 7:** Generate SSL certificate for HTTPS

```bash
mkdir -p ~/DBMS/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ~/DBMS/ssl/key.pem \
  -out ~/DBMS/ssl/cert.pem \
  -subj "/CN=minijira"
sudo chown ubuntu:ubuntu ~/DBMS/ssl/cert.pem ~/DBMS/ssl/key.pem
```

**Step 8:** Set up AWS RDS

Created a PostgreSQL database on AWS RDS (db.t3.micro, free tier). Configured the RDS security group to allow inbound PostgreSQL connections from the EC2 security group only. Connected and ran the schema:

```bash
psql "postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/minijira?sslmode=no-verify" -f db_tables.sql
```

**Step 9:** Set up AWS ECR

Created two repositories on AWS ECR named `minijira-backend` and `minijira-frontend`.

**Step 10:** Add GitHub Secrets

Added the following secrets to the GitHub repository under Settings → Secrets → Actions:

- `EC2_HOST` — EC2 public IP
- `EC2_USER` — `ubuntu`
- `EC2_SSH_KEY` — contents of the `.pem` file
- `AWS_ACCESS_KEY_ID` — IAM user access key
- `AWS_SECRET_ACCESS_KEY` — IAM user secret key
- `AWS_REGION` — `ap-south-1`
- `S3_BUCKET` — S3 bucket name
- `CLOUDFRONT_DISTRIBUTION_ID` — CloudFront distribution ID

**Step 11:** Push code to trigger first deployment

```bash
git add .
git commit -m "add Docker support and CI/CD pipeline"
git push origin main
```

Watched the Actions tab — all 5 jobs turned green. Application went live.

**Step 12:** Verify the app is running

```bash
docker ps
curl http://localhost/health
```

---

## 7. Testing Evidence
<img width="883" height="471" alt="successful tests" src="https://github.com/user-attachments/assets/cc7863cf-12b0-4772-8385-d79eb4e7ead0" />

**Backend tests passing (run locally or in pipeline):**

```bash
cd backend
npm test
```

Expected output:
```
PASS tests/auth.test.js
  Auth Routes
    POST /api/auth/register
      ✓ should register a new user successfully
      ✓ should fail if email is already registered
    POST /api/auth/login
      ✓ should login successfully with correct credentials
      ✓ should fail login with wrong password
      ✓ should fail login with non-existent email

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

**GitHub Actions pipeline green:** All 5 jobs show green checkmarks in the Actions tab at `github.com/asadiv/DBMS/actions`.

**Live app responding from EC2:**

```bash
curl http://13.234.34.103
```

**Containers running on EC2:**

```bash
docker ps
```

Shows both `minijira-backend` and `minijira-frontend` containers with status `Up`.

---

## 8. Challenges and Solutions

**Challenge 1 — Tests failed**

After deploying the backend tests failed not because there was error in code, but the response that we were expecting in our tests were a bit different like when user is successfully created our code returned 201 while test expected 200.

**Solution:** We made sure that our tests expect the right response that matches our code.
<img width="770" height="676" alt="test failed" src="https://github.com/user-attachments/assets/d6d2c63e-2dc2-4997-ac88-8a72c3a93548" />

**Challenge 2 container already exists**

one if our deployments failed due to a certain issue and after solving the issue when i pushed code again it failed saying container already exists.

**Solution:** wrote extra code in deploy.yml to stop and remove a container before making another one, that way the issue was solved.

**Challenge 3 — Docker Image Not Found on EC2**

After the GitHub Actions pipeline said it successfully pushed the Docker image to ECR, the EC2 instance still could not find it. Running `docker ps` and `docker images` showed nothing.

**Solution:** The EC2 instance did not have AWS CLI properly configured to authenticate with ECR. We ran `aws configure` on EC2 with the IAM credentials, which allowed `docker pull` from ECR to work correctly.

---

## 9. Lessons Learned

1. **Docker Compose makes multi-container apps much easier.** Before using Compose, we were manually running `docker run` commands for each container and managing them separately. Compose lets you define everything in one file and start/stop everything with one command.

2. **HTTPS is not optional in production.** We learned this the hard way when the browser blocked all API calls because the frontend was on HTTPS and the backend was on HTTP. In real deployments, everything must be HTTPS.

3. **GitHub Secrets and environment variables are not the same thing.** Secrets are only available inside GitHub Actions jobs — they are not automatically transferred to your server. The `.env` file on the server must be created separately.

4. **`--restart always` is essential for production.** Without it, if the server ever reboots (due to an AWS maintenance event or anything else), your containers stay stopped and your app goes offline. With `--restart always` in Docker Compose, containers come back up automatically.
