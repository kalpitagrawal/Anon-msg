import crypto from "crypto";

// crypto.randomInt is a CSPRNG - Math.random() is predictable and unsuitable
// for security-sensitive codes like email verification / password reset OTPs.
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export default generateOtp;
