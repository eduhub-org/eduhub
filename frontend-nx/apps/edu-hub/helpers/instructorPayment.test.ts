import {
  centsToEuroInput,
  formatEuro,
  parseEuroToCents,
  sanitizeEuroInput,
  summarizeSplit,
} from './instructorPayment';

describe('instructorPayment helpers', () => {
  it('parses euro input with comma or dot', () => {
    expect(parseEuroToCents('250')).toBe(25000);
    expect(parseEuroToCents('250,5')).toBe(25050);
    expect(parseEuroToCents('0.99')).toBe(99);
    expect(parseEuroToCents('')).toBeNull();
    expect(parseEuroToCents('abc')).toBeNull();
    expect(parseEuroToCents('1,234')).toBeNull();
  });

  it('only lets numbers through', () => {
    expect(sanitizeEuroInput('25a0€')).toBe('250');
    expect(sanitizeEuroInput('1,2.34')).toBe('1,23');
    expect(sanitizeEuroInput('-5')).toBe('5');
  });

  it('round-trips cents to an editable string', () => {
    expect(centsToEuroInput(25000, 'de')).toBe('250');
    expect(centsToEuroInput(25050, 'de')).toBe('250,50');
    expect(centsToEuroInput(25050, 'en')).toBe('250.50');
    expect(centsToEuroInput(null, 'en')).toBe('');
  });

  it('formats euros for display', () => {
    expect(formatEuro(50000, 'en')).toBe('€500.00');
    expect(formatEuro(50000, 'de').replace(/\s/g, ' ')).toBe('500,00 €');
  });

  it('only counts a split as complete when every share is entered and the sum matches', () => {
    expect(summarizeSplit(50000, [50000, null]).complete).toBe(false);
    expect(summarizeSplit(50000, [30000, 10000])).toEqual({ assigned: 40000, remaining: 10000, complete: false });
    expect(summarizeSplit(50000, [50000, 0]).complete).toBe(true);
  });
});
