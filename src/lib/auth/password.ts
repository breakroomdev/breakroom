import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hashes a plaintext password. Never store or log the plaintext value. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verifies a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= 8;
}
