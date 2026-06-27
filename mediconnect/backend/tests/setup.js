// tests/setup.js
// Set environment variables before any test module loads

process.env.NODE_ENV       = 'test';
process.env.JWT_SECRET     = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.SUPABASE_URL   = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.PORT = '5001'; // Use different port so tests don't clash with dev server
