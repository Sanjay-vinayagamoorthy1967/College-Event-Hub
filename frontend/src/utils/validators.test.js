import { describe, it, expect } from 'vitest';
import { validatePhoneNumber } from './validators';

describe('validatePhoneNumber', () => {
  it('should return error if phone is empty', () => {
    expect(validatePhoneNumber('')).toBe('Phone number is required');
    expect(validatePhoneNumber(null)).toBe('Phone number is required');
  });

  it('should return error if phone contains non-numeric characters', () => {
    expect(validatePhoneNumber('987654321a')).toBe('Phone number must contain only numbers');
    expect(validatePhoneNumber('987 6543210')).toBe('Phone number must contain only numbers');
    expect(validatePhoneNumber('98-76543210')).toBe('Phone number must contain only numbers');
  });

  it('should return error if phone is not exactly 10 digits', () => {
    expect(validatePhoneNumber('987654321')).toBe('Please enter a valid 10-digit Indian mobile number');
    expect(validatePhoneNumber('98765432101')).toBe('Please enter a valid 10-digit Indian mobile number');
  });

  it('should return error if phone does not start with 6, 7, 8, or 9', () => {
    expect(validatePhoneNumber('5876543210')).toBe('Please enter a valid 10-digit Indian mobile number');
    expect(validatePhoneNumber('1234567890')).toBe('Please enter a valid 10-digit Indian mobile number');
  });

  it('should return true for valid phone numbers', () => {
    expect(validatePhoneNumber('9876543210')).toBe(true);
    expect(validatePhoneNumber('6876543210')).toBe(true);
  });
});
