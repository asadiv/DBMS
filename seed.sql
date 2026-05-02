-- Seed data for MiniJira (run AFTER db_tables.sql)
-- Passwords below are bcrypt hashes for "password123"
-- Generated with: bcrypt.hash('password123', 10)

INSERT INTO "user" (username, email, password) VALUES
  ('alice', 'alice@example.com', '$2b$10$wH8JhZ7pYbY4y3jH/bYj2.0Q8fQF6/3M7C2cM/1jY8vEtFq5pY1ay'),
  ('bob',   'bob@example.com',   '$2b$10$wH8JhZ7pYbY4y3jH/bYj2.0Q8fQF6/3M7C2cM/1jY8vEtFq5pY1ay');

INSERT INTO project (ownerID, projectTitle, projectDescript) VALUES
  (1, 'Demo Project', 'A sample project to explore MiniJira');

INSERT INTO works (userID, projectID) VALUES (1, 1), (2, 1);
INSERT INTO manages (userID, projectID) VALUES (1, 1);

INSERT INTO sprint (projectID, title, goal, deadline) VALUES
  (1, 'Sprint 1', 'Initial setup and onboarding', CURRENT_DATE + INTERVAL '14 days');

INSERT INTO story (projectID, storyTitle, storyDescript, storyDeadline) VALUES
  (1, 'User Authentication', 'Allow users to register and log in', CURRENT_TIMESTAMP + INTERVAL '10 days'),
  (1, 'Project Dashboard', 'Show all projects belonging to the user', CURRENT_TIMESTAMP + INTERVAL '15 days');

INSERT INTO task (storyID, sprintID, assignedTo, taskDescript, taskDeadline, taskStatus) VALUES
  (1, 1, 1, 'Implement registration form', CURRENT_TIMESTAMP + INTERVAL '5 days', 'in-progress'),
  (1, 1, 2, 'Implement login form', CURRENT_TIMESTAMP + INTERVAL '5 days', 'to-do'),
  (2, 1, 2, 'Build dashboard layout', CURRENT_TIMESTAMP + INTERVAL '7 days', 'to-do');

INSERT INTO "comment" (userID, taskID, commentTxt) VALUES
  (1, 1, 'Started working on this'),
  (2, 1, 'Looks good so far!');
