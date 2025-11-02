-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL CHECK (type IN ('article', 'worksheet', 'audio', 'video', 'external')),
    category TEXT NOT NULL,
    file_url TEXT,
    external_url TEXT,
    read_time_minutes INTEGER,
    duration_minutes INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_time TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, event_id)
);

-- Enable RLS on resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resources
CREATE POLICY "Resources are viewable by everyone" ON resources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all resources" ON resources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all events" ON events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Enable RLS on event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_registrations
CREATE POLICY "Users can view their own registrations" ON event_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" ON event_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own registrations" ON event_registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample resources data
INSERT INTO resources (title, description, content, type, category, read_time_minutes, featured) VALUES
('Understanding Anxiety: A Complete Guide', 'Learn about anxiety disorders, symptoms, and coping strategies in this comprehensive guide.', 'Anxiety is a normal human emotion that everyone experiences...', 'article', 'Mental Health Education', 15, true),
('Depression Self-Assessment Worksheet', 'A structured worksheet to help you track your mood and identify patterns.', NULL, 'worksheet', 'Self-Assessment', NULL, false),
('Mindfulness Meditation for Beginners', 'A guided introduction to mindfulness meditation techniques.', NULL, 'audio', 'Mindfulness', NULL, false),
('Stress Management Techniques', 'Practical strategies for managing stress in daily life.', 'Stress is an inevitable part of life, but how we handle it...', 'article', 'Stress Management', 12, true),
('Sleep Hygiene Checklist', 'A practical checklist to improve your sleep quality and establish healthy sleep habits.', NULL, 'worksheet', 'Sleep Health', NULL, false),
('Breathing Exercises for Anxiety', 'Simple breathing techniques to help manage anxiety symptoms.', NULL, 'video', 'Anxiety Management', 8, true),
('Crisis Support Hotlines', 'Important contact information for mental health crisis support.', NULL, 'external', 'Crisis Resources', NULL, true);

UPDATE resources SET 
    file_url = '/resources/worksheets/depression-assessment.pdf' 
    WHERE title = 'Depression Self-Assessment Worksheet';

UPDATE resources SET 
    file_url = '/resources/audio/mindfulness-intro.mp3',
    duration_minutes = 20
    WHERE title = 'Mindfulness Meditation for Beginners';

UPDATE resources SET 
    file_url = '/resources/worksheets/sleep-hygiene.pdf'
    WHERE title = 'Sleep Hygiene Checklist';

UPDATE resources SET 
    file_url = '/resources/videos/breathing-exercises.mp4',
    duration_minutes = 8
    WHERE title = 'Breathing Exercises for Anxiety';

UPDATE resources SET 
    external_url = 'https://988lifeline.org/'
    WHERE title = 'Crisis Support Hotlines';

-- Insert sample events data
INSERT INTO events (title, description, event_date, event_time, type, location, max_attendees) VALUES
('Mental Health Awareness Workshop', 'Join us for an interactive workshop on mental health awareness and self-care strategies.', '2025-02-15 14:00:00+00', '2:00 PM - 4:00 PM', 'Workshop', 'Community Center Room A', 30),
('Meditation Circle', 'A weekly meditation session for stress relief and mindfulness practice.', '2025-02-08 10:00:00+00', '10:00 AM - 11:00 AM', 'Group Session', 'Wellness Center', 15),
('Support Group: Anxiety Management', 'A safe space to share experiences and learn coping strategies for anxiety.', '2025-02-12 18:00:00+00', '6:00 PM - 7:30 PM', 'Support Group', 'Conference Room B', 12),
('Stress Management Seminar', 'Learn evidence-based techniques for managing stress in academic and personal life.', '2025-02-20 16:00:00+00', '4:00 PM - 5:30 PM', 'Seminar', 'Auditorium', 50),
('Virtual Coffee Chat: Peer Support', 'An informal virtual meetup for peer support and community building.', '2025-02-10 15:00:00+00', '3:00 PM - 4:00 PM', 'Virtual', 'Zoom Link Provided', 25),
('Art Therapy Session', 'Express yourself through art in this therapeutic and creative session.', '2025-02-18 13:00:00+00', '1:00 PM - 3:00 PM', 'Therapy Session', 'Art Studio', 8);