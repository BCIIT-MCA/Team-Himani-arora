-- Migration to transform platform to Indian student-focused free mental health services
-- This replaces Western data with Indian student context and removes all pricing

-- First, fix availability_schedule format for existing counselors
UPDATE counselors 
SET availability_schedule = jsonb_build_object(
  'monday', ARRAY['09:00-17:00'],
  'tuesday', ARRAY['10:00-18:00'], 
  'wednesday', ARRAY['09:00-17:00'],
  'thursday', ARRAY['10:00-18:00'],
  'friday', ARRAY['09:00-16:00'],
  'saturday', ARRAY['10:00-14:00']
);

-- Remove pricing-related columns if they exist
ALTER TABLE counselors DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE counselors DROP COLUMN IF EXISTS session_price;
ALTER TABLE appointments DROP COLUMN IF EXISTS fee;
ALTER TABLE appointments DROP COLUMN IF EXISTS payment_status;

-- Clear existing Western counselors and add Indian student-focused counselors
DELETE FROM counselors;

INSERT INTO counselors (id, name, first_name, last_name, specialties, contact_method, bio, languages, is_active, availability_schedule, experience_years, rating, created_at, updated_at) VALUES
(gen_random_uuid(), 'Dr. Ananya Sharma', 'Ananya', 'Sharma', 
 ARRAY['Academic Stress', 'Board Exam Anxiety', 'Study Pressure', 'School Problems'],
 'video',
 'Specialized in helping school students with board exam stress, academic pressure, and anxiety disorders. Over 8 years experience with CBSE and state board students across India. Fluent in Hindi and English.',
 ARRAY['Hindi', 'English'], 
 true,
 jsonb_build_object(
   'monday', ARRAY['09:00-17:00'],
   'tuesday', ARRAY['10:00-18:00'],
   'wednesday', ARRAY['09:00-17:00'],
   'thursday', ARRAY['10:00-18:00'],
   'friday', ARRAY['09:00-16:00']
 ),
 8, 4.8, NOW(), NOW()),

(gen_random_uuid(), 'Dr. Rajesh Kumar', 'Rajesh', 'Kumar',
 ARRAY['Career Guidance', 'Study Stress', 'Academic Performance', 'Engineering Student Support'],
 'video',
 'Expert in helping college students with career confusion, study stress, and academic performance anxiety. Specialized in engineering and medical student mental health. 10+ years with Delhi University and IITs.',
 ARRAY['Hindi', 'English'],
 true,
 jsonb_build_object(
   'monday', ARRAY['10:00-18:00'],
   'tuesday', ARRAY['09:00-17:00'],
   'wednesday', ARRAY['10:00-18:00'],
   'thursday', ARRAY['09:00-17:00'],
   'friday', ARRAY['10:00-16:00'],
   'saturday', ARRAY['10:00-14:00']
 ),
 10, 4.7, NOW(), NOW()),

(gen_random_uuid(), 'Dr. Kavitha Nair', 'Kavitha', 'Nair',
 ARRAY['Exam Anxiety', 'Peer Pressure', 'Social Adjustment', 'South Indian Student Support'],
 'video',
 'Clinical psychologist specializing in exam anxiety, peer pressure, and social adjustment issues among students. Experienced with South Indian students and familiar with regional academic pressures.',
 ARRAY['Malayalam', 'English', 'Tamil'],
 true,
 jsonb_build_object(
   'monday', ARRAY['08:00-16:00'],
   'tuesday', ARRAY['09:00-17:00'],
   'wednesday', ARRAY['08:00-16:00'],
   'thursday', ARRAY['09:00-17:00'],
   'friday', ARRAY['08:00-15:00']
 ),
 7, 4.9, NOW(), NOW()),

(gen_random_uuid(), 'Dr. Arjun Singh', 'Arjun', 'Singh',
 ARRAY['Family Pressure', 'Substance Prevention', 'Cultural Identity', 'North Indian Student Support'],
 'video',
 'Specialized in helping students deal with family pressure, substance abuse prevention, and cultural identity issues. Experienced with North Indian student communities and family dynamics.',
 ARRAY['Punjabi', 'Hindi', 'English'],
 true,
 jsonb_build_object(
   'tuesday', ARRAY['09:00-17:00'],
   'wednesday', ARRAY['10:00-18:00'],
   'thursday', ARRAY['09:00-17:00'],
   'friday', ARRAY['10:00-18:00'],
   'saturday', ARRAY['09:00-15:00']
 ),
 6, 4.6, NOW(), NOW()),

(gen_random_uuid(), 'Dr. Meera Patel', 'Meera', 'Patel',
 ARRAY['JEE Stress', 'NEET Anxiety', 'Competitive Exams', 'Performance Anxiety', 'Study Burnout'],
 'video',
 'Expert in helping students with JEE, NEET, CAT and other competitive exam stress. Specialized in performance anxiety and study burnout. Gujarati and Hindi speaking counselor.',
 ARRAY['Gujarati', 'Hindi', 'English'],
 true,
 jsonb_build_object(
   'monday', ARRAY['09:00-17:00'],
   'wednesday', ARRAY['10:00-18:00'],
   'thursday', ARRAY['09:00-17:00'],
   'friday', ARRAY['10:00-18:00'],
   'saturday', ARRAY['10:00-16:00']
 ),
 7, 4.7, NOW(), NOW());

-- Clear existing resources and add Indian student-focused resources
DELETE FROM resources;

INSERT INTO resources (id, title, description, category, type, external_url, created_at, updated_at) VALUES
(gen_random_uuid(), 'CBSE Board Exam Stress Management Guide', 
 'Comprehensive guide for managing stress during CBSE board examinations. Includes study techniques, time management, and anxiety coping strategies.',
 'Academic Support',
 'external',
 'https://www.education.gov.in/en/cbse-student-support',
 NOW(), NOW()),

(gen_random_uuid(), 'JEE/NEET Preparation Mental Health Guide',
 'Mental health support guide for students preparing for competitive entrance exams. Covers burnout prevention, motivation maintenance, and dealing with failure.',
 'Exam Preparation',
 'external',
 'https://www.nta.ac.in/student-wellness',
 NOW(), NOW()),

(gen_random_uuid(), 'College Admission Anxiety Help',
 'Support guide for students dealing with college admission process anxiety, course selection confusion, and transition fears.',
 'Career Guidance',
 'external',
 'https://www.ugc.ac.in/student-support',
 NOW(), NOW()),

(gen_random_uuid(), 'Dealing with Academic Pressure in India',
 'Understanding and managing the unique academic pressures faced by Indian students, including family expectations and societal demands.',
 'Family Support',
 'external',
 'https://www.mhrd.gov.in/student-wellness',
 NOW(), NOW()),

(gen_random_uuid(), 'Student Suicide Prevention Resources',
 'Critical resources for students experiencing suicidal thoughts, including crisis contacts, warning signs, and immediate help options.',
 'Crisis Support',
 'external',
 'https://www.kiran.gov.in/student-support',
 NOW(), NOW()),

(gen_random_uuid(), 'Campus Life Adjustment Guide',
 'Guide for students adjusting to college life, hostel living, and being away from home for the first time.',
 'Campus Life',
 'external',
 'https://www.ugc.ac.in/campus-life-support',
 NOW(), NOW());

-- Clear existing events and add student-focused events
DELETE FROM events;

INSERT INTO events (id, title, description, event_date, event_time, location, type, max_attendees, created_at, updated_at) VALUES
(gen_random_uuid(), 'Pre-Board Exam Stress Management Workshop - Delhi',
 'Interactive workshop for Class 10 and 12 students to learn stress management techniques before board exams. Includes mindfulness, time management, and exam strategy.',
 '2024-01-15 10:00:00+05:30',
 '10:00',
 'Delhi Public School, Sector 24, Rohini, New Delhi',
 'Workshop',
 50,
 NOW(), NOW()),

(gen_random_uuid(), 'Mental Health Awareness Week - Mumbai University',
 'Week-long program with daily sessions on student mental health, peer support groups, and wellness activities for college students.',
 '2024-02-10 09:00:00+05:30',
 '09:00',
 'Mumbai University, Kalina Campus, Santacruz East',
 'Conference',
 200,
 NOW(), NOW()),

(gen_random_uuid(), 'Student Peer Support Circle - IIT Delhi',
 'Weekly peer support meetings for engineering students dealing with academic pressure, competition stress, and career anxiety.',
 '2024-01-20 16:00:00+05:30',
 '16:00',
 'IIT Delhi, Hauz Khas, New Delhi',
 'Support Group',
 30,
 NOW(), NOW()),

(gen_random_uuid(), 'Mindfulness for Students - Bangalore',
 'Introduction to mindfulness and meditation techniques specifically designed for students dealing with exam stress and study pressure.',
 '2024-02-05 14:00:00+05:30',
 '14:00',
 'Indian Institute of Science, Bangalore',
 'Workshop',
 40,
 NOW(), NOW()),

(gen_random_uuid(), 'Career Guidance Session - Chennai',
 'Group career counseling session for final year students dealing with career confusion and job market anxiety.',
 '2024-02-25 10:00:00+05:30',
 '10:00',
 'Anna University, Chennai',
 'Counseling',
 60,
 NOW(), NOW());

-- Note: Community posts will be created by users through the application interface

-- Update any existing appointment records to remove pricing
UPDATE appointments SET notes = COALESCE(notes, '') || ' [FREE student counseling service]' WHERE notes IS NOT NULL;
UPDATE appointments SET notes = '[FREE student counseling service]' WHERE notes IS NULL;

-- Add indexes for better performance with student data
CREATE INDEX IF NOT EXISTS idx_counselors_specialties ON counselors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Note: Notification templates will be configured through the application if needed

-- Note: System settings will be configured through the application if needed

COMMENT ON TABLE counselors IS 'Free counselors specializing in Indian student mental health';
COMMENT ON TABLE resources IS 'Educational and mental health resources for Indian students';
COMMENT ON TABLE events IS 'Student-focused mental health events and workshops';
COMMENT ON TABLE appointments IS 'Free counseling appointments for students - no payment required';