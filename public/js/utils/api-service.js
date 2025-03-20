/**
 * API Service for Etsy Listing Optimizer
 * Handles all API communication with the optimization backend
 */

/**
 * Call the optimization API
 * @param {string} field - Field to optimize ('title', 'tags', 'description', 'all')
 * @param {object} data - Data to send to the API
 * @returns {Promise} Promise that resolves with the API response
 */
async function callOptimizationAPI(field, data) {
    try {
        // Test API connectivity
        const testResponse = await fetch('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ test: 'connection' })
        });
        
        if (!testResponse.ok) {
            throw new Error(`Test API request failed with status ${testResponse.status}`);
        }
        
        // Create system prompt based on the needed optimization
        const systemPrompt = createSystemPrompt(field);
        
        // Create user message with the listing details
        const userMessage = createUserMessage(field, data);
        
        // Make the API call
        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt: userMessage,
                field
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'API request failed with status ' + response.status;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If we can't parse the error as JSON, just use the status code message
            }
            throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        
        // Parse the JSON response from the model
        const contentText = responseData.content[0].text;
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Could not parse optimization result');
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Create system prompt for API request
 * @private
 */
function createSystemPrompt(field) {
    return `
    You are an AI designed to optimize Etsy product listings for maximum search visibility and conversion. 
    Your task is to analyze the provided product listing fields and improve them.
    
    Follow the exact scoring framework below:
    
    OVERALL GRADE CALCULATION:
    - Overall score = (Title score × 0.40) + (Tag score × 0.40) + (Description score × 0.20)
    - Grade Scale:
      - A: 3.5-4.0
      - B: 2.5-3.49
      - C: 1.5-2.49
      - D: 1.0-1.49
    
    TITLE OPTIMIZATION CRITERIA:
    1. Character Count (1.2 points)
       - 100-140 characters: 1.2 points
       - 80-99 characters: 0.9 points
       - 141-160 characters: 0.6 points
       - <80 or >160 characters: 0.3 points
    
    2. Focus Keywords in First 40 Characters (1.2 points)
       - Definition: Number of significant words (>3 characters) that also appear in tags
       - Scoring: 0.3 points per significant word (max 4 words/1.2 points)
    
    3. Keyword Stuffing Detection (0.8 points)
       - No stuffing detected: 0.8 points
       - Stuffing detected (if any word appears >4 times OR any phrase repeats 3+ times OR 
         unique word ratio <0.6): 0 points
    
    4. Structural Elements (0.8 points)
       - 2-4 commas or pipe separators: 0.8 points
       - 1 comma or pipe: 0.4 points
       - 5+ commas/pipes or 0 separators: 0.2 points
    
    TAG OPTIMIZATION CRITERIA:
    1. Tag Count (1 point)
       - Formula: (Number of tags / 13) × 1.0
       - CRITICAL: Every tag MUST be 20 characters or less
    
    2. Multi-word Tag Ratio (1 point)
       - Formula: (Number of multi-word tags / Total tags)
    
    3. Chain Structure (1 point)
       - Definition: Tags where words appear in sequential order in the title
       - Formula: (Number of chained tags / (Total tags - 1))
    
    4. Tag Diversity (1 point)
       - Ratio of unique words to total words across all tags
       - ≥0.8 ratio: 1.0 point
       - 0.6-0.79 ratio: 0.75 points
       - 0.4-0.59 ratio: 0.5 points
       - <0.4 ratio: 0.25 points
    
    DESCRIPTION OPTIMIZATION CRITERIA:
    1. Length and Detail (1.2 points)
       - 150-500 words: 1.2 points
       - 100-149 words: 0.9 points
       - 50-99 words: 0.6 points
       - <50 or >500 words: 0.3 points
    
    2. Structural Formatting (1.2 points)
       - 0.4 points each for:
         - Paragraph breaks (>2 paragraphs with <300 characters each)
         - List elements (contains •, *, -, or numbered lists)
         - Formatting markers (contains **, _, #, or emojis as section dividers)
    
    3. Keyword Integration (1.6 points)
       - Formula: (Number of title keywords in description / Total keywords in title) × 1.6
    
    Your response should be in JSON format with the following structure:
    {
        "scores": {
            "title_score": {
                "value": 0.0, // From 0 to 4.0
                "details": {
                    "character_count": {"score": 0.0, "max": 1.2, "passed": true/false},
                    "focus_keywords": {"score": 0.0, "max": 1.2, "passed": true/false, "keywords_found": ["word1", "word2"]},
                    "keyword_stuffing": {"score": 0.0, "max": 0.8, "passed": true/false, "stuffed_words": ["word1", "word2"]},
                    "structure": {"score": 0.0, "max": 0.8, "passed": true/false, "separator_count": 0}
                }
            },
            "tags_score": {
                "value": 0.0, // From 0 to 4.0
                "details": {
                    "tag_count": {"score": 0.0, "max": 1.0, "passed": true/false, "count": 0},
                    "multi_word_tags": {"score": 0.0, "max": 1.0, "passed": true/false, "count": 0},
                    "chain_structure": {"score": 0.0, "max": 1.0, "passed": true/false, "count": 0},
                    "diversity": {"score": 0.0, "max": 1.0, "passed": true/false, "ratio": 0.0}
                }
            },
            "description_score": {
                "value": 0.0, // From 0 to 4.0
                "details": {
                    "length": {"score": 0.0, "max": 1.2, "passed": true/false, "word_count": 0},
                    "formatting": {"score": 0.0, "max": 1.2, "passed": true/false, 
                       "has_paragraphs": true/false, "has_lists": true/false, "has_formatting": true/false},
                    "keyword_integration": {"score": 0.0, "max": 1.6, "passed": true/false, "keywords_used": 0}
                }
            },
            "overall_grade": {
                "value": 0.0, // Weighted average: (Title×0.4) + (Tags×0.4) + (Description×0.2)
                "letter": "A/B/C/D" // A: ≥3.5, B: ≥2.5, C: ≥1.5, D: <1.5
            }
        },
        "improvements": {
            "improved_title": "The optimized title",
            "improved_tags": ["tag1", "tag2", "etc"],
            "improved_description": "The optimized description",
            "title_improvement_note": "Brief explanation of title improvements",
            "tags_improvement_note": "Brief explanation of tag improvements",
            "description_improvement_note": "Brief explanation of description improvements"
        }
    }
    `;
}

/**
 * Create user message for API request
 * @private
 */
function createUserMessage(field, data) {
    const { title, tags, description } = data;
    const tagsString = Array.isArray(tags) ? tags.join(', ') : 'No tags provided';
    
    switch (field) {
        case 'title':
            return `Please optimize only this Etsy listing title: "${title}"`;
        case 'tags':
            return `Please optimize only these Etsy listing tags: ${tagsString}`;
        case 'description':
            return `Please optimize only this Etsy listing description: ${description || 'No description provided'}`;
        default:
            return `
            Please optimize this Etsy listing:
            
            TITLE: ${title}
            
            TAGS: ${tagsString}
            
            DESCRIPTION: ${description || 'No description provided'}
            `;
    }
}

export { callOptimizationAPI };