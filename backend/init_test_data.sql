-- AI Job Agents Platform - Test Data Initialization
-- This script populates the database with sample data for testing

-- Insert test companies
INSERT INTO companies (name, location, website, contact_email, contact_phone, created_at, updated_at) VALUES
('TechCorp GmbH', 'Berlin', 'https://techcorp.de', 'jobs@techcorp.de', '+49-30-123456', NOW(), NOW()),
('DataFlow AG', 'Munich', 'https://dataflow.com', 'careers@dataflow.com', '+49-89-987654', NOW(), NOW()),
('WebStudio AG', 'Hamburg', 'https://webstudio.de', 'jobs@webstudio.de', '+49-40-555666', NOW(), NOW()),
('EnterpriseGmbH', 'Frankfurt', 'https://enterprise.de', 'hr@enterprise.de', '+49-69-111222', NOW(), NOW()),
('CloudOps AG', 'Cologne', 'https://cloudops.com', 'jobs@cloudops.com', '+49-221-333444', NOW(), NOW()),
('AIInnovation GmbH', 'Stuttgart', 'https://aiinnovation.de', 'hiring@aiinnovation.de', '+49-711-777888', NOW(), NOW());

-- Insert test jobs from LinkedIn
INSERT INTO jobs (title, company_id, location, job_type, domain, description, link, email, phone, source, status, score, salary_min, salary_max, salary_currency, created_at, updated_at) VALUES
('Senior Python Developer', 1, 'Berlin', 'Vollzeit', 'Software', 'We are looking for an experienced Python developer with strong backend skills. Must have 5+ years experience with FastAPI or Django.', 'https://linkedin.com/jobs/001', 'jobs@techcorp.de', '+49-30-123456', 'linkedin', 'en_cours', 8.5, 50000, 80000, 'EUR', NOW() - INTERVAL '2 days', NOW()),
('Data Science Internship', 2, 'Munich', 'Praktikum', 'Data', 'Join our data science team as an intern. Work with Python, pandas, and machine learning models. Great learning opportunity.', 'https://linkedin.com/jobs/002', 'careers@dataflow.com', '+49-89-987654', 'linkedin', 'en_cours', 7.2, 400, 600, 'EUR', NOW() - INTERVAL '3 days', NOW()),
('JavaScript Developer', 3, 'Hamburg', 'Werkstudent', 'Software', 'Work on modern web applications using React and Node.js. Flexible hours for students.', 'https://linkedin.com/jobs/003', 'jobs@webstudio.de', '+49-40-555666', 'linkedin', 'envoye', 6.8, 450, 550, 'EUR', NOW() - INTERVAL '5 days', NOW()),
('Full Stack Developer', 1, 'Berlin', 'Vollzeit', 'Software', 'Looking for a full stack engineer experienced in React and Python. Work on our main product.', 'https://linkedin.com/jobs/004', 'jobs@techcorp.de', '+49-30-123456', 'linkedin', 'entretien', 8.9, 55000, 85000, 'EUR', NOW() - INTERVAL '1 day', NOW());

-- Insert test jobs from Xing
INSERT INTO jobs (title, company_id, location, job_type, domain, description, link, email, phone, source, status, score, salary_min, salary_max, salary_currency, created_at, updated_at) VALUES
('SAP Developer', 4, 'Frankfurt', 'Vollzeit', 'SAP', 'Looking for an experienced SAP developer with ABAP skills. Immediate start available.', 'https://xing.com/jobs/101', 'hr@enterprise.de', '+49-69-111222', 'xing', 'en_cours', 7.8, 55000, 85000, 'EUR', NOW() - INTERVAL '2 days', NOW()),
('IT Support Praktikant', 6, 'Stuttgart', 'Praktikum', 'IT', 'Support our IT infrastructure team. Good opportunity to learn about enterprise systems.', 'https://xing.com/jobs/102', 'hiring@aiinnovation.de', '+49-711-777888', 'xing', 'en_cours', 5.5, 350, 450, 'EUR', NOW() - INTERVAL '4 days', NOW()),
('DevOps Engineer', 5, 'Cologne', 'Vollzeit', 'Cloud', 'Build and maintain our cloud infrastructure on AWS. Docker and Kubernetes experience required.', 'https://xing.com/jobs/103', 'jobs@cloudops.com', '+49-221-333444', 'xing', 'refus', 6.2, 60000, 90000, 'EUR', NOW() - INTERVAL '10 days', NOW());

-- Insert test jobs from Indeed
INSERT INTO jobs (title, company_id, location, job_type, domain, description, link, email, phone, source, status, score, salary_min, salary_max, salary_currency, created_at, updated_at) VALUES
('Machine Learning Engineer', 6, 'Stuttgart', 'Vollzeit', 'Data', 'Build ML models for enterprise applications. Experience with TensorFlow and PyTorch required.', 'https://indeed.com/jobs/201', 'hiring@aiinnovation.de', '+49-711-777888', 'indeed', 'en_cours', 9.0, 60000, 90000, 'EUR', NOW() - INTERVAL '1 day', NOW()),
('DevOps Werkstudent', 5, 'Cologne', 'Werkstudent', 'Cloud', 'Support our cloud operations team. Learn modern DevOps practices. Flexible hours for students.', 'https://indeed.com/jobs/202', 'jobs@cloudops.com', '+49-221-333444', 'indeed', 'en_cours', 6.5, 480, 600, 'EUR', NOW() - INTERVAL '6 days', NOW()),
('Backend Developer', 1, 'Berlin', 'Vollzeit', 'Software', 'Develop backend services using Python and FastAPI. Scale our platform to millions of users.', 'https://indeed.com/jobs/203', 'jobs@techcorp.de', '+49-30-123456', 'indeed', 'entretien', 8.1, 52000, 82000, 'EUR', NOW() - INTERVAL '2 days', NOW());

-- Insert test jobs from Agentur für Arbeit
INSERT INTO jobs (title, company_id, location, job_type, domain, description, link, email, phone, source, status, score, salary_min, salary_max, salary_currency, created_at, updated_at) VALUES
('Wirtschaftsinformatiker', 4, 'Frankfurt', 'Vollzeit', 'IT', 'Join our IT department. Work on enterprise information systems. Great benefits and career development.', 'https://arbeitsagentur.de/jobs/301', 'hr@enterprise.de', '+49-69-111222', 'agentur', 'en_cours', 7.5, 45000, 65000, 'EUR', NOW() - INTERVAL '3 days', NOW()),
('IT-Projektmanager', 1, 'Berlin', 'Vollzeit', 'IT', 'Lead IT projects from conception to deployment. Scrum experience required. Attractive salary.', 'https://arbeitsagentur.de/jobs/302', 'jobs@techcorp.de', '+49-30-123456', 'agentur', 'en_cours', 8.3, 58000, 78000, 'EUR', NOW() - INTERVAL '4 days', NOW());

-- Display inserted data
SELECT 'COMPANIES CREATED:' as info;
SELECT COUNT(*) as count FROM companies;

SELECT 'JOBS CREATED:' as info;
SELECT COUNT(*) as count FROM jobs;

SELECT 'JOBS BY SOURCE:' as info;
SELECT source, COUNT(*) as count FROM jobs GROUP BY source;

SELECT 'JOBS BY STATUS:' as info;
SELECT status, COUNT(*) as count FROM jobs GROUP BY status;

SELECT 'JOBS BY DOMAIN:' as info;
SELECT domain, COUNT(*) as count FROM jobs GROUP BY domain;

SELECT 'SAMPLE JOB:' as info;
SELECT id, title, location, job_type, domain, source, status, score FROM jobs LIMIT 1;
