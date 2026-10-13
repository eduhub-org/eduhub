import {
  centsToEuroInput,
  formatEuro,
  parseEuroToCents,
  isEuroInputAllowed,
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

  it('only lets numbers through and never rewrites an amount', () => {
    expect(isEuroInputAllowed('250')).toBe(true);
    expect(isEuroInputAllowed('250,')).toBe(true);
    expect(isEuroInputAllowed('250.5')).toBe(true);
    expect(isEuroInputAllowed('')).toBe(true);
    expect(isEuroInputAllowed('25a0')).toBe(false);
    expect(isEuroInputAllowed('-5')).toBe(false);
    expect(isEuroInputAllowed('1.234,56')).toBe(false);
    expect(isEuroInputAllowed('1,234')).toBe(false);
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
