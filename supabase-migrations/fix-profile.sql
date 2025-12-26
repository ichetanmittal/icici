-- Insert the missing user profile for the registered user
INSERT INTO user_profiles (
  user_id,
  role,
  company_name,
  contact_person,
  phone_number,
  treasury_balance,
  current_balance
) VALUES (
  'f346f77a-8274-406c-adc9-a32719d23c99',
  'dbs_bank_maker',
  'DBS',
  'chetandbs',
  '42342',
  100000,
  100000
)
ON CONFLICT (user_id) DO NOTHING;
