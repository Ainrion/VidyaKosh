-- Create a default school if none exists
INSERT INTO schools (name, address, email)
SELECT 'Default School', 'Sample Address', 'admin@defaultschool.edu'
WHERE NOT EXISTS (SELECT 1 FROM schools LIMIT 1);
