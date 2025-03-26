
// Global tags array
const tags = [];

// Tag validation function
function validateTag(tag) {
    // Validate tag length
    if (tag.length > 20) {
        alert(`Tag "${tag}" exceeds the 20 character limit and was not added.`);
        return false;
    }
    
    // Check if we've reached the maximum
    if (tags.length >= 13) {
        alert("Maximum of 13 tags reached.");
        return false;
    }
    
    // Check for duplicate tags (case insensitive comparison)
    const isDuplicate = tags.some(existingTag => 
        existingTag.toLowerCase() === tag.toLowerCase()
    );
    
    if (isDuplicate) {
        alert(`Tag "${tag}" is already in your list. Duplicate tags are not allowed.`);
        return false;
    }
    
    return true;
}

// DOM elements
const tagContainer = document.getElementById('tagContainer');
const tagInput = document.getElementById('tagInput');
const addTagBtn = document.getElementById('addTagBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const sampleBtn = document.getElementById('sampleBtn');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const resultsContainer = document.getElementById('resultsContainer');

// Add tag function
function addTag() {
    const tagInput = document.getElementById('tagInput');
    const tagText = tagInput.value.trim();
    
    if (!tagText) return;
    
    // Handle comma-separated tags
    const tagArray = tagText.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    let tagsAdded = 0;
    
    for (let tag of tagArray) {
        // Use the common validation function
        if (validateTag(tag)) {
            tags.push(tag);
            tagsAdded++;
        }
        
        // Break out of the loop if we've reached the maximum
        if (tags.length >= 13) {
            break;
        }
    }
    
    if (tagsAdded > 0) {
        renderTags();
        tagInput.value = '';
    }
}

// Render tags
function renderTags() {
    tagContainer.innerHTML = '';
    tags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        
        const tagText = document.createElement('span');
        tagText.textContent = tag;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.onclick = function() {
            tags.splice(index, 1);
            renderTags();
        };
        
        tagElement.appendChild(tagText);
        tagElement.appendChild(removeButton);
        tagContainer.appendChild(tagElement);
    });
}

// Event listeners
addTagBtn.addEventListener('click', addTag);

document.getElementById('clearTagsBtn').addEventListener('click', function() {
    tags.length = 0;
    renderTags();
});

// Add copy tags as CSV functionality
document.getElementById('copyTagsBtn').addEventListener('click', function() {
    if (tags.length === 0) {
        alert('No tags to copy.');
        return;
    }
    
    const csvContent = tags.join(',');
    navigator.clipboard.writeText(csvContent)
        .then(() => {
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            this.style.backgroundColor = '#4CAF50';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = '';
                this.style.color = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy tags: ', err);
            alert('Failed to copy tags. Please try again.');
        });
});

tagInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTag();
        e.preventDefault();
    }
});

sampleBtn.addEventListener('click', function() {
    titleInput.value = "Handmade Ceramic Mug, Coffee Cup, Modern Pottery, Unique Gift, Kitchen Decor, Housewarming Present, Tea Cup";
    
    // Clear and add new tags
    tags.length = 0;
    
    // Define a silent validation function for sample data (no alerts)
    function validateSampleTag(tag) {
        // Validate tag length
        if (tag.length > 20) {
            console.warn(`Sample tag "${tag}" exceeds the 20 character limit and was not added.`);
            return false;
        }
        
        // Check for duplicate tags (case insensitive comparison)
        const isDuplicate = tags.some(existingTag => 
            existingTag.toLowerCase() === tag.toLowerCase()
        );
        
        if (isDuplicate) {
            console.warn(`Sample tag "${tag}" is a duplicate and was not added.`);
            return false;
        }
        
        // Check if we've reached the maximum
        if (tags.length >= 13) {
            console.warn("Maximum of 13 sample tags reached.");
            return false;
        }
        
        return true;
    }
    
    [
        "handmade ceramic mug", 
        "coffee cup", 
        "modern pottery", 
        "unique gift", 
        "kitchen decor", 
        "housewarming gift", 
        "tea cup", 
        "ceramic", 
        "pottery", 
        "mug", 
        "gift", 
        "cup", 
        "drinkware"
    ].forEach(tag => {
        if (validateSampleTag(tag)) {
            tags.push(tag);
        }
    });
    
    renderTags();
    
    descriptionInput.value = `This handmade ceramic mug is perfect for your morning coffee or afternoon tea. Each piece is handcrafted with care and attention to detail, making it a unique addition to your kitchen.

• Made from high-quality stoneware clay
• Microwave and dishwasher safe
• Holds approximately 12oz
• Dimensions: 3.5" tall x 3" diameter

This modern pottery piece makes a wonderful housewarming gift or present for the coffee lover in your life. The minimalist design complements any kitchen decor style.`;
});

analyzeBtn.addEventListener('click', function() {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!title || !description || tags.length === 0) {
        alert('Please fill in all fields and add at least one tag.');
        return;
    }
    
    // Call scoring function
    analyzeEtsyListing();
});

// Etsy Scoring System
function analyzeEtsyListing() {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    // Title scoring (4 points max)
    const titleScore = calculateTitleScore(title);
    
    // Tags scoring (4 points max)
    const tagScore = calculateTagsScore(tags);
    
    // Description scoring (4 points max)
    const descriptionScore = calculateDescriptionScore(description, title);
    
    // Calculate overall score
    const overallScore = (titleScore.score * 0.4) + (tagScore.score * 0.4) + (descriptionScore.score * 0.2);
    
    // Build HTML for results
    let resultsHTML = `
        <div class="score-card">
            <div class="score-header">
                <h3>Overall Score</h3>
                <span class="score-value grade-${getGrade(overallScore)}">${overallScore.toFixed(2)} (${getGrade(overallScore)})</span>
            </div>
        </div>
    `;
    
    // Title results
    resultsHTML += `
        <div class="score-card">
            <div class="score-header">
                <h3>Title</h3>
                <span class="score-value grade-${getGrade(titleScore.score)}">${titleScore.score.toFixed(2)} (${getGrade(titleScore.score)})</span>
            </div>
            <div class="score-details">
                <div class="score-item">
                    <span>Character Count (${titleScore.charCount})</span>
                    <span>${titleScore.charCountScore.toFixed(1)} / 1.2</span>
                </div>
                <div class="score-item">
                    <span>Focus Keywords (${titleScore.focusKeywords})</span>
                    <span>${titleScore.focusKeywordScore.toFixed(1)} / 1.2</span>
                </div>
                <div class="score-item">
                    <span>Focus Keywords:</span>
                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">
                        ${titleScore.matchingKeywords.map(keyword => 
                            `<span class="highlight" style="font-size: 12px; margin: 2px;">${keyword}</span>`
                        ).join('')}
                    </span>
                </div>
                <div class="score-item">
                    <span>Redundancy</span>
                    <span>${titleScore.redundancyScore.toFixed(1)} / 0.8</span>
                </div>
                <div class="score-item">
                    <span>Separators (${titleScore.commas} total: ${titleScore.separatorTypes.commas} commas, ${titleScore.separatorTypes.pipes} pipes, ${titleScore.separatorTypes.dashes} dashes)</span>
                    <span>${titleScore.commaScore.toFixed(1)} / 0.8</span>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <p>First 60 Characters (focus area):</p>
                <div style="margin-bottom: 15px;"><span class="highlight">${title.substring(0, 60)}</span>${title.substring(60)}</div>
            </div>
            ${titleScore.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${titleScore.recommendations.map(rec => {
                            if (typeof rec === 'string') {
                                return `<li>${rec}</li>`;
                            } else {
                                return `<li>
                                    ${rec.text}
                                    ${rec.pills && rec.pills.length > 0 ? `
                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                                            ${rec.pills.map(pill => 
                                                `<span class="pill-recommendation">${pill}</span>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                </li>`;
                            }
                        }).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    // Tags results
    resultsHTML += `
        <div class="score-card">
            <div class="score-header">
                <h3>Tags</h3>
                <span class="score-value grade-${getGrade(tagScore.score)}">${tagScore.score.toFixed(2)} (${getGrade(tagScore.score)})</span>
            </div>
            <div class="score-details">
                <div class="score-item">
                    <span>Tag Count (${tagScore.tagCount}/13)</span>
                    <span>${tagScore.tagCountScore.toFixed(1)} / 1.0</span>
                </div>
                <div class="score-item">
                    <span>Multi-word Ratio (${(tagScore.multiWordRatio * 100).toFixed(0)}%)</span>
                    <span>${tagScore.multiWordScore.toFixed(1)} / 1.0</span>
                </div>
                <div class="score-item">
                    <span>Tag Quality (${
                        tagScore.lowQualityTags.length === 0 
                            ? 'no low quality tags' 
                            : tagScore.lowQualityTags.length === 1 
                                ? '1 low quality tag (-0.5)' 
                                : tagScore.lowQualityTags.length + ' low quality tags (-1.0)'
                    })</span>
                    <span>${tagScore.qualityScore.toFixed(1)} / 1.0</span>
                </div>
                <div class="score-item">
                    <span>Tag Diversity (${(tagScore.diversityRatio * 100).toFixed(0)}% unique words - ${
                        tagScore.diversityRatio >= 0.8 ? 'Excellent' :
                        tagScore.diversityRatio >= 0.6 ? 'Good' :
                        tagScore.diversityRatio >= 0.4 ? 'Fair' : 'Poor'
                    })</span>
                    <span>${tagScore.diversityScore.toFixed(1)} / 1.0</span>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <div class="tag-container">
                    ${tags.map(tag => {
                        const isMatchingKeyword = titleScore.matchingKeywords.some(keyword => 
                            keyword.toLowerCase() === tag.toLowerCase());
                        const isLowQuality = tag.length < 10 && tag.split(' ').length < 3;
                        const tagClass = isMatchingKeyword ? 'highlighted-tag' : (isLowQuality ? 'low-quality-tag' : '');
                        return `<div class="tag ${tagClass}">${tag}</div>`;
                    }).join('')}
                </div>
            </div>
            ${tagScore.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${tagScore.recommendations.map(rec => {
                            if (typeof rec === 'string') {
                                return `<li>${rec}</li>`;
                            } else {
                                return `<li>
                                    ${rec.text}
                                    ${rec.pills && rec.pills.length > 0 ? `
                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                                            ${rec.pills.map(pill => 
                                                `<span class="pill-recommendation">${pill}</span>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                </li>`;
                            }
                        }).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    // Description results
    resultsHTML += `
        <div class="score-card">
            <div class="score-header">
                <h3>Description</h3>
                <span class="score-value grade-${getGrade(descriptionScore.score)}">${descriptionScore.score.toFixed(2)} (${getGrade(descriptionScore.score)})</span>
            </div>
            <div class="score-details">
                <div class="score-item">
                    <span>Length (${description.length} characters, ${descriptionScore.wordCount} words)</span>
                    <span>${descriptionScore.lengthScore.toFixed(1)} / 1.2</span>
                </div>
                <div class="score-item">
                    <span>Formatting (${descriptionScore.formattingElements.hasListElements ? 'Has lists' : 'Missing lists'})</span>
                    <span>${descriptionScore.formattingScore.toFixed(1)} / 1.2</span>
                </div>
                <div class="score-item">
                    <span>Keyword Integration (${Math.round(descriptionScore.keywordRatio * 100)}%)</span>
                    <span>${descriptionScore.keywordScore.toFixed(1)} / 1.6</span>
                </div>
                <div class="score-item">
                    <span>Missing keywords:</span>
                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">
                        ${descriptionScore.keywordsMissing.map(keyword => 
                            `<span class="missing-keyword" style="font-size: 12px; margin: 2px; background-color: #e0e0e0; color: #757575; padding: 2px 6px; border-radius: 12px;">${keyword}</span>`
                        ).join('')}
                    </span>
                </div>
            </div>
            ${descriptionScore.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${descriptionScore.recommendations.map(rec => {
                            if (typeof rec === 'string') {
                                return `<li>${rec}</li>`;
                            } else {
                                return `<li>
                                    ${rec.text}
                                    ${rec.pills && rec.pills.length > 0 ? `
                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                                            ${rec.pills.map(pill => 
                                                `<span class="pill-recommendation">${pill}</span>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                </li>`;
                            }
                        }).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
}

// Calculate title score
function calculateTitleScore(title) {
    const result = {
        score: 0,
        charCount: title.length,
        charCountScore: 0,
        focusKeywords: 0,
        focusKeywordScore: 0,
        repeatedWords: [],
        redundancyScore: 0,
        commas: 0,
        commaScore: 0,
        recommendations: [],
        first60Chars: title.substring(0, 60), // Using first 60 chars per request
        matchingKeywords: []
    };
    
    // 1. Character Count (1.2 points)
    if (title.length >= 70 && title.length <= 140) {
        result.charCountScore = 1.2;
    } else if (title.length >= 50 && title.length < 70) {
        result.charCountScore = 0.6;
    } else {
        result.charCountScore = 0.3;
    }
    
    if (result.charCountScore < 1.2) {
        result.recommendations.push({
            text: "Aim for 70-140 characters in your title",
            pills: []
        });
    }
    
    // 2. Focus Keywords in First 60 Characters (1.2 points)
    const first60CharsLower = title.substring(0, 60).toLowerCase();
    const focusKeywords = tags.filter(tag => first60CharsLower.includes(tag.toLowerCase()));
    result.focusKeywords = focusKeywords.length;
    result.matchingKeywords = focusKeywords;
    result.focusKeywordScore = Math.min(focusKeywords.length * 0.3, 1.2);
    
    if (result.focusKeywordScore < 0.3) {
        // Find tags not in the first 60 chars that might be good candidates
        const candidateTags = tags.filter(tag => !first60CharsLower.includes(tag.toLowerCase()))
            .slice(0, 3); // Limit to 3 suggestions
        
        result.recommendations.push({
            text: "Include at least one tag keyword in the first 60 characters",
            pills: candidateTags
        });
    }
    
    // 3. Keyword Redundancy Detection (0.8 points)
    const words = title.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
    const wordFrequency = {};
    words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    result.repeatedWords = Object.keys(wordFrequency)
        .filter(word => wordFrequency[word] > 2)
        .map(word => `${word} (${wordFrequency[word]})`);
    
    if (result.repeatedWords.length === 0) {
        result.redundancyScore = 0.8;
    }
    
    if (result.redundancyScore < 0.8) {
        result.recommendations.push({
            text: "Reduce repetition of words:",
            pills: result.repeatedWords
        });
    }
    
    // 4. Structural Elements - Separators (0.8 points)
    // Count commas, pipes, and dashes as separators
    const commas = (title.match(/,/g) || []).length;
    const pipes = (title.match(/ \| /g) || []).length;
    const dashes = (title.match(/ - /g) || []).length;
    result.commas = commas + pipes + dashes;
    result.separatorTypes = {
        commas,
        pipes,
        dashes
    };
    
    if (result.commas >= 2 && result.commas <= 6) {
        result.commaScore = 0.8;
    } else if (result.commas === 1) {
        result.commaScore = 0.4;
    } else {
        result.commaScore = 0.2;
    }
    
    if (result.commaScore < 0.8) {
        result.recommendations.push({
            text: "Use 2-6 separators (commas, pipes ' | ', or dashes ' - ') to separate keywords",
            pills: []
        });
    }
    
    result.score = result.charCountScore + result.focusKeywordScore + 
                  result.redundancyScore + result.commaScore;
    
    return result;
}

// Calculate tags score
function calculateTagsScore(tags) {
    const result = {
        score: 0,
        tagCount: tags.length,
        tagCountScore: 0,
        multiWordRatio: 0,
        multiWordScore: 0,
        lowQualityTags: [],
        qualityScore: 0,
        diversityRatio: 0,
        diversityScore: 0,
        recommendations: []
    };
    
    // 1. Tag Count (1 point)
    result.tagCountScore = Math.min((tags.length / 13), 1);
    
    if (result.tagCountScore < 1) {
        result.recommendations.push({
            text: `Use all 13 available tags (currently using ${tags.length})`,
            pills: []
        });
    }
    
    // 2. Multi-word Tag Ratio (1 point)
    const multiWordTags = tags.filter(tag => tag.split(' ').length > 1);
    result.multiWordRatio = tags.length > 0 ? multiWordTags.length / tags.length : 0;
    result.multiWordScore = result.multiWordRatio;
    
    if (result.multiWordScore < 0.7) {
        result.recommendations.push({
            text: "Use more multi-word tags for better specificity",
            pills: []
        });
    }
    
    // 3. Tag Quality (1 point)
    // Low quality tags: less than 10 characters AND fewer than 3 words
    result.lowQualityTags = tags.filter(tag => tag.length < 10 && tag.split(' ').length < 3);
    
    // Updated scoring based on number of low quality tags
    if (result.lowQualityTags.length === 0) {
        result.qualityScore = 1.0;  // No low quality tags
    } else if (result.lowQualityTags.length === 1) {
        result.qualityScore = 0.5;  // Exactly one low quality tag
    } else {
        result.qualityScore = 0.0;  // More than one low quality tag
    }
    
    if (result.qualityScore < 1) {
        const message = result.lowQualityTags.length === 1 
            ? "Improve this low quality tag (having only one low quality tag reduces your score by 50%):"
            : `Improve these ${result.lowQualityTags.length} low quality tags (having more than one low quality tag results in zero points):`;
        
        result.recommendations.push({
            text: message,
            pills: result.lowQualityTags
        });
    }
    
    // 4. Tag Diversity (1 point)
    const uniqueWords = new Set();
    let totalWords = 0;
    
    tags.forEach(tag => {
        const words = tag.toLowerCase().split(' ');
        totalWords += words.length;
        words.forEach(word => uniqueWords.add(word));
    });
    
    result.diversityRatio = totalWords > 0 ? uniqueWords.size / totalWords : 0;
    
    // Scoring match with framework.txt:
    // ≥0.8 (80%) ratio: 1.0 point
    // 0.6-0.79 (60-79%) ratio: 0.75 points
    // 0.4-0.59 (40-59%) ratio: 0.5 points
    // <0.4 ratio (less than 40%): 0.25 points
    if (result.diversityRatio >= 0.8) {
        result.diversityScore = 1;
    } else if (result.diversityRatio >= 0.6) {
        result.diversityScore = 0.75;
    } else if (result.diversityRatio >= 0.4) {
        result.diversityScore = 0.5;
    } else {
        result.diversityScore = 0.25;
    }
    
    if (result.diversityScore < 0.75) {
        // Create a more specific recommendation based on the diversity score
        let diversityMessage;
        if (result.diversityRatio < 0.4) {
            diversityMessage = `Extremely low word diversity (${(result.diversityRatio * 100).toFixed(0)}%). Use more varied words in your tags to improve from 0.25 points.`;
        } else if (result.diversityRatio < 0.6) {
            diversityMessage = `Low word diversity (${(result.diversityRatio * 100).toFixed(0)}%). Aim for at least 60% unique words to increase from 0.5 points.`;
        } else {
            diversityMessage = `Good word diversity (${(result.diversityRatio * 100).toFixed(0)}%). Aim for at least 80% unique words to achieve full points.`;
        }
        
        result.recommendations.push({
            text: diversityMessage,
            pills: []
        });
    }
    
    result.score = result.tagCountScore + result.multiWordScore + 
                  result.qualityScore + result.diversityScore;
    
    return result;
}

// calculate descirtption score
function calculateDescriptionScore(description, title) {
    const result = {
        score: 0,
        wordCount: 0,
        lengthScore: 0,
        formattingElements: { hasParagraphBreaks: false, hasListElements: false, hasFormatting: false },
        formattingScore: 0,
        keywordRatio: 0,
        keywordScore: 0,
        keywordsFound: [],
        keywordsMissing: [],
        recommendations: []
    };
    
    // 1. Length and Detail (1.2 points)
    result.wordCount = description.split(/\s+/).filter(Boolean).length;
    const charCount = description.length;
    
    // Score based on character count per framework
    if (charCount >= 160) {
        result.lengthScore = 1.2;
    } else if (charCount >= 100 && charCount < 160) {
        result.lengthScore = 0.9;
    } else if (charCount >= 50 && charCount < 100) {
        result.lengthScore = 0.6;
    } else {
        result.lengthScore = 0.3;
    }
    
    if (result.lengthScore < 0.9) {
        result.recommendations.push({
            text: "Aim for 160+ characters in your description",
            pills: []
        });
    }
    
    // 2. Structural Formatting (1.2 points)
    // Check for paragraph breaks
    const paragraphs = description.split(/\n\s*\n/);
    result.formattingElements.hasParagraphBreaks = paragraphs.length > 2 && paragraphs.some(p => p.length < 300);
    
    // Check for list elements with comprehensive pattern matching
    // Match bullet points, asterisks, plus signs, hyphens as list items, numbered lists, and lettered lists
    // Also explicitly check for standalone asterisks as list markers and common emoji list markers
    const listItemPattern = /(?:^|\n)\s*(?:[\+\-\*•]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/;
    const asteriskListPattern = /\*\s+\w+/;
    // Use Unicode property escapes to match emoji and common list marker symbols
    // Note: Unicode property escapes require ES2018+ support
    const listSymbolsPattern = /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦\+])\s+/u;
    result.formattingElements.hasListElements = listItemPattern.test(description) || 
                                               asteriskListPattern.test(description) || 
                                               listSymbolsPattern.test(description);
    
    // Check for formatting markers
    result.formattingElements.hasFormatting = /[\*\_\#]|:[\w]+:/.test(description);
    
    // All-or-nothing score: full points if list elements are present
    if (result.formattingElements.hasListElements) {
        result.formattingScore = 1.2;
    } else {
        result.formattingScore = 0;
    }
    
    if (result.formattingScore < 1.2) {
        let formatTips = [];
        if (!result.formattingElements.hasParagraphBreaks) formatTips.push("paragraph breaks");
        if (!result.formattingElements.hasListElements) formatTips.push("bullet points");
        if (!result.formattingElements.hasFormatting) formatTips.push("formatting (*, _, #)");
        
        if (formatTips.length > 0) {
            result.recommendations.push({
                text: `Add ${formatTips.join(', ')} for better readability`,
                pills: ["• Bullet point", "* Asterisk list", "1. Numbered list"]
            });
        }
    }
    
    // 3. Keyword Integration (1.6 points)
    const titleWords = title.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const descriptionLower = description.toLowerCase();
    
    const keywordsFound = titleWords.filter(word => descriptionLower.includes(word));
    const keywordsMissing = titleWords.filter(word => !descriptionLower.includes(word));
    result.keywordsFound = keywordsFound;
    result.keywordsMissing = keywordsMissing;
    result.keywordRatio = titleWords.length > 0 ? keywordsFound.length / titleWords.length : 0;
    
    result.keywordScore = Math.min(result.keywordRatio * 1.6, 1.6);
    
    if (result.keywordScore < 0.8) {
        result.recommendations.push({
            text: "Include more keywords from your title in your description:",
            pills: result.keywordsMissing
        });
    }
    
    result.score = result.lengthScore + result.formattingScore + result.keywordScore;
    
    return result;
}

// Helper function to get grade from score
function getGrade(score) {
    if (score >= 3.5) return 'A';
    if (score >= 2.5) return 'B';
    if (score >= 1.5) return 'C';
    return 'D';
}