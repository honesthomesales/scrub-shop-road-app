import { parseDateString, formatDate } from './dateUtils';

describe('dateUtils', () => {
  it('parses and formats a valid date string', () => {
    const input = '2025-07-01';
    const parsed = parseDateString(input);
    expect(parsed).toBeInstanceOf(Date);
    expect(formatDate(parsed, 'yyyy-MM-dd')).toBe('2025-07-01');
  });

  it('returns null for invalid date input', () => {
    const input = 'not-a-date';
    const parsed = parseDateString(input);
    expect(parsed).toBeNull();
  });

  it('handles null input in formatDate', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('handles invalid date in formatDate', () => {
    const invalidDate = new Date('not-a-date');
    expect(formatDate(invalidDate)).toBe('Invalid Date');
  });
}); 