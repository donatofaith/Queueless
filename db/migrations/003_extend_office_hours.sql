-- Extend pilot office hours to 8 PM and keep future offices consistent.

ALTER TABLE offices
  ALTER COLUMN closes_at SET DEFAULT '20:00';

UPDATE offices
SET closes_at = '20:00'
WHERE closes_at = '16:00';
