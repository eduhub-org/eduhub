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

describe('wordDiff of a replaced sentence', () => {
  it('shows the old words, then the new ones, instead of interleaving them at shared spaces', () => {
    expect(wordDiff('Regular course for testing', 'Version A')).toEqual([
      { text: 'Regular course for testing', type: 'removed' },
      { text: 'Version A', type: 'added' },
    ]);
  });

  it('keeps unchanged words as anchors between changes', () => {
    expect(wordDiff('a b c d', 'x b y d')).toEqual([
      { text: 'a', type: 'removed' },
      { text: 'x', type: 'added' },
      { text: ' b ', type: 'same' },
      { text: 'c', type: 'removed' },
      { text: 'y', type: 'added' },
      { text: ' d', type: 'same' },
    ]);
  });
});
