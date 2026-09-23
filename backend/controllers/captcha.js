// Import JSON Web Token for creating a temporary signed verification token
const jwt = require('jsonwebtoken');
// Import the asyncHandler middleware to wrap asynchronous functions and catch errors
const asyncHandler = require('../middleware/async');

// @desc    Generate a custom SVG captcha for login security
// @route   GET /api/auth/captcha
// @access  Public
// This function runs when the login modal is opened or the refresh button is clicked.
exports.getCaptcha = asyncHandler(async (req, res, next) => {
  // Define the characters allowed in the captcha
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let captchaText = '';
  // Generate a random 6-character alphanumeric string
  for (let i = 0; i < 6; i++) {
    captchaText += chars[Math.floor(Math.random() * chars.length)];
  }

  // Define dimensions for the SVG image
  const width = 150;
  const height = 50;
  
  // Create some random noise lines to make it harder for bots to read
  let noiseLines = '';
  for (let i = 0; i < 5; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(15, 45, 107, 0.2)" stroke-width="1" />`;
  }

  // Render each character with a slight random rotation and offset for aesthetics and security
  let textElements = '';
  for (let i = 0; i < captchaText.length; i++) {
    const x = 20 + i * 20;
    const y = 35 + (Math.random() * 5 - 2.5);
    const rotation = Math.random() * 20 - 10;
    textElements += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#0f2d6b" transform="rotate(${rotation}, ${x}, ${y})">${captchaText[i]}</text>`;
  }

  // Construct the final SVG string
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6" rx="8" />
      ${noiseLines}
      ${textElements}
    </svg>
  `;

  // Create a short-lived (5 minutes) signed token containing the correct captcha text.
  // This is sent to the frontend and must be returned during login for verification.
  const captchaToken = jwt.sign({ text: captchaText }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });

  // Return the SVG and the token to the frontend
  res.status(200).json({
    success: true,
    data: {
      svg,
      captchaToken,
    },
  });
});
