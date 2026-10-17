-- Seed officer and supervisor accounts with BCrypt hashed password "officer123"
UPDATE enterprise_users 
SET password_hash = '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG',
    role = 'FIELD_OFFICER'
WHERE email = 'officer@civicsync.gov.in';

UPDATE enterprise_users 
SET password_hash = '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG',
    role = 'SUPERVISOR'
WHERE email = 'supervisor@civicsync.gov.in';
