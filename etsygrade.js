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
        
    // Calculate all scores with additional error checking
    let n, s, a;
    
    try {
        n = calculateTitleScore(e);
    } catch(err) {
        console.error("Error calculating title score:", err);
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
    
    try {
        s = calculateTagsScore(tags);
    } catch(err) {
        console.error("Error calculating tag score:", err);
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
    
    try {
        a = calculateDescriptionScore(t, e);
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
    i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Title</h3>\n                <span class="score-value grade-${getGrade(n.score)}">${n.score.toFixed(2)} (${getGrade(n.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Character Count (${n.charCount})</span>\n                    <span>${n.charCountScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords (${n.focusKeywords})</span>\n                    <span>${n.focusKeywordScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${n.matchingKeywords.map((e => `<span class="highlight" style="font-size: 12px; margin: 2px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n                <div class="score-item">\n                    <span>Redundancy</span>\n                    <span>${n.redundancyScore.toFixed(1)} / 0.8</span>\n                </div>\n                <div class="score-item">\n                    <span>Separators (${n.commas} total: ${n.separatorTypes.commas} commas, ${n.separatorTypes.pipes} pipes, ${n.separatorTypes.dashes} dashes)</span>\n                    <span>${n.commaScore.toFixed(1)} / 0.8</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <p>First 60 Characters (focus area):</p>\n                <div style="margin-bottom: 15px;"><span class="highlight">${e.substring(0, 60)}</span>${e.substring(60)}</div>\n            </div>\n            ${n.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${n.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Tags</h3>\n                <span class="score-value grade-${getGrade(s.score)}">${s.score.toFixed(2)} (${getGrade(s.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Tag Count (${s.tagCount}/13)</span>\n                    <span>${s.tagCountScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Multi-word Ratio (${(100 * s.multiWordRatio).toFixed(0)}%)</span>\n                    <span>${s.multiWordScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Quality (${0 === s.lowQualityTags.length ? "no low quality tags" : 1 === s.lowQualityTags.length ? "1 low quality tag (-0.5)" : s.lowQualityTags.length + " low quality tags (-1.0)"})</span>\n                    <span>${s.qualityScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Diversity (${(100 * s.diversityRatio).toFixed(0)}% unique words - ${s.diversityRatio >= .8 ? "Excellent" : s.diversityRatio >= .6 ? "Good" : s.diversityRatio >= .4 ? "Fair" : "Poor"})</span>\n                    <span>${s.diversityScore.toFixed(1)} / 1.0</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <div class="tag-container">\n                    ${tags.map((e => { const t = n.matchingKeywords.some((t => t.toLowerCase() === e.toLowerCase())), s = e.length < 10 && e.split(" ").length < 3; return `<div class="tag ${t ? "highlighted-tag" : s ? "low-quality-tag" : ""}">${e}</div>` })).join("")}\n                </div>\n            </div>\n            ${s.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${s.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Description</h3>\n                <span class="score-value grade-${getGrade(a.score)}">${a.score.toFixed(2)} (${getGrade(a.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Length (${t.length} characters, ${a.wordCount} words)</span>\n                    <span>${a.lengthScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Formatting (${a.formattingElements.hasListElements ? "Has lists" : "Missing lists"})</span>\n                    <span>${a.formattingScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Keyword Integration (${Math.round(100 * a.keywordRatio)}% in first 160 chars)</span>\n                    <span>${a.keywordScore.toFixed(1)} / 1.6</span>\n                </div>\n                <div class="score-item">\n                    <span>Missing keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${a.keywordsMissing.map((e => `<span class="missing-keyword" style="font-size: 12px; margin: 2px; background-color: #e0e0e0; color: #757575; padding: 2px 6px; border-radius: 12px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n            </div>\n            ${a.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${a.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, resultsContainer.innerHTML = i
}

function calculateTitleScore(e) {
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
    }); // Remove punctuation/separators from title for better keyword matching
    // Process the title for focus keyword detection
    // Create two versions of the title - one with hyphens preserved, one with hyphens converted to spaces
    const titleWithHyphens = e.substring(0, 60).toLowerCase()
        .replace(/[,.|:;"!?()]/g, ' ') // Remove punctuation except apostrophes, hyphens
        .replace(/\s+/g, ' ')
        .trim();

    const titleWithoutHyphens = titleWithHyphens
        .replace(/-/g, ' ') // Convert hyphens to spaces
        .replace(/\s+/g, ' ') // Normalize spaces again
        .trim();

    console.log('Title processed with hyphens:', titleWithHyphens);
    console.log('Title processed without hyphens:', titleWithoutHyphens);

    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : [];

    // Only exact matches count as focus keywords - exact phrases only
    // "balmoral sage" will only match if "balmoral sage" appears in title
    // "balmoral - sage" will NOT match "balmoral sage"
    let s = tagsArray.filter(tag => {
        const cleanTag = tag.toLowerCase();
        return titleWithHyphens.includes(cleanTag);
    });


    // Always ensure matchingKeywords is a valid array
    t.matchingKeywords = Array.isArray(s) ? s : [];
    t.focusKeywords = t.matchingKeywords.length;

    // Calculate focus keyword score based on the number of matching keywords
    // 0 keywords = 0.0 points
    // 1 keyword = 0.3 points
    // 2 keywords = 0.6 points
    // 3 keywords = 0.9 points
    // 4+ keywords = 1.2 points (max)
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

function calculateDescriptionScore(e, t) {
    console.log("calculateDescriptionScore called with:", {
        description: e ? e.substring(0, 50) + "..." : "empty",
        title: t ? t.substring(0, 50) + "..." : "empty"
    });
    
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
    
    // Calculate word count
    n.wordCount = e.split(/\s+/).filter(Boolean).length;
    
    // Calculate length score
    const s = e.length;
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
    n.formattingElements.hasListElements = /(?:^|\n)\s*(?:[\+\-\*•]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(e) || 
                                          /\*\s+\w+/.test(e) || 
                                          /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦\+])\s+/u.test(e);
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
    
    // Use tags array for focus keywords instead of extracting from title
    const tagsArray = Array.isArray(tags) ? [...tags] : [];
    
    // Check which WHOLE tags exist in the first 160 chars
    const r = tagsArray.filter(tag => first160Chars.includes(tag.toLowerCase()));
    const l = tagsArray.filter(tag => !first160Chars.includes(tag.toLowerCase()));
    
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
    console.log("Title:", e);
    console.log("Description:", t);
    console.log("Tags:", tags);
    try {
        e && t && 0 !== tags.length ? analyzeEtsyListing() : alert("Please fill in all fields and add at least one tag.");
    } catch (error) {
        console.error("Error in analyze function:", error);
    }
}));