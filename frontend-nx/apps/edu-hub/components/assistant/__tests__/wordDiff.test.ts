import { wordDiff } from '../wordDiff';

describe('wordDiff', () => {
  it('marks removed and added words and keeps the rest', () => {
    expect(wordDiff('Learn Python fast', 'Learn Rust fast')).toEqual([
      { text: 'Learn ', type: 'same' },
      { text: 'Python', type: 'removed' },
      { text: 'Rust', type: 'added' },
      { text: ' fast', type: 'same' },
    ]);
  });

  it('handles empty sides', () => {
    expect(wordDiff('', 'new text')).toEqual([{ text: 'new text', type: 'added' }]);
    expect(wordDiff('old', '')).toEqual([{ text: 'old', type: 'removed' }]);
  });
});
