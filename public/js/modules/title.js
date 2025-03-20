/**
 * Title grading and optimization module
 */

// Constants
const STOP_WORDS = ['with', 'that', 'this', 'from', 'your', 'and', 'for'];
const MAX_FOCUS_KEYWORDS = 4;
const POINTS_PER_KEYWORD = 0.3;

/**
 * Grade a title based on SEO criteria
 * @param {string} title - The title to grade
 * @param {string[]} tagsArray - Array of tags for focus keyword detection
 * @returns {object} Results object with scores and analysis
 */
function gradeTitle(title, tagsArray = []) {
    // Initialize results structure
    const results = {
        character_count: { score: 0, max: 1.2, passed: false, character_length: title.length },
        focus_keywords: { score: 0, max: 1.2, passed: false, keywords_found: [] },
        keyword_stuffing: { score: 0, max: 0.8, passed: true, stuffed_words: [] },
        structure: { score: 0, max: 0.8, passed: false, separator_count: 0 },
        total_score: 0
    };
    
    // 1. Character Count (1.2 points)
    gradeCharacterCount(title, results);
    
    // 2. Focus Keywords in First 40 Characters (1.2 points)
    gradeFocusKeywords(title, tagsArray, results);
    
    // 3. Keyword Stuffing Detection (0.8 points)
    gradeKeywordStuffing(title, results);
    
    // 4. Structural Elements (0.8 points)
    gradeStructure(title, results);
    
    // Calculate total score
    results.total_score = results.character_count.score + 
                          results.focus_keywords.score + 
                          results.keyword_stuffing.score + 
                          results.structure.score;
    
    return results;
}

/**
 * Grade character count
 * @private
 */
function gradeCharacterCount(title, results) {
    const charCount = title.length;
    
    if (charCount >= 100 && charCount <= 140) {
        results.character_count.score = 1.2;
        results.character_count.passed = true;
    } else if (charCount >= 80 && charCount <= 99) {
        results.character_count.score = 0.9;
        results.character_count.passed = true;
    } else if (charCount >= 141 && charCount <= 160) {
        results.character_count.score = 0.6;
        results.character_count.passed = false;
    } else {
        results.character_count.score = 0.3;
        results.character_count.passed = false;
    }
}

/**
 * Grade focus keywords
 * @private
 */
function gradeFocusKeywords(title, tagsArray, results) {
    // Get the first 40 characters of the title
    const first40Chars = title.substring(0, 40).toLowerCase();
    
    // Extract words and phrases from first 40 characters
    const titleWords = first40Chars.split(/\s+|,|\|/).filter(word => 
        word.length > 3 && !STOP_WORDS.includes(word)
    );
    
    // Get all words for phrase building
    const allFirstWords = first40Chars.split(/\s+|,|\|/).filter(w => w.length > 0);
    
    // Create multi-word phrases
    const titlePhrases = [];
    // 2-word phrases
    for (let i = 0; i < allFirstWords.length - 1; i++) {
        titlePhrases.push(`${allFirstWords[i]} ${allFirstWords[i+1]}`);
    }
    // 3-word phrases
    for (let i = 0; i < allFirstWords.length - 2; i++) {
        titlePhrases.push(`${allFirstWords[i]} ${allFirstWords[i+1]} ${allFirstWords[i+2]}`);
    }
    
    let keywordMatches = 0;
    const matchedKeywords = [];
    
    if (tagsArray.length > 0) {
        const lowercaseTags = tagsArray.map(tag => tag.toLowerCase());
        
        // 1. Check for exact tag matches
        for (const tag of lowercaseTags) {
            if (first40Chars.includes(tag) && !matchedKeywords.includes(tag)) {
                keywordMatches++;
                matchedKeywords.push(tag);
                if (keywordMatches >= MAX_FOCUS_KEYWORDS) break;
            }
        }
        
        // 2. Check multi-word phrases
        if (keywordMatches < MAX_FOCUS_KEYWORDS) {
            for (const phrase of titlePhrases) {
                if (matchedKeywords.includes(phrase)) continue;
                
                for (const tag of lowercaseTags) {
                    if ((tag.includes(phrase) || phrase.includes(tag)) && 
                        !matchedKeywords.includes(phrase)) {
                        keywordMatches++;
                        matchedKeywords.push(phrase);
                        break;
                    }
                }
                
                if (keywordMatches >= MAX_FOCUS_KEYWORDS) break;
            }
        }
        
        // 3. Check individual words
        if (keywordMatches < MAX_FOCUS_KEYWORDS) {
            for (const word of titleWords) {
                if (matchedKeywords.some(match => match.includes(word))) continue;
                
                for (const tag of lowercaseTags) {
                    if (tag.includes(word) && !matchedKeywords.includes(word)) {
                        keywordMatches++;
                        matchedKeywords.push(word);
                        break;
                    }
                }
                
                if (keywordMatches >= MAX_FOCUS_KEYWORDS) break;
            }
        }
    } else {
        // If no tags provided, count significant words in first 40 chars
        keywordMatches = Math.min(titleWords.length, MAX_FOCUS_KEYWORDS);
        matchedKeywords.push(...titleWords.slice(0, MAX_FOCUS_KEYWORDS));
    }
    
    // Store results
    results.focus_keywords.keywords_found = matchedKeywords.slice(0, MAX_FOCUS_KEYWORDS);
    results.focus_keywords.score = Math.min(keywordMatches * POINTS_PER_KEYWORD, 1.2);
    results.focus_keywords.passed = keywordMatches > 0;
}

/**
 * Grade keyword stuffing
 * @private
 */
function gradeKeywordStuffing(title, results) {
    // Count word frequencies
    const words = title.toLowerCase().split(/\s+|,|\|/).filter(word => word.length > 3);
    const wordFrequency = {};
    words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Check for stuffed words (appearing more than 4 times)
    const stuffedWords = Object.keys(wordFrequency).filter(word => wordFrequency[word] > 4);
    
    // Check for repeated phrases
    const phrases = [];
    const titleParts = title.split(/,|\|/).map(part => part.trim());
    let repeatedPhrases = 0;
    
    titleParts.forEach(phrase => {
        if (phrases.includes(phrase)) {
            repeatedPhrases++;
        }
        phrases.push(phrase);
    });
    
    // Calculate unique word ratio
    const uniqueWordRatio = Object.keys(wordFrequency).length / words.length;
    
    // Set keyword stuffing score
    if (stuffedWords.length > 0 || repeatedPhrases >= 3 || uniqueWordRatio < 0.6) {
        results.keyword_stuffing.score = 0;
        results.keyword_stuffing.passed = false;
        results.keyword_stuffing.stuffed_words = stuffedWords;
    } else {
        results.keyword_stuffing.score = 0.8;
        results.keyword_stuffing.passed = true;
    }
}

/**
 * Grade structure
 * @private
 */
function gradeStructure(title, results) {
    // Count commas and pipes
    const commaCount = (title.match(/,/g) || []).length;
    const pipeCount = (title.match(/\|/g) || []).length;
    const separatorCount = commaCount + pipeCount;
    
    results.structure.separator_count = separatorCount;
    
    if (separatorCount >= 2 && separatorCount <= 4) {
        results.structure.score = 0.8;
        results.structure.passed = true;
    } else if (separatorCount === 1) {
        results.structure.score = 0.4;
        results.structure.passed = false;
    } else {
        results.structure.score = 0.2;
        results.structure.passed = false;
    }
}

// Export functions
export { gradeTitle };