/**
 * Tags grading and optimization module
 */

// Constants
const MAX_TAGS = 13;
const MIN_WORD_LENGTH = 2;
const MULTI_WORD_THRESHOLD = 0.7;
const CHAIN_STRUCTURE_THRESHOLD = 0.5;
const DIVERSITY_THRESHOLD = 0.6;
const STOP_WORDS = ['with', 'that', 'this', 'from', 'your', 'and', 'for', 'the'];

/**
 * Grade tags based on SEO criteria
 * @param {string[]} tagsArray - Array of tags to grade
 * @param {string} title - The product title for chain structure analysis
 * @returns {object} Results object with scores and analysis
 */
function gradeTags(tagsArray, title) {
    // Initialize results structure
    const results = {
        tag_count: { score: 0, max: 1.0, passed: false, count: tagsArray.length },
        multi_word_tags: { score: 0, max: 1.0, passed: false, count: 0 },
        chain_structure: { score: 0, max: 1.0, passed: false, count: 0 },
        diversity: { score: 0, max: 1.0, passed: false, ratio: 0 },
        total_score: 0
    };
    
    // Skip processing if no tags
    if (!tagsArray.length) return results;
    
    // 1. Tag Count (1 point)
    gradeTagCount(tagsArray, results);
    
    // 2. Multi-word Tag Ratio (1 point)
    gradeMultiWordTags(tagsArray, results);
    
    // 3. Chain Structure (1 point)
    if (tagsArray.length > 1 && title) {
        gradeChainStructure(tagsArray, title, results);
    }
    
    // 4. Tag Diversity (1 point)
    gradeDiversity(tagsArray, results);
    
    // Calculate total score
    results.total_score = 
        results.tag_count.score + 
        results.multi_word_tags.score + 
        results.chain_structure.score + 
        results.diversity.score;
    
    return results;
}

/**
 * Grade tag count
 * @private
 */
function gradeTagCount(tagsArray, results) {
    results.tag_count.score = Math.min((tagsArray.length / MAX_TAGS), 1.0);
    results.tag_count.passed = tagsArray.length >= 10; // Passing threshold (at least 10 tags)
}

/**
 * Grade multi-word tags
 * @private
 */
function gradeMultiWordTags(tagsArray, results) {
    const multiWordTags = tagsArray.filter(tag => tag.split(/\s+/).length > 1);
    results.multi_word_tags.count = multiWordTags.length;
    results.multi_word_tags.score = multiWordTags.length / tagsArray.length;
    results.multi_word_tags.passed = results.multi_word_tags.score >= MULTI_WORD_THRESHOLD;
}

/**
 * Grade chain structure - improved to better recognize sequential terms
 * @private
 */
function gradeChainStructure(tagsArray, title, results) {
    // Clean and normalize the title
    const cleanTitle = title.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    
    // Create an array of all significant words from the title
    const titleWords = cleanTitle.split(/\s+/).filter(w => 
        w.length > MIN_WORD_LENGTH && !STOP_WORDS.includes(w)
    );
    
    // Record original positions of words in title
    const wordPositionsMap = new Map();
    titleWords.forEach((word, index) => {
        if (!wordPositionsMap.has(word)) {
            wordPositionsMap.set(word, []);
        }
        wordPositionsMap.get(word).push(index);
    });
    
    // Extract words from each tag and find their positions in the title
    const tagData = tagsArray.map(tag => {
        const cleanTag = tag.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ").trim();
        const tagWords = cleanTag.split(/\s+/).filter(w => 
            w.length > MIN_WORD_LENGTH && !STOP_WORDS.includes(w)
        );
        
        // Find all positions where tag words appear in the title
        const positions = [];
        for (const word of tagWords) {
            if (wordPositionsMap.has(word)) {
                positions.push(...wordPositionsMap.get(word));
            }
        }
        
        return {
            tag,
            words: tagWords,
            positions: [...new Set(positions)].sort((a, b) => a - b) // Deduplicate and sort
        };
    });
    
    // Find chained tags - those with words appearing in sequential order
    let chainedTagCount = 0;
    const chainedPairs = [];
    const tagHasChain = new Array(tagsArray.length).fill(false);
    
    // Check each pair of tags for words in sequential order
    for (let i = 0; i < tagData.length; i++) {
        if (tagHasChain[i]) continue;
        
        const tag1 = tagData[i];
        // Skip tags with no words found in title
        if (tag1.positions.length === 0) continue;
        
        for (let j = 0; j < tagData.length; j++) {
            if (i === j || tagHasChain[j]) continue;
            
            const tag2 = tagData[j];
            // Skip tags with no words found in title
            if (tag2.positions.length === 0) continue;
            
            // Check for sequential positions (one tag's words come before another's)
            let isChained = false;
            
            // Approach 1: Check if ANY word from tag1 comes before ANY word from tag2
            const minPos2 = Math.min(...tag2.positions);
            const maxPos1 = Math.max(...tag1.positions);
            
            if (maxPos1 < minPos2) {
                isChained = true;
            } else {
                // Approach 2: Check pairs of positions
                for (const pos1 of tag1.positions) {
                    for (const pos2 of tag2.positions) {
                        // Check for words that appear in sequence (can have other words between)
                        // but maintaining the right order
                        if (pos1 < pos2 && pos2 - pos1 <= 5) { // Within 5 words of each other
                            isChained = true;
                            break;
                        }
                    }
                    if (isChained) break;
                }
            }
            
            if (isChained) {
                chainedPairs.push({
                    tag1: tag1.tag,
                    tag2: tag2.tag
                });
                tagHasChain[i] = true;
                tagHasChain[j] = true;
                chainedTagCount++;
                break;
            }
        }
    }
    
    // Ensure we don't count more chains than possible (pairs of tags)
    // The maximum number of chained tags is n/2 where n is the total number of tags
    chainedTagCount = Math.min(chainedTagCount, Math.floor(tagsArray.length / 2));
    
    // Calculate score based on the number of chained tags
    const denominator = Math.max(1, tagsArray.length - 1); // Avoid division by zero
    results.chain_structure.count = chainedTagCount;
    results.chain_structure.score = Math.min(chainedTagCount / denominator, 1.0);
    results.chain_structure.passed = results.chain_structure.score >= CHAIN_STRUCTURE_THRESHOLD;
    results.chain_structure.chained_pairs = chainedPairs;
}

/**
 * Grade tag diversity
 * @private
 */
function gradeDiversity(tagsArray, results) {
    // Collect all words from all tags
    const allWords = tagsArray.join(' ').toLowerCase().split(/\s+|,|\|/).filter(word => 
        word.length > MIN_WORD_LENGTH && !STOP_WORDS.includes(word)
    );
    const uniqueWords = [...new Set(allWords)];
    
    results.diversity.ratio = uniqueWords.length / allWords.length;
    
    // Scoring based on ratio
    if (results.diversity.ratio >= 0.8) {
        results.diversity.score = 1.0;
    } else if (results.diversity.ratio >= DIVERSITY_THRESHOLD) {
        results.diversity.score = 0.75;
    } else if (results.diversity.ratio >= 0.4) {
        results.diversity.score = 0.5;
    } else {
        results.diversity.score = 0.25;
    }
    
    results.diversity.passed = results.diversity.ratio >= DIVERSITY_THRESHOLD;
}

/**
 * Process comma-separated tags input
 * @param {string} input - Comma-separated tags
 * @param {string[]} existingTags - Array of existing tags
 * @param {number} maxTags - Maximum number of tags allowed
 * @param {number} maxLength - Maximum length per tag
 * @returns {object} Results of processing
 */
function processCommaSeparatedTags(input, existingTags = [], maxTags = MAX_TAGS, maxLength = 20) {
    const tagsList = input.split(',');
    const result = {
        addedTags: [],
        skippedTags: [],
        duplicates: [],
        tooLong: []
    };
    
    // Start with existing tags
    const tags = [...existingTags];
    
    for (const tag of tagsList) {
        const trimmedTag = tag.trim();
        
        // Skip empty tags
        if (!trimmedTag) continue;
        
        // Check if we've reached the maximum
        if (tags.length >= maxTags) {
            result.skippedTags.push(trimmedTag);
            continue;
        }
        
        // Check tag length
        if (trimmedTag.length > maxLength) {
            result.tooLong.push(trimmedTag);
            result.skippedTags.push(trimmedTag);
            continue;
        }
        
        // Check for duplicates
        if (tags.includes(trimmedTag)) {
            result.duplicates.push(trimmedTag);
            result.skippedTags.push(trimmedTag);
            continue;
        }
        
        // Add valid tag
        tags.push(trimmedTag);
        result.addedTags.push(trimmedTag);
    }
    
    result.tags = tags;
    return result;
}

export { gradeTags, processCommaSeparatedTags };