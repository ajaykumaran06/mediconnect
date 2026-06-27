/**
 * Validates required environment variables at startup.
 * Prevents silent failures from missing config.
 */
const REQUIRED_VARS = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
];

const OPTIONAL_VARS = [
  { key: 'RESEND_API_KEY', feature: 'Email notifications' },
  { key: 'EMAIL_FROM',     feature: 'Email sender address' },
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error('\n❌  Missing required environment variables:');
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error('\nCopy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }

  // Warn about optional vars (degraded functionality, not a crash)
  OPTIONAL_VARS.forEach(({ key, feature }) => {
    if (!process.env[key]) {
      console.warn(`⚠️   ${key} not set — ${feature} will be disabled.`);
    }
  });

  // Validate JWT_SECRET length (must be ≥ 32 chars for security)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌  JWT_SECRET must be at least 32 characters long.');
    process.exit(1);
  }

  console.log('✅  Environment validated successfully.');
}

module.exports = { validateEnv };
