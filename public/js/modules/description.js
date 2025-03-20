/**
 * Description grading and optimization module
 */

// Constants
const STOP_WORDS = ['with', 'that', 'this', 'from', 'your', 'and', 'for'];
const KEYWORD_INTEGRATION_THRESHOLD = 0.5;
const FORMATTING_THRESHOLD = 0.8;

/**
 * Grade a description based on SEO criteria
 * @param {string} description - The description to grade
 * @param {string} title - Product title for keyword integration analysis
 * @returns {object} Results object with scores and analysis
 */
function gradeDescription(description, title) {
    // Initialize results structure
    const results = {
        length: { score: 0, max: 1.2, passed: false, word_count: 0 },
        formatting: { 
            score: 0, 
            max: 1.2, 
            passed: false, 
            has_paragraphs: false,
            has_lists: false,
            has_formatting: false
        },
        keyword_integration: { score: 0, max: 1.6, passed: false, keywords_used: 0 },
        total_score: 0
    };
    
    // Exit early if no description
    if (!description) return results;
    
    // 1. Length and Detail (1.2 points)
    gradeLength(description, results);
    
    // 2. Structural Formatting (1.2 points)
    gradeFormatting(description, results);
    
    // 3. Keyword Integration (1.6 points)
    if (title) {
        gradeKeywordIntegration(description, title, results);
    }
    
    // Calculate total score
    results.total_score = 
        results.length.score + 
        results.formatting.score + 
        results.keyword_integration.score;
    
    return results;
}

/**
 * Grade description length
 * @private
 */
function gradeLength(description, results) {
    const wordCount = description.trim().split(/\s+/).length;
    results.length.word_count = wordCount;
    
    if (wordCount >= 150 && wordCount <= 500) {
        results.length.score = 1.2;
        results.length.passed = true;
    } else if (wordCount >= 100 && wordCount <= 149) {
        results.length.score = 0.9;
        results.length.passed = true;
    } else if (wordCount >= 50 && wordCount <= 99) {
        results.length.score = 0.6;
        results.length.passed = false;
    } else {
        results.length.score = 0.3;
        results.length.passed = false;
    }
}

/**
 * Grade formatting structure
 * @private
 */
function gradeFormatting(description, results) {
    // Check for paragraph breaks
    const paragraphs = description.split(/\n\s*\n/);
    results.formatting.has_paragraphs = paragraphs.length > 2 && paragraphs.some(p => p.length < 300);
    
    // Check for list elements
    results.formatting.has_lists = /[•*\-]/.test(description) || /\d+\.\s/.test(description);
    
    // Check for formatting markers
    results.formatting.has_formatting = /[\*\_\#]/.test(description) || /[🔸📌✅⭐]/.test(description);
    
    // Calculate formatting score (0.4 points for each element)
    results.formatting.score = 
        (results.formatting.has_paragraphs ? 0.4 : 0) +
        (results.formatting.has_lists ? 0.4 : 0) +
        (results.formatting.has_formatting ? 0.4 : 0);
    
    results.formatting.passed = results.formatting.score >= FORMATTING_THRESHOLD;
}

/**
 * Grade keyword integration 
 * @private
 */
function gradeKeywordIntegration(description, title, results) {
    // Extract significant words from title
    const titleWords = title.toLowerCase().split(/\s+|,|\|/).filter(word => 
        word.length > 3 && !STOP_WORDS.includes(word)
    );
    
    const uniqueTitleWords = [...new Set(titleWords)];
    const descWords = description.toLowerCase().split(/\s+|,|\|/);
    
    // Count how many title keywords appear in description
    const keywordsUsed = uniqueTitleWords.filter(word => descWords.includes(word)).length;
    results.keyword_integration.keywords_used = keywordsUsed;
    
    // Calculate score
    if (uniqueTitleWords.length > 0) {
        const ratio = keywordsUsed / uniqueTitleWords.length;
        results.keyword_integration.score = Math.min(ratio * 1.6, 1.6);
        results.keyword_integration.passed = ratio >= KEYWORD_INTEGRATION_THRESHOLD;
    }
}

// Export functions
export { gradeDescription };