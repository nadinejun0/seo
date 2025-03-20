# CLAUDE.md - SEO Tool Project Guide

## Commands
- Start server: `npm start` (runs `node server.js` on port 3000)
- Test server: `node test-server.js` (runs on port 3001)
- Access applications:
  - Etsy Listing Optimizer: http://localhost:3000/index.html
  - Text Classifier: http://localhost:3000/classify.html
  - API Test: http://localhost:3000/test.html

## Code Style Guidelines
- **Imports**: CommonJS style (require/module.exports)
- **Error Handling**: Use try/catch blocks with specific error messages
- **Logging**: Use console.log with timestamps and request details
- **API Calls**: Use fetch with proper error handling
- **Frontend**: JavaScript with event listeners, no frameworks
- **HTML/CSS**: Clean, semantic markup with CSS variables
- **Naming**: camelCase for variables/functions, descriptive names
- **Comments**: Use comments for function descriptions and complex logic

## Project Structure
- Server-side proxy for API calls (server.js)
- Static HTML/CSS/JS frontend
- OpenAI API integration for text classification