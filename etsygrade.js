const tags = [];

function validateTag(e) {
    if (e.length > 20) return alert(`Tag "${e}" exceeds the 20 character limit and was not added.`), !1;
    if (tags.length >= 13) return alert("Maximum of 13 tags reached."), !1;
    return !tags.some((t => t.toLowerCase() === e.toLowerCase())) || (alert(`Tag "${e}" is already in your list. Duplicate tags are not allowed.`), !1)
}
const tagContainer = document.getElementById("tagContainer"),
    tagInput = document.getElementById("tagInput"),
    addTagBtn = document.getElementById("addTagBtn"),
    analyzeBtn = document.getElementById("analyzeBtn"),
    sampleBtn = document.getElementById("sampleBtn"),
    titleInput = document.getElementById("titleInput"),
    descriptionInput = document.getElementById("descriptionInput"),
    resultsContainer = document.getElementById("resultsContainer");

function addTag() {
    const e = document.getElementById("tagInput"),
        t = e.value.trim();
    if (!t) return;
    const n = t.split(",").map((e => e.trim())).filter((e => e));
    let s = 0;
    for (let e of n)
        if (validateTag(e) && (tags.push(e), s++), tags.length >= 13) break;
    s > 0 && (renderTags(), e.value = "")
}

function renderTags() {
    tagContainer.innerHTML = "", tags.forEach(((e, t) => {
        const n = document.createElement("div");
        n.className = "tag";
        const s = document.createElement("span");
        s.textContent = e;
        const a = document.createElement("button");
        a.textContent = "×", a.onclick = function () {
            tags.splice(t, 1), renderTags()
        }, n.appendChild(s), n.appendChild(a), tagContainer.appendChild(n)
    }))
}

function analyzeEtsyListing() {
    console.log("Starting analyzeEtsyListing function");
    const e = titleInput.value.trim(),
        t = descriptionInput.value.trim();
        
    // track scores for title (n), tags (s), description (a)
    let n, s, a;
    
    // Step 1- process tags score with error handling
    try {
        s = calculateTagsScore(tags);
    } catch(err) {
        console.error("Error calculating tag score:", err);
        // fallback to zero scores
        s = { 
            score: 0, 
            tagCount: 0,
            tagCountScore: 0, 
            multiWordRatio: 0,
            multiWordScore: 0, 
            lowQualityTags: [],
            qualityScore: 0, 
            diversityRatio: 0,
            diversityScore: 0, 
            recommendations: [] 
        };
    }
    console.log("Tag score calculated:", s);
    
    // step 2-  Process title score with error handling
    try {
        n = calculateTitleScore(e);
    } catch(err) {
        console.error("Error calculating title score:", err);
        // Fallback to zero scores
        n = { 
            score: 0, 
            charCount: 0,
            charCountScore: 0, 
            focusKeywords: 0,
            focusKeywordScore: 0, 
            redundancyScore: 0, 
            commas: 0,
            commaScore: 0, 
            separatorTypes: { commas: 0, pipes: 0, dashes: 0 },
            matchingKeywords: [],
            recommendations: [] 
        };
    }
    console.log("Title score calculated:", n);
    
    // step 3- process description score with error handling
    try {
        // create copy of tags for processing
        const currentTags = [...tags];
        console.log("Using tags for description score:", currentTags);
        
        // initialize score object
        a = {
            score: 0,
            wordCount: 0,
            lengthScore: 0,
            formattingElements: {
                hasParagraphBreaks: false,
                hasListElements: false,
                hasFormatting: false
            },
            formattingScore: 0,
            keywordRatio: 0,
            keywordScore: 0,
            keywordsFound: [],
            keywordsMissing: [],
            recommendations: []
        };
        
        // count words in description
        a.wordCount = t.split(/\s+/).filter(Boolean).length;
        
        // score description length (higher score for longer descriptions)
        const descLength = t.length;
        if (descLength >= 1151) {
            a.lengthScore = 1.2;  // maximum score
        } else if (descLength >= 787 && descLength <= 1150) {
            a.lengthScore = 0.9;  // good score
        } else if (descLength >= 393 && descLength <= 786) {
            a.lengthScore = 0.6;  // medium score
        } else if (descLength >= 160 && descLength <= 392) {
            a.lengthScore = 0.3;  // low score
        } else {
            a.lengthScore = 0;    // no points
        }
        
        // recommend longer description if below optimal length
        if (a.lengthScore < 0.9) {
            a.recommendations.push({
                text: "Aim for 1151+ characters in your description for maximum points",
                pills: []
            });
        }
        
        // detect paragraph breaks and formatting
        const paragraphs = t.split(/\n\s*\n/);
        a.formattingElements.hasParagraphBreaks = paragraphs.length > 2 && 
            paragraphs.some(section => section.length < 300);
            
        // detect bullet points and list elements
        a.formattingElements.hasListElements = /(?:^|\n)\s*(?:[\+\-\*•●►]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(t) || 
                                              /\*\s+\w+/.test(t) || 
                                              /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦●►\+])\s+/u.test(t);
                                              
        // detect markdown formatting
        a.formattingElements.hasFormatting = /[\*\_\#]|:[\w]+:/.test(t);
        
        // award points for list elements
        a.formattingScore = a.formattingElements.hasListElements ? 1.2 : 0;
        
        // suggest missing formatting elements
        if (a.formattingScore < 1.2) {
            let missingElements = [];
            if (!a.formattingElements.hasParagraphBreaks) {
                missingElements.push("paragraph breaks");
            }
            if (!a.formattingElements.hasListElements) {
                missingElements.push("bullet points");
            }
            if (!a.formattingElements.hasFormatting) {
                missingElements.push("formatting (*, _, #)");
            }
            
            if (missingElements.length > 0) {
                a.recommendations.push({
                    text: `Add ${missingElements.join(", ")} for better readability`,
                    pills: ["• Bullet point", "* Asterisk list", "1. Numbered list"]
                });
            }
        }
        
        // check for keywords in first 160 chars (most visible in search)
        const first160Chars = t.substring(0, 160).toLowerCase();
        
        // use matching keywords from title analysis
        const focusKeywords = n.matchingKeywords;
        console.log("Using MATCHING KEYWORDS from title:", focusKeywords);
        
        // identify which keywords appear in description intro
        const foundKeywords = focusKeywords.filter(tag => {
            return first160Chars.includes(tag.toLowerCase());
        });
        
        // identify which keywords are missing from intro
        const missingKeywords = focusKeywords.filter(tag => {
            return !first160Chars.includes(tag.toLowerCase());
        });
        
        a.keywordsFound = foundKeywords;
        a.keywordsMissing = missingKeywords;
        
        // calculate keyword score based on percentage found
        a.keywordRatio = focusKeywords.length > 0 ? 
            foundKeywords.length / focusKeywords.length : 0;
        a.keywordScore = Math.min(1.6 * a.keywordRatio, 1.6);
        
        // recommend adding missing keywords to intro
        if (a.keywordScore < 0.8) {
            a.recommendations.push({
                text: "Include these focus keywords from your title in the first 160 characters of your description:",
                pills: a.keywordsMissing
            });
        }
        
        // sum individual scores for total description score
        a.score = a.lengthScore + a.formattingScore + a.keywordScore;
        
    } catch(err) {
        console.error("Error calculating description score:", err);
        a = { 
            score: 0,
            wordCount: 0, 
            lengthScore: 0, 
            formattingElements: {
                hasParagraphBreaks: false,
                hasListElements: false,
                hasFormatting: false
            },
            formattingScore: 0, 
            keywordRatio: 0,
            keywordScore: 0,
            keywordsFound: [],
            keywordsMissing: [],
            recommendations: [] 
        };
    }
    console.log("Description score calculated:", a);
    
    // Calculate overall score
    const o = .4 * (n?.score || 0) + .4 * (s?.score || 0) + .2 * (a?.score || 0);
    let i = `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Overall Score</h3>\n                <span class="score-value grade-${getGrade(o)}">${o.toFixed(2)} (${getGrade(o)})</span>\n            </div>\n        </div>\n    `;
    i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Title</h3>\n                <span class="score-value grade-${getGrade(n.score)}">${n.score.toFixed(2)} (${getGrade(n.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Character Count (${n.charCount})</span>\n                    <span>${n.charCountScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords (${n.focusKeywords})</span>\n                    <span>${n.focusKeywordScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${n.matchingKeywords.map((e => `<span class="highlight" style="font-size: 12px; margin: 2px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n                <div class="score-item">\n                    <span>Redundancy</span>\n                    <span>${n.redundancyScore.toFixed(1)} / 0.8</span>\n                </div>\n                <div class="score-item">\n                    <span>Separators (${n.commas} total: ${n.separatorTypes.commas} commas, ${n.separatorTypes.pipes} pipes, ${n.separatorTypes.dashes} dashes)</span>\n                    <span>${n.commaScore.toFixed(1)} / 0.8</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <p>First 60 Characters (focus area):</p>\n                <div style="margin-bottom: 15px;"><span class="highlight">${e.substring(0, 60)}</span>${e.substring(60)}</div>\n            </div>\n            ${n.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${n.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Tags</h3>\n                <span class="score-value grade-${getGrade(s.score)}">${s.score.toFixed(2)} (${getGrade(s.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Tag Count (${s.tagCount}/13)</span>\n                    <span>${s.tagCountScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Multi-word Ratio (${(100 * s.multiWordRatio).toFixed(0)}%)</span>\n                    <span>${s.multiWordScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Quality (${0 === s.lowQualityTags.length ? "no low quality tags" : 1 === s.lowQualityTags.length ? "1 low quality tag (-0.5)" : s.lowQualityTags.length + " low quality tags (-1.0)"})</span>\n                    <span>${s.qualityScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Diversity (${(100 * s.diversityRatio).toFixed(0)}% unique words - ${s.diversityRatio >= .8 ? "Excellent" : s.diversityRatio >= .6 ? "Good" : s.diversityRatio >= .4 ? "Fair" : "Poor"})</span>\n                    <span>${s.diversityScore.toFixed(1)} / 1.0</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <div class="tag-container">\n                    ${tags.map((e => { const t = n.matchingKeywords.some((t => t.toLowerCase() === e.toLowerCase())), s = e.length < 10 && e.split(" ").length < 3; return `<div class="tag ${t ? "highlighted-tag" : s ? "low-quality-tag" : ""}">${e}</div>` })).join("")}\n                </div>\n            </div>\n            ${s.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${s.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Description</h3>\n                <span class="score-value grade-${getGrade(a.score)}">${a.score.toFixed(2)} (${getGrade(a.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Length (${t.length} characters, ${a.wordCount} words)</span>\n                    <span>${a.lengthScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Formatting (${a.formattingElements.hasListElements ? "Has lists" : "Missing lists"})</span>\n                    <span>${a.formattingScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Title Keyword Integration (${Math.round(100 * a.keywordRatio)}% in first 160 chars)</span>\n                    <span>${a.keywordScore.toFixed(1)} / 1.6</span>\n                </div>\n                <div class="score-item">\n                    <span>Missing keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${a.keywordsMissing.map((e => `<span class="missing-keyword" style="font-size: 12px; margin: 2px; background-color: #e0e0e0; color: #757575; padding: 2px 6px; border-radius: 12px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n            </div>\n            ${a.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${a.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, resultsContainer.innerHTML = i
}

function calculateTitleScore(e) {
    // initialize title score object with all metrics
    const t = {
        score: 0,
        charCount: e.length,
        charCountScore: 0,
        focusKeywords: 0,
        focusKeywordScore: 0,
        repeatedWords: [],
        redundancyScore: 0,
        commas: 0,
        commaScore: 0,
        recommendations: [],
        first60Chars: e.substring(0, 60),
        matchingKeywords: []
    };
    e.length >= 70 && e.length <= 140 ? t.charCountScore = 1.2 : e.length >= 50 && e.length < 70 ? t.charCountScore = .6 : t.charCountScore = .3, t.charCountScore < 1.2 && t.recommendations.push({
        text: "Aim for 70-140 characters in your title",
        pills: []
    }); 
    
    // process title for keyword matching (preserve hyphens)
    const titleWithHyphens = e.substring(0, 60).toLowerCase()
        .replace(/[,.|:;"!?()]/g, ' ') // keep apostrophes and hyphens
        .replace(/\s+/g, ' ')
        .trim();

    // alternative version with hyphens converted to spaces
    const titleWithoutHyphens = titleWithHyphens
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    console.log('Title processed with hyphens:', titleWithHyphens);
    console.log('Title processed without hyphens:', titleWithoutHyphens);

    // ensure tags array is valid
    const tagsArray = Array.isArray(tags) ? tags : [];

    // find exact phrase matches between tags and title
    let s = tagsArray.filter(tag => {
        const cleanTag = tag.toLowerCase();
        return titleWithHyphens.includes(cleanTag);
    });

    // store matching keywords
    t.matchingKeywords = Array.isArray(s) ? s : [];
    t.focusKeywords = t.matchingKeywords.length;

    // scoring: 0.3 points per keyword (max 1.2)
    // 0 keywords = 0 points, 1 = 0.3, 2 = 0.6, 3 = 0.9, 4+ = 1.2
    t.focusKeywordScore = Math.min(.3 * t.focusKeywords, 1.2);

    if (t.focusKeywordScore < .3) {
        // Suggest tags that aren't in the title
        const e = tagsArray.filter((e => !titleWithHyphens.includes(e.toLowerCase()))).slice(0, 3);
        t.recommendations.push({
            text: "Include at least one tag keyword in the first 60 characters",
            pills: e
        })
    }
    const a = e.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [],
        o = {};
    a.forEach((e => {
        o[e] = (o[e] || 0) + 1
    })), t.repeatedWords = Object.keys(o).filter((e => o[e] > 2)).map((e => `${e} (${o[e]})`)), 0 === t.repeatedWords.length && (t.redundancyScore = .8), t.redundancyScore < .8 && t.recommendations.push({
        text: "Reduce repetition of words:",
        pills: t.repeatedWords
    });
    const i = (e.match(/,/g) || []).length,
        r = (e.match(/ \| /g) || []).length,
        l = (e.match(/ - /g) || []).length;
    return t.commas = i + r + l, t.separatorTypes = {
        commas: i,
        pipes: r,
        dashes: l
    }, t.commas >= 2 ? t.commaScore = .8 : 1 === t.commas ? t.commaScore = .4 : t.commaScore = .2, t.commaScore < .8 && t.recommendations.push({
        text: "Use 2+ separators (commas, pipes ' | ', or dashes ' - ') to separate keywords",
        pills: []
    }), t.score = t.charCountScore + t.focusKeywordScore + t.redundancyScore + t.commaScore, t
}

function calculateTagsScore(e) {
    // initialize tag score object
    const t = {
        score: 0,
        tagCount: e.length,
        tagCountScore: 0,
        multiWordRatio: 0,
        multiWordScore: 0,
        lowQualityTags: [],
        qualityScore: 0,
        diversityRatio: 0,
        diversityScore: 0,
        recommendations: []
    };
    t.tagCountScore = Math.min(e.length / 13, 1), t.tagCountScore < 1 && t.recommendations.push({
        text: `Use all 13 available tags (currently using ${e.length})`,
        pills: []
    });
    const n = e.filter((e => e.split(" ").length > 1));
    if (t.multiWordRatio = e.length > 0 ? n.length / e.length : 0, t.multiWordScore = t.multiWordRatio, t.multiWordScore < .7 && t.recommendations.push({
            text: "Use more multi-word tags for better specificity",
            pills: []
        }), t.lowQualityTags = e.filter((e => e.length < 10 && e.split(" ").length < 3)), 0 === t.lowQualityTags.length ? t.qualityScore = 1 : 1 === t.lowQualityTags.length ? t.qualityScore = .5 : t.qualityScore = 0, t.qualityScore < 1) {
        const e = 1 === t.lowQualityTags.length ? "Improve this low quality tag (having only one low quality tag reduces your score by 50%):" : `Improve these ${t.lowQualityTags.length} low quality tags (having more than one low quality tag results in zero points):`;
        t.recommendations.push({
            text: e,
            pills: t.lowQualityTags
        })
    }
    const s = new Set;
    let a = 0;
    if (e.forEach((e => {
            const t = e.toLowerCase().split(" ");
            a += t.length, t.forEach((e => s.add(e)))
        })), t.diversityRatio = a > 0 ? s.size / a : 0, 
        t.diversityRatio >= .8 ? t.diversityScore = 1 : t.diversityRatio >= .6 ? t.diversityScore = .8 : t.diversityRatio >= .4 ? t.diversityScore = .5 : t.diversityScore = .2, 
        t.diversityScore < .8) {
        let e;
        e = t.diversityRatio < .4 ? `Extremely low word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Use more varied words in your tags to improve from 0.2 points.` : t.diversityRatio < .6 ? `Low word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Aim for at least 60% unique words to increase from 0.5 points.` : t.diversityRatio < .8 ? `Good word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Aim for at least 80% unique words to achieve full points.` : `Excellent word diversity (${(100 * t.diversityRatio).toFixed(0)}%).`, t.recommendations.push({
            text: e,
            pills: []
        })
    }
    return t.score = t.tagCountScore + t.multiWordScore + t.qualityScore + t.diversityScore, t
}

function calculateDescriptionScore(e, t, focusKeywords) {
    // log function call parameters
    console.log("calculateDescriptionScore called with:", {
        description: e ? e.substring(0, 50) + "..." : "empty",
        title: t ? t.substring(0, 50) + "..." : "empty"
    });
    
    // verify keywords parameter type
    console.log("FOCUS KEYWORDS PASSED TO FUNCTION:", focusKeywords);
    console.log("FOCUS KEYWORDS TYPE:", typeof focusKeywords);
    console.log("IS ARRAY:", Array.isArray(focusKeywords));
    
    // initialize description score object
    const n = {
        score: 0,
        wordCount: 0,
        lengthScore: 0,
        formattingElements: {
            hasParagraphBreaks: false,
            hasListElements: false,
            hasFormatting: false
        },
        formattingScore: 0,
        keywordRatio: 0,
        keywordScore: 0,
        keywordsFound: [],
        keywordsMissing: [],
        recommendations: []
    };
    
    // count words in description
    n.wordCount = e.split(/\s+/).filter(Boolean).length;
    
    // get character count for scoring
    const s = e.length;
    
    // log description details for debugging
    console.log("SINGLE SCORE TOOL - Description length:", s);
    console.log("SINGLE SCORE TOOL - First 100 chars:", JSON.stringify(e.substring(0, 100)));
    console.log("SINGLE SCORE TOOL - Newline count:", (e.match(/\n/g) || []).length);
    
    // character breakdown for batch processor comparison
    const whitespaceCount = (e.match(/\s/g) || []).length;
    const alphanumCount = (e.match(/[a-zA-Z0-9]/g) || []).length;
    const punctCount = (e.match(/[.,;:!?'"()[\]{}]/g) || []).length;
    console.log('SINGLE SCORE TOOL - Character breakdown:', {
        whitespace: whitespaceCount,
        alphanumeric: alphanumCount,
        punctuation: punctCount,
        other: e.length - whitespaceCount - alphanumCount - punctCount
    });
    
    if (s >= 1151) {
        n.lengthScore = 1.2;
    } else if (s >= 787 && s <= 1150) {
        n.lengthScore = 0.9;
    } else if (s >= 393 && s <= 786) {
        n.lengthScore = 0.6;
    } else if (s >= 160 && s <= 392) {
        n.lengthScore = 0.3;
    } else {
        n.lengthScore = 0;
    }
    
    // Add recommendation if needed
    if (n.lengthScore < 0.9) {
        n.recommendations.push({
            text: "Aim for 1151+ characters in your description for maximum points",
            pills: []
        });
    }
    
    // Calculate formatting score
    const a = e.split(/\n\s*\n/);
    n.formattingElements.hasParagraphBreaks = a.length > 2 && a.some(section => section.length < 300);
    n.formattingElements.hasListElements = /(?:^|\n)\s*(?:[\+\-\*•●►]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(e) || 
                                          /\*\s+\w+/.test(e) || 
                                          /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦●►\+])\s+/u.test(e);
    n.formattingElements.hasFormatting = /[\*\_\#]|:[\w]+:/.test(e);
    
    if (n.formattingElements.hasListElements) {
        n.formattingScore = 1.2;
    } else {
        n.formattingScore = 0;
    }
    
    // Add formatting recommendations
    if (n.formattingScore < 1.2) {
        let missingElements = [];
        if (!n.formattingElements.hasParagraphBreaks) {
            missingElements.push("paragraph breaks");
        }
        if (!n.formattingElements.hasListElements) {
            missingElements.push("bullet points");
        }
        if (!n.formattingElements.hasFormatting) {
            missingElements.push("formatting (*, _, #)");
        }
        
        if (missingElements.length > 0) {
            n.recommendations.push({
                text: `Add ${missingElements.join(", ")} for better readability`,
                pills: ["• Bullet point", "* Asterisk list", "1. Numbered list"]
            });
        }
    }
    
    // Get the first 160 chars of description for keyword checking
    const first160Chars = e.substring(0, 160).toLowerCase();
    
    // log available tags
    console.log("Global tags array:", tags);
    
    // use provided keywords with array validation
    const tagsArray = Array.isArray(focusKeywords) ? focusKeywords : [];
    console.log("Final tags array for analysis:", tagsArray);
    
    // check which keywords appear in first 160 chars
    const r = tagsArray.filter(tag => {
        const tagLower = tag.toLowerCase();
        return first160Chars.includes(tagLower);
    });
    
    // create list of keywords missing from intro
    const l = tagsArray.filter(tag => !r.includes(tag));
    
    // Set the results and calculate score
    n.keywordsFound = r; 
    n.keywordsMissing = l;
    n.keywordRatio = tagsArray.length > 0 ? r.length / tagsArray.length : 0;
    n.keywordScore = Math.min(1.6 * n.keywordRatio, 1.6);
    
    // Add keyword recommendation if needed
    if (n.keywordScore < 0.8) {
        n.recommendations.push({
            text: "Include more focus keywords (tags) in the first 160 characters of your description:",
            pills: n.keywordsMissing
        });
    }
    
    // Calculate the final score
    n.score = n.lengthScore + n.formattingScore + n.keywordScore;
    
    // Return the result
    return n;
}

function getGrade(e) {
    return e >= 3.5 ? "A" : e >= 2.5 ? "B" : e >= 1.5 ? "C" : "D"
}
// custom function to test description keyword matching with specific focus keywords
// For quick testing of specific focus keywords with description
function testDescriptionWithFocusKeywords(description, focusKeywords) {
    if (!Array.isArray(focusKeywords)) {
        focusKeywords = focusKeywords.split(',').map(k => k.trim());
    }
    
    console.log(`Testing description with focus keywords: ${focusKeywords.join(', ')}`);
    const result = calculateDescriptionScore(description, "", focusKeywords);
    console.log(`Score: ${result.keywordScore.toFixed(1)}/1.6 (${result.keywordsFound.length}/${focusKeywords.length} keywords found)`);
    console.log(`Found: ${result.keywordsFound.join(', ')}`);
    console.log(`Missing: ${result.keywordsMissing.join(', ')}`);
    
    return result;
}

// Check if elements exist before adding event listeners
if (addTagBtn) addTagBtn.addEventListener("click", addTag);
if (document.getElementById("clearTagsBtn")) document.getElementById("clearTagsBtn").addEventListener("click", (function () {
    tags.length = 0, renderTags()
}));
if (document.getElementById("copyTagsBtn")) document.getElementById("copyTagsBtn").addEventListener("click", (function () {
    if (0 === tags.length) return void alert("No tags to copy.");
    const e = tags.join(",");
    navigator.clipboard.writeText(e).then((() => {
        const e = this.textContent;
        this.textContent = "Copied!", this.style.backgroundColor = "#4CAF50", this.style.color = "white", setTimeout((() => {
            this.textContent = e, this.style.backgroundColor = "", this.style.color = ""
        }), 2e3)
    })).catch((e => {
        alert("Failed to copy tags. Please try again.")
    }))
})), tagInput.addEventListener("keypress", (function (e) {
    "Enter" === e.key && (addTag(), e.preventDefault())
})), sampleBtn.addEventListener("click", (function () {
    titleInput.value = "Handmade Ceramic Mug, Coffee Cup, Modern Pottery, Unique Gift, Kitchen Decor, Housewarming Present, Tea Cup", tags.length = 0, ["handmade ceramic mug", "coffee cup", "modern pottery", "unique gift", "kitchen decor", "housewarming gift", "tea cup", "ceramic", "pottery", "mug", "gift", "cup", "drinkware"].forEach((e => {
        (function (e) {
            return !(e.length > 20) && !(tags.some((t => t.toLowerCase() === e.toLowerCase())) || tags.length >= 13)
        })(e) && tags.push(e)
    })), renderTags(), descriptionInput.value = 'This handmade ceramic mug is perfect for your morning coffee or afternoon tea. Each piece is handcrafted with care and attention to detail, making it a unique addition to your kitchen.\n\n• Made from high-quality stoneware clay\n• Microwave and dishwasher safe\n• Holds approximately 12oz\n• Dimensions: 3.5" tall x 3" diameter\n\nThis modern pottery piece makes a wonderful housewarming gift or present for the coffee lover in your life. The minimalist design complements any kitchen decor style.'
})), analyzeBtn.addEventListener("click", (function () {
    console.log("Analyze button clicked");
    const e = titleInput.value.trim(),
        t = descriptionInput.value.trim();
        
    // optional comparison with batch processor data
    try {
        const batchDescription = localStorage.getItem('batchDescription');
        if (batchDescription) {
            console.log('Found batch description in localStorage for comparison');
            // If we have the comparison function from batch-processor
            if (typeof analyzeStringDifferences === 'function') {
                analyzeStringDifferences(batchDescription, t);
            } else {
                // fallback to basic length comparison
                console.log('COMPARE - Batch length:', batchDescription.length);
                console.log('COMPARE - Single length:', t.length);
                console.log('COMPARE - Difference:', batchDescription.length - t.length);
            }
        }
    } catch (e) {
        console.error('Error comparing descriptions:', e);
    }
    
    console.log("Title:", e);
    console.log("Description:", t);
    console.log("Tags:", tags);
    
    try {
        e && t && 0 !== tags.length ? analyzeEtsyListing() : alert("Please fill in all fields and add at least one tag.");
    } catch (error) {
        console.error("Error in analyze function:", error);
    }
}));