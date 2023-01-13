export const shuffle = <T>(array: T[]) => {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

// Shuffle "a bit", by splitting the array into small subarrays and shuffling those subarrays.
export const shuffleSlices = <T>(array: T[]) => {
  const slicesSize = Math.min(
    3 + Math.ceil(Math.random() * 7),
    Math.ceil(array.length / 4) + 1
  );
  const slicesCount = Math.ceil(array.length / slicesSize);
  const result: T[] = [];
  for (let i = 0; i < slicesCount; i++) {
    const subarray = shuffle(array.slice(i * slicesSize, (i + 1) * slicesSize));
    for (const sa of subarray) {
      result.push(sa);
    }
  }

  return result;
};
