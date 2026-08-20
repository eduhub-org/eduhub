import { jest } from '@jest/globals';
import { withRetry } from '../lib/withRetry.js';

const graphqlError = (message = 'field not found') => {
  const error = new Error(message);
  error.response = { errors: [{ message }] };
  return error;
};

describe('withRetry', () => {
  it('returns the result of a first-try success without retrying', async () => {
    const operation = jest.fn().mockResolvedValue('ok');

    await expect(withRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures and reports the eventual success', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValue('ok');
    const logger = { warn: jest.fn() };

    await expect(withRetry(operation, { logger, description: 'project lookup' })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toContain('project lookup');
  });

  it('gives up after the configured number of attempts and rethrows', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('timeout'));

    await expect(withRetry(operation, { attempts: 2 })).rejects.toThrow('timeout');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry GraphQL errors, which would fail identically', async () => {
    const operation = jest.fn().mockRejectedValue(graphqlError());

    await expect(withRetry(operation)).rejects.toThrow('field not found');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('works without a logger', async () => {
    const operation = jest.fn().mockRejectedValueOnce(new Error('flaky')).mockResolvedValue(42);

    await expect(withRetry(operation)).resolves.toBe(42);
  });
});
