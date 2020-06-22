const bitCounts = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

const parseHexAt = (a, i) => {
  const code = a.charCodeAt(i);
  if (code < 58 && code >= 48) {
    return code - 48;
  } else if (code < 103 && code >= 97) {
    return code - 87;
  } else if (code < 71 && code >= 65) {
    return code - 55;
  }
  throw new Error(`Invalid hex char code ${code} at ${i} from ${a}`);
}

const hammingDistance = (a, b, max) => {
  if (a.length != b.length) {
    throw new Error(`Input lengths have not the same length`);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    const n = parseHexAt(a, i);
    const m = parseHexAt(b, i);
    diff += bitCounts[(n ^ m)];
    if (max && diff >= max) {
      return max;
    }
  }
  return diff;
}

module.exports = hammingDistance;
