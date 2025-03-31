-- Create enum for post status
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');

-- Add new columns to posts table
ALTER TABLE posts
ADD COLUMN scheduled_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN status post_status DEFAULT 'published';

-- Add index for faster querying of scheduled posts
CREATE INDEX idx_posts_scheduled_time ON posts(scheduled_time) WHERE is_scheduled = TRUE;

-- Add comment to explain the columns
COMMENT ON COLUMN posts.scheduled_time IS 'When the post should be published';
COMMENT ON COLUMN posts.is_scheduled IS 'Whether the post is scheduled for future publication';
COMMENT ON COLUMN posts.status IS 'Current status of the post: draft, scheduled, or published';

-- Update existing posts to have 'published' status
UPDATE posts SET status = 'published' WHERE status IS NULL; 