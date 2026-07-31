import { failure, success } from './result';

describe('Result helpers', () => {
  it('creates success result', () => {
    expect(success('ok')).toEqual({ ok: true, value: 'ok' });
  });

  it('creates failure result', () => {
    const error = new Error('boom');
    expect(failure(error)).toEqual({ ok: false, error });
  });
});
