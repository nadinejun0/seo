/**
 * Common utilities for grading and calculation
 */

/**
 * Calculate overall grade based on all scoring components
 * @param {number} titleScore - Title score (0-4)
 * @param {number} tagsScore - Tags score (0-4)
 * @param {number} descriptionScore - Description score (0-4)
 * @returns {object} Overall grade object
 */
function calculateOverallGrade(titleScore, tagsScore, descriptionScore) {
    // Title and tags weighted more heavily than description
    const weights = {
        title: 0.4,
        tags: 0.4,
        description: 0.2
    };
    
    const weightedTitleScore = titleScore * weights.title;
    const weightedTagsScore = tagsScore * weights.tags;
    const weightedDescScore = descriptionScore * weights.description;
    
    const overallScore = weightedTitleScore + weightedTagsScore + weightedDescScore;
    
    // Determine letter grade
    let letterGrade;
    if (overallScore >= 3.5) {
        letterGrade = 'A';
    } else if (overallScore >= 2.5) {
        letterGrade = 'B';
    } else if (overallScore >= 1.5) {
        letterGrade = 'C';
    } else {
        letterGrade = 'D';
    }
    
    return {
        score: overallScore,
        letter: letterGrade,
        title_component: weightedTitleScore,
        tags_component: weightedTagsScore,
        description_component: weightedDescScore
    };
}

/**
 * Generate an HTML representation of the grading results
 * @param {object} gradeResults - Results from grading
 * @param {string} type - Type of results (title, tags, description)
 * @returns {string} HTML string
 */
function formatGradeResults(gradeResults, type) {
    switch (type) {
        case 'title':
            return formatTitleResults(gradeResults);
        case 'tags':
            return formatTagsResults(gradeResults);
        case 'description':
            return formatDescriptionResults(gradeResults);
        default:
            return '';
    }
}

/**
 * Format title grading results
 * @private
 */
function formatTitleResults(results) {
    let html = `<strong>Title Score: ${results.total_score.toFixed(1)}/4.0</strong><br><ul>`;
    
    // Character count
    html += `<li>${results.character_count.passed ? '✓' : '✗'} Character Count: 
             ${results.character_count.score.toFixed(1)}/${results.character_count.max.toFixed(1)} 
             (${results.character_count.character_length || '?'} chars)</li>`;
    
    // Focus keywords
    html += `<li>${results.focus_keywords.passed ? '✓' : '✗'} Focus Keywords: 
             ${results.focus_keywords.score.toFixed(1)}/${results.focus_keywords.max.toFixed(1)}`;
    
    if (results.focus_keywords.keywords_found?.length > 0) {
        html += ` (Found: ${results.focus_keywords.keywords_found.join(', ')})`;
    }
    html += '</li>';
    
    // Keyword stuffing
    html += `<li>${results.keyword_stuffing.passed ? '✓' : '✗'} Keyword Stuffing: 
             ${results.keyword_stuffing.score.toFixed(1)}/${results.keyword_stuffing.max.toFixed(1)}`;
    
    if (results.keyword_stuffing.stuffed_words?.length > 0) {
        html += ` (Overused words: ${results.keyword_stuffing.stuffed_words.join(', ')})`;
    }
    html += '</li>';
    
    // Structure
    html += `<li>${results.structure.passed ? '✓' : '✗'} Structure: 
             ${results.structure.score.toFixed(1)}/${results.structure.max.toFixed(1)} 
             (${results.structure.separator_count} separators)</li>`;
    
    html += '</ul>';
    return html;
}

/**
 * Format tags grading results
 * @private
 */
function formatTagsResults(results) {
    let html = `<strong>Tags Score: ${results.total_score.toFixed(1)}/4.0</strong><br><ul>`;
    
    // Tag count
    html += `<li>${results.tag_count.passed ? '✓' : '✗'} Tag Count: 
             ${results.tag_count.score.toFixed(1)}/${results.tag_count.max.toFixed(1)} 
             (${results.tag_count.count}/13 tags)</li>`;
    
    // Multi-word tags
    html += `<li>${results.multi_word_tags.passed ? '✓' : '✗'} Multi-word Tags: 
             ${results.multi_word_tags.score.toFixed(1)}/${results.multi_word_tags.max.toFixed(1)} 
             (${results.multi_word_tags.count} multi-word tags)</li>`;
    
    // Chain structure
    html += `<li>${results.chain_structure.passed ? '✓' : '✗'} Chain Structure: 
             ${results.chain_structure.score.toFixed(1)}/${results.chain_structure.max.toFixed(1)} 
             (${results.chain_structure.count} chained tags`;
    
    if (results.chain_structure.chained_pairs?.length > 0) {
        html += `: ${results.chain_structure.chained_pairs.map(pair => 
            `"${pair.tag1}" → "${pair.tag2}"`).join(', ')}`;
    }
    html += ')</li>';
    
    // Diversity
    html += `<li>${results.diversity.passed ? '✓' : '✗'} Diversity: 
             ${results.diversity.score.toFixed(1)}/${results.diversity.max.toFixed(1)} 
             (Unique word ratio: ${results.diversity.ratio.toFixed(2)})</li>`;
    
    html += '</ul>';
    return html;
}

/**
 * Format description grading results
 * @private
 */
function formatDescriptionResults(results) {
    let html = `<strong>Description Score: ${results.total_score.toFixed(1)}/4.0</strong><br><ul>`;
    
    // Length
    html += `<li>${results.length.passed ? '✓' : '✗'} Length: 
             ${results.length.score.toFixed(1)}/${results.length.max.toFixed(1)} 
             (${results.length.word_count} words)</li>`;
    
    // Formatting
    html += `<li>${results.formatting.passed ? '✓' : '✗'} Formatting: 
             ${results.formatting.score.toFixed(1)}/${results.formatting.max.toFixed(1)} 
             (${results.formatting.has_paragraphs ? '✓' : '✗'} Paragraphs, 
              ${results.formatting.has_lists ? '✓' : '✗'} Lists, 
              ${results.formatting.has_formatting ? '✓' : '✗'} Formatting)</li>`;
    
    // Keyword integration
    html += `<li>${results.keyword_integration.passed ? '✓' : '✗'} Keyword Integration: 
             ${results.keyword_integration.score.toFixed(1)}/${results.keyword_integration.max.toFixed(1)} 
             (${results.keyword_integration.keywords_used} keywords used)</li>`;
    
    html += '</ul>';
    return html;
}

/**
 * Gets the CSS class for a given grade
 * @param {string} letterGrade - The letter grade (A, B, C, or D)
 * @returns {string} The corresponding CSS class
 */
function getGradeClass(letterGrade) {
    switch (letterGrade.toUpperCase()) {
        case 'A': return 'grade-a';
        case 'B': return 'grade-b';
        case 'C': return 'grade-c';
        case 'D': return 'grade-d';
        default: return '';
    }
}

/**
 * Determine if optimization should be allowed based on score
 * @param {number} score - The score to evaluate (0-4)
 * @returns {boolean} True if optimization is recommended
 */
function shouldAllowOptimization(score) {
    // Only allow optimization for scores below 3.0
    return score < 3.0;
}

export { 
    calculateOverallGrade, 
    formatGradeResults,
    getGradeClass,
    shouldAllowOptimization
};