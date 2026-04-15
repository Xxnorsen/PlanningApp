/**
 * Unit tests for auth form validation helpers.
 * These are the same functions used in LoginScreen and SignInScreen.
 */

// ── Helpers (copied from screens to keep tests self-contained) ────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(v: string) {
  if (!v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address.';
  return '';
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(v)) return 'Add at least one number.';
  if (!/[^a-zA-Z0-9]/.test(v)) return 'Add at least one symbol (!@#$…).';
  return '';
}

// ── validateName ─────────────────────────────────────────────────────────────

describe('validateName', () => {
  it('returns error for empty string', () => {
    expect(validateName('')).toBe('Full name is required.');
  });

  it('returns error for whitespace only', () => {
    expect(validateName('   ')).toBe('Full name is required.');
  });

  it('returns error for single character', () => {
    expect(validateName('A')).toBe('Name must be at least 2 characters.');
  });

  it('passes for valid name', () => {
    expect(validateName('Alex Rivera')).toBe('');
  });

  it('passes for 2-character name', () => {
    expect(validateName('Al')).toBe('');
  });

  it('trims whitespace before checking length', () => {
    expect(validateName(' A ')).toBe('Name must be at least 2 characters.');
  });
});

// ── validateEmail ─────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required.');
  });

  it('returns error for missing @ symbol', () => {
    expect(validateEmail('notanemail')).toBe('Enter a valid email address.');
  });

  it('returns error for missing domain', () => {
    expect(validateEmail('user@')).toBe('Enter a valid email address.');
  });

  it('returns error for missing TLD', () => {
    expect(validateEmail('user@domain')).toBe('Enter a valid email address.');
  });

  it('passes for valid email', () => {
    expect(validateEmail('hello@example.com')).toBe('');
  });

  it('passes for email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toBe('');
  });

  it('trims whitespace before validating', () => {
    expect(validateEmail('  hello@example.com  ')).toBe('');
  });
});

// ── validatePassword ──────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required.');
  });

  it('returns error when shorter than 8 characters', () => {
    expect(validatePassword('Abc1!')).toBe('Must be at least 8 characters.');
  });

  it('returns error when no uppercase letter', () => {
    expect(validatePassword('abcdefg1!')).toBe('Add at least one uppercase letter.');
  });

  it('returns error when no number', () => {
    expect(validatePassword('Abcdefg!')).toBe('Add at least one number.');
  });

  it('returns error when no special character', () => {
    expect(validatePassword('Abcdefg1')).toBe('Add at least one symbol (!@#$…).');
  });

  it('passes for strong password', () => {
    expect(validatePassword('SecureP@ss1')).toBe('');
  });

  it('passes with various special characters', () => {
    expect(validatePassword('MyPass#99')).toBe('');
    expect(validatePassword('Hello$123')).toBe('');
    expect(validatePassword('Test_Pass1')).toBe('');
  });
});
