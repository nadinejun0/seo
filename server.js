const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const app = express();
const port = 3000;

// Load environment variables from openai.env
dotenv.config({ path: './openai.env' });

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} started`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} completed with ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// Serve static files from the current directory
app.use(express.static('./'));

// Simple test endpoint
app.post('/api/test', (req, res) => {
  console.log('Test endpoint received:', req.body);
  res.json({ message: 'Test endpoint successful!', received: req.body });
});

// Proxy endpoint for OpenAI API
app.post('/api/classify', async (req, res) => {
    console.log('Classify endpoint called');
    const { field } = req.body;
    let { systemPrompt, userPrompt } = req.body;
    
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.log('API key missing from environment');
        return res.status(500).json({ error: 'API key is not configured on the server' });
    }
    
    // Log the prompts for debugging
    console.log('System prompt:', systemPrompt ? systemPrompt.substring(0, 100) + '...' : 'undefined');
    console.log('User prompt:', userPrompt ? userPrompt.substring(0, 100) + '...' : 'undefined');
    console.log('Field:', field || 'all');
    
    // Add tag validation note to system prompt if not already present
    if (systemPrompt && !systemPrompt.includes('tag must be 20 characters or less')) {
        systemPrompt += '\n\nIMPORTANT: Any tags or categories must be 20 characters or less each.';
    }
    
    // Ensure the GPT follows the proper Etsy scoring framework
    if (systemPrompt && !systemPrompt.includes('FINAL CHECKS BEFORE RETURNING')) {
        systemPrompt += `\n\nFINAL CHECKS BEFORE RETURNING:
1. Ensure each tag is 20 characters or less in the improved_tags array
2. Double-check your scoring calculation - overall grade should be (Title×0.4) + (Tags×0.4) + (Description×0.2)
3. Verify the letter grade matches the score: A: ≥3.5, B: ≥2.5, C: ≥1.5, D: <1.5
4. Make sure all detail fields (keywords_found, separator_count, etc.) are populated
5. Ensure you follow the EXACT structure provided in the JSON schema`;
    }
    
    try {
        console.log('Calling OpenAI API...');
        
        const requestBody = {
            model: 'gpt-4',
            max_tokens: 4000,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        };
        
        console.log('Request body:', JSON.stringify(requestBody).substring(0, 150) + '...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('OpenAI API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                return res.status(response.status).json({ 
                    error: errorData.error?.message || 'OpenAI API error' 
                });
            } catch (e) {
                return res.status(response.status).json({ 
                    error: `OpenAI API returned status ${response.status}` 
                });
            }
        }
        
        const data = await response.json();
        console.log('API response received successfully');
        
        // Transform OpenAI response format to match what our client code expects
        const transformedResponse = {
            content: [
                {
                    text: data.choices[0].message.content
                }
            ],
            field: field || 'all'
        };
        
        res.json(transformedResponse);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Failed to call OpenAI API: ' + error.message });
    }
});

// Provide a helpful 404 for any other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      { method: 'POST', path: '/api/classify', description: 'Proxy to OpenAI API' },
      { method: 'POST', path: '/api/test', description: 'Test endpoint' },
      { method: 'GET', path: '/', description: 'Static files' }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Available applications:`);
    console.log(`- Etsy Listing Optimizer: http://localhost:${port}/index.html`);
    console.log(`- Text Classifier: http://localhost:${port}/classify.html`);
    console.log(`- API Test: http://localhost:${port}/test.html`);
});