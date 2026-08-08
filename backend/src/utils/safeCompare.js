import crypto from "crypto";

// Constant-time equality check for secrets like OTPs. A plain `===` leaks
// timing information proportional to the number of matching leading
// characters, which combined with enough samples can help an attacker guess
// the value faster. crypto.timingSafeEqual avoids that short-circuiting.
const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // timingSafeEqual requires equal-length buffers; pad to a fixed length so
  // we don't leak length information via an early return either.
  const maxLen = Math.max(bufA.length, bufB.length, 1);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);

  return bufA.length === bufB.length && crypto.timingSafeEqual(paddedA, paddedB);
};

export default safeCompare;
