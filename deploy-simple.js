// Simple deployment script for Netlify
// This will create a minimal working version

const fs = require('fs');
const path = require('path');

// Create a simple package.json for deployment
const packageJson = {
  "name": "chess-app-deploy",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5"
  }
};

// Write the package.json
fs.writeFileSync('package-deploy.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Created deployment package.json');
console.log('📦 Ready for Netlify deployment!');
console.log('');
console.log('Next steps:');
console.log('1. Use package-deploy.json as your package.json');
console.log('2. Deploy to Netlify with build command: npm run build');
console.log('3. Publish directory: .next');
