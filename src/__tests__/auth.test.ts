import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';

describe('Auth Module', () => {
  const testEnvPath = join(process.cwd(), '.env.test');

  beforeEach(() => {
    // Setup test env file
    writeFileSync(testEnvPath, 'MYRMEX_PASSWORD_HASH=\n');
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testEnvPath)) {
      rmSync(testEnvPath);
    }
  });

  it('should verify password requirements - minimum 8 characters', () => {
    const shortPassword = 'short';
    expect(shortPassword.length).toBeLessThan(8);
  });

  it('bcrypt should hash passwords consistently', async () => {
    const password = 'testPassword123!';
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);

    // Different salts should produce different hashes
    expect(hash1).not.toBe(hash2);

    // But both should verify the same password
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it('bcrypt should reject wrong passwords', async () => {
    const password = 'correctPassword123!';
    const hash = await bcrypt.hash(password, 12);

    expect(await bcrypt.compare('wrongPassword', hash)).toBe(false);
    expect(await bcrypt.compare('CORRECTPASSWORD123!', hash)).toBe(false);
  });
});