-- Seed data for Solace Connect
-- This migration adds initial sample data for demonstration and testing

BEGIN;

-- ========================================
-- SAMPLE COUNSELORS - DISABLED TO AVOID CONFLICT WITH INDIAN STUDENT DATA
-- ========================================

-- These Western counselor inserts are disabled to prevent overwriting the Indian student-focused 
-- counselor data from migration 20250130000000_fix_indian_student_data.sql
-- The Indian student migration contains counselors like Dr. Ananya Sharma, Dr. Rajesh Kumar, etc.
-- with proper availability_schedule format ["09:00-17:00"] and student specializations

-- Original counselor inserts commented out to prevent conflicts:
/*
INSERT INTO public.counselors (id, name, first_name, last_name, specialties, experience_years, rating, bio, qualifications, languages, availability_schedule, contact_method, is_active) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Dr. Sarah Johnson',
  'Sarah',
  'Johnson',
  ARRAY['Anxiety', 'Depression', 'Trauma', 'PTSD'],
  8,
  4.8,
  'Dr. Sarah Johnson is a licensed clinical psychologist with over 8 years of experience helping students navigate mental health challenges. She specializes in anxiety, depression, and trauma recovery.',
  'PhD in Clinical Psychology, Licensed Clinical Psychologist (LCP), Certified Trauma Specialist',
  ARRAY['English', 'Spanish'],
  '{"monday": ["09:00", "17:00"], "tuesday": ["09:00", "17:00"], "wednesday": ["09:00", "17:00"], "thursday": ["09:00", "17:00"], "friday": ["09:00", "15:00"]}',
  'video',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Dr. Michael Chen',
  'Michael',
  'Chen',
  ARRAY['Academic Stress', 'Career Counseling', 'Relationship Issues'],
  6,
  4.7,
  'Dr. Michael Chen focuses on helping students manage academic stress and make important life transitions. His approach combines cognitive-behavioral therapy with mindfulness techniques.',
  'PhD in Counseling Psychology, Licensed Professional Counselor (LPC)',
  ARRAY['English', 'Mandarin'],
  '{"monday": ["10:00", "18:00"], "tuesday": ["10:00", "18:00"], "wednesday": ["10:00", "18:00"], "thursday": ["10:00", "18:00"], "friday": ["10:00", "16:00"]}',
  'video',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Dr. Emily Rodriguez',
  'Emily',
  'Rodriguez',
  ARRAY['Eating Disorders', 'Body Image', 'Self-Esteem', 'Depression'],
  10,
  4.9,
  'Dr. Emily Rodriguez is a specialist in eating disorders and body image issues with a decade of experience. She provides compassionate, evidence-based treatment for students struggling with these challenges.',
  'PhD in Clinical Psychology, Certified Eating Disorder Specialist, Licensed Clinical Psychologist',
  ARRAY['English', 'Spanish', 'Portuguese'],
  '{"monday": ["08:00", "16:00"], "tuesday": ["08:00", "16:00"], "wednesday": ["08:00", "16:00"], "thursday": ["08:00", "16:00"], "friday": ["08:00", "14:00"]}',
  'video',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Dr. James Williams',
  'James',
  'Williams',
  ARRAY['Substance Abuse', 'Addiction Recovery', 'Group Therapy'],
  12,
  4.6,
  'Dr. James Williams specializes in substance abuse and addiction recovery. He leads group therapy sessions and provides individual counseling to help students overcome addiction challenges.',
  'PhD in Addiction Counseling, Licensed Addiction Counselor (LAC), Certified Group Therapist',
  ARRAY['English'],
  '{"monday": ["11:00", "19:00"], "tuesday": ["11:00", "19:00"], "wednesday": ["11:00", "19:00"], "thursday": ["11:00", "19:00"], "friday": ["11:00", "17:00"]}',
  'video',
  true
);
*/

-- ========================================
-- SAMPLE RESOURCES
-- ========================================

INSERT INTO public.resources (id, title, description, content, type, category, file_url, external_url, read_time_minutes, duration_minutes, featured, is_active) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440001',
  'Board Exam Stress Management for Indian Students',
  'FREE comprehensive guide to managing board exam anxiety, family pressure, and academic stress specific to Indian education system.',
  'Board exams are a critical milestone for Indian students that can cause significant stress. This guide provides practical strategies tailored for Indian students to manage anxiety before, during, and after board exams, including dealing with family expectations.',
  'article',
  'Academic Support',
  null,
  null,
  15,
  null,
  true,
  true
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  'Mindfulness Meditation in Hindi',
  'FREE guided meditation session in Hindi to help Indian students reduce stress and improve focus.',
  null,
  'audio',
  'Stress Management',
  'https://example.com/mindfulness-hindi-audio.mp3',
  null,
  null,
  20,
  true,
  true
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  'Daily Mood Tracking for Students (Hindi/English)',
  'FREE printable worksheet in Hindi and English to help Indian students track mood and identify stress patterns.',
  null,
  'worksheet',
  'Self Care',
  'https://example.com/student-mood-tracking.pdf',
  null,
  5,
  null,
  false,
  true
),
(
  '660e8400-e29b-41d4-a716-446655440004',
  'Indian Student Crisis Helplines - FREE 24/7 Support',
  'Important contact information for FREE crisis support specifically for Indian students, including KIRAN helpline.',
  'If you are experiencing a mental health crisis, please reach out for FREE help immediately. KIRAN Mental Health Helpline: 1800-599-0019 (FREE 24/7). iCALL Crisis Support: 9152987821 (FREE). These services are specifically available for Indian students dealing with academic stress, family pressure, and career anxiety.',
  'article',
  'Crisis Support',
  null,
  null,
  3,
  null,
  true,
  true
),
(
  '660e8400-e29b-41d4-a716-446655440005',
  'Healthy Sleep Habits for Indian Students',
  'FREE video guide on creating better sleep hygiene while dealing with heavy study schedules and academic pressure.',
  null,
  'video',
  'Self Care',
  'https://example.com/student-sleep-habits-video.mp4',
  null,
  null,
  25,
  false,
  true
);

-- ========================================
-- SAMPLE EVENTS
-- ========================================

INSERT INTO public.events (id, title, description, event_date, event_time, type, location, max_attendees, current_attendees, is_active) VALUES 
(
  '770e8400-e29b-41d4-a716-446655440001',
  'Board Exam Stress Management Workshop (FREE)',
  'FREE workshop for Indian students on managing board exam stress, family pressure, and academic anxiety. Covers breathing exercises, time management, and coping with parental expectations.',
  '2025-10-15 14:00:00+00',
  '2:00 PM - 4:00 PM IST',
  'Workshop',
  'Student Center Room 204',
  30,
  0,
  true
),
(
  '770e8400-e29b-41d4-a716-446655440002',
  'Student Mental Health Awareness Week: FREE Opening Ceremony',
  'FREE opening ceremony for Student Mental Health Awareness Week featuring speakers on Indian student challenges, KIRAN helpline information, and campus resources.',
  '2025-10-08 18:00:00+00',
  '6:00 PM - 8:00 PM IST',
  'Awareness Event',
  'Main Auditorium',
  200,
  0,
  true
),
(
  '770e8400-e29b-41d4-a716-446655440003',
  'Peer Support Group: Academic Pressure & Family Expectations (FREE)',
  'FREE weekly support group for students dealing with academic pressure and family expectations. Share experiences about career choices, exam stress, and relationship issues in a safe environment.',
  '2025-10-02 16:00:00+00',
  '4:00 PM - 5:30 PM IST',
  'Support Group',
  'Counseling Center Group Room',
  12,
  0,
  true
),
(
  '770e8400-e29b-41d4-a716-446655440004',
  'Mindfulness and Meditation Session (Hindi/English) - FREE',
  'FREE weekly guided meditation session in Hindi and English to help students reduce study stress and improve focus. Suitable for beginners.',
  '2025-10-04 12:00:00+00',
  '12:00 PM - 1:00 PM IST',
  'Wellness Session',
  'Quiet Garden Area',
  25,
  0,
  true
),
(
  '770e8400-e29b-41d4-a716-446655440005',
  'Balancing Studies and Mental Health for Indian Students (FREE)',
  'FREE workshop on maintaining mental health while pursuing academic excellence in the Indian education system. Covers study strategies, family communication, and self-care for students.',
  '2025-10-20 13:00:00+00',
  '1:00 PM - 3:00 PM IST',
  'Workshop',
  'Library Conference Room A',
  40,
  0,
  true
);

-- ========================================
-- SAMPLE COMMUNITY POSTS
-- ========================================

-- Note: Community posts and user-specific data will be created when users sign up
-- For now, we'll skip this section and focus on non-user-dependent data

-- ========================================
-- DATABASE SETUP COMPLETE
-- ========================================

-- The database is now ready with:
-- ✅ All necessary tables created
-- ✅ Row Level Security policies configured  
-- ✅ Sample counselors, resources, and events added
-- ✅ Proper indexes for performance

-- Next steps:
-- 1. Users can sign up through the application
-- 2. Community posts will be created by real users
-- 3. Appointments can be booked with the sample counselors
-- 4. Resources and events are ready for use

COMMIT;