import { mkdirSync } from "node:fs";
import sharp from "sharp";

// Red-filled bookmark (from Heroicons outline, converted to filled) with white play triangle
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512">
  <!-- Rounded rectangle background (the rest) - red -->
  <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.25" ry="2.25" fill="#cc0000" />

  <!-- Ribbon - dark red bookmark shape matching original Heroicons proportions -->
  <path d="M7.5 3.75 V16.5 L12 14.25 L16.5 16.5 V3.75" fill="#8b0000" />

  <!-- Triangle - white, fitted inside the ribbon area -->
  <polygon points="10.5,7.5 10.5,13 14.5,10.25" fill="white" />
</svg>
`;

mkdirSync("public/icons", { recursive: true });

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
	await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
	console.log(`Generated icon-${size}.png`);
}

console.log("Done!");
