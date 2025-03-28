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
    const e = titleInput.value.trim(),
        t = descriptionInput.value.trim(),
        n = calculateTitleScore(e),
        s = calculateTagsScore(tags),
        a = calculateDescriptionScore(t, e),
        o = .4 * n.score + .4 * s.score + .2 * a.score;
    let i = `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Overall Score</h3>\n                <span class="score-value grade-${getGrade(o)}">${o.toFixed(2)} (${getGrade(o)})</span>\n            </div>\n        </div>\n    `;
    i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Title</h3>\n                <span class="score-value grade-${getGrade(n.score)}">${n.score.toFixed(2)} (${getGrade(n.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Character Count (${n.charCount})</span>\n                    <span>${n.charCountScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords (${n.focusKeywords})</span>\n                    <span>${n.focusKeywordScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Focus Keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${n.matchingKeywords.map((e => `<span class="highlight" style="font-size: 12px; margin: 2px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n                <div class="score-item">\n                    <span>Redundancy</span>\n                    <span>${n.redundancyScore.toFixed(1)} / 0.8</span>\n                </div>\n                <div class="score-item">\n                    <span>Separators (${n.commas} total: ${n.separatorTypes.commas} commas, ${n.separatorTypes.pipes} pipes, ${n.separatorTypes.dashes} dashes)</span>\n                    <span>${n.commaScore.toFixed(1)} / 0.8</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <p>First 60 Characters (focus area):</p>\n                <div style="margin-bottom: 15px;"><span class="highlight">${e.substring(0, 60)}</span>${e.substring(60)}</div>\n            </div>\n            ${n.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${n.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Tags</h3>\n                <span class="score-value grade-${getGrade(s.score)}">${s.score.toFixed(2)} (${getGrade(s.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Tag Count (${s.tagCount}/13)</span>\n                    <span>${s.tagCountScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Multi-word Ratio (${(100 * s.multiWordRatio).toFixed(0)}%)</span>\n                    <span>${s.multiWordScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Quality (${0 === s.lowQualityTags.length ? "no low quality tags" : 1 === s.lowQualityTags.length ? "1 low quality tag (-0.5)" : s.lowQualityTags.length + " low quality tags (-1.0)"})</span>\n                    <span>${s.qualityScore.toFixed(1)} / 1.0</span>\n                </div>\n                <div class="score-item">\n                    <span>Tag Diversity (${(100 * s.diversityRatio).toFixed(0)}% unique words - ${s.diversityRatio >= .8 ? "Excellent" : s.diversityRatio >= .6 ? "Good" : s.diversityRatio >= .4 ? "Fair" : "Poor"})</span>\n                    <span>${s.diversityScore.toFixed(1)} / 1.0</span>\n                </div>\n            </div>\n            <div style="margin-top: 15px;">\n                <div class="tag-container">\n                    ${tags.map((e => { const t = n.matchingKeywords.some((t => t.toLowerCase() === e.toLowerCase())), s = e.length < 10 && e.split(" ").length < 3; return `<div class="tag ${t ? "highlighted-tag" : s ? "low-quality-tag" : ""}">${e}</div>` })).join("")}\n                </div>\n            </div>\n            ${s.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${s.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, i += `\n        <div class="score-card">\n            <div class="score-header">\n                <h3>Description</h3>\n                <span class="score-value grade-${getGrade(a.score)}">${a.score.toFixed(2)} (${getGrade(a.score)})</span>\n            </div>\n            <div class="score-details">\n                <div class="score-item">\n                    <span>Length (${t.length} characters, ${a.wordCount} words)</span>\n                    <span>${a.lengthScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Formatting (${a.formattingElements.hasListElements ? "Has lists" : "Missing lists"})</span>\n                    <span>${a.formattingScore.toFixed(1)} / 1.2</span>\n                </div>\n                <div class="score-item">\n                    <span>Keyword Integration (${Math.round(100 * a.keywordRatio)}%)</span>\n                    <span>${a.keywordScore.toFixed(1)} / 1.6</span>\n                </div>\n                <div class="score-item">\n                    <span>Missing keywords:</span>\n                    <span style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end">\n                        ${a.keywordsMissing.map((e => `<span class="missing-keyword" style="font-size: 12px; margin: 2px; background-color: #e0e0e0; color: #757575; padding: 2px 6px; border-radius: 12px;">${e}</span>`)).join("")}\n                    </span>\n                </div>\n            </div>\n            ${a.recommendations.length > 0 ? `\n                <div class="recommendations">\n                    <h4>Recommendations</h4>\n                    <ul>\n                        ${a.recommendations.map((e => "string" == typeof e ? `<li>${e}</li>` : `<li>\n                                    ${e.text}\n                                    ${e.pills && e.pills.length > 0 ? `\n                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">\n                                            ${e.pills.map((e => `<span class="pill-recommendation">${e}</span>`)).join("")}\n                                        </div>\n                                    ` : ""}\n                                </li>`)).join("")}\n                    </ul>\n                </div>\n            ` : ""}\n        </div>\n    `, resultsContainer.innerHTML = i
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
    const n = e.substring(0, 60).toLowerCase().replace(/[,.|\-:;'"!?()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : [];
    
    // Improved focus keyword detection - be more lenient with matches
    // 1. First try exact matches
    let s = tagsArray.filter(tag => {
        const cleanTag = tag.toLowerCase();
        return n.includes(cleanTag);
    });
    
    // 2. If no exact matches, try more flexible matching (individual words)
    if (s.length === 0) {
        const titleWords = n.split(/\s+/);
        s = tagsArray.filter(tag => {
            const tagWords = tag.toLowerCase().split(/\s+/);
            // Check if any word from the tag appears in the title
            return tagWords.some(word => {
                // Only consider words with 4+ characters to avoid matching too generic terms
                if (word.length < 4) return false; 
                return titleWords.includes(word);
            });
        });
    }
    
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
        const e = tagsArray.filter((e => !n.includes(e.toLowerCase()))).slice(0, 3);
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
        })), t.diversityRatio = a > 0 ? s.size / a : 0, t.diversityRatio >= .8 ? t.diversityScore = 1 : t.diversityRatio >= .6 ? t.diversityScore = .75 : t.diversityRatio >= .4 ? t.diversityScore = .5 : t.diversityScore = .25, t.diversityScore < .75) {
        let e;
        e = t.diversityRatio < .4 ? `Extremely low word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Use more varied words in your tags to improve from 0.25 points.` : t.diversityRatio < .6 ? `Low word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Aim for at least 60% unique words to increase from 0.5 points.` : `Good word diversity (${(100 * t.diversityRatio).toFixed(0)}%). Aim for at least 80% unique words to achieve full points.`, t.recommendations.push({
            text: e,
            pills: []
        })
    }
    return t.score = t.tagCountScore + t.multiWordScore + t.qualityScore + t.diversityScore, t
}

function calculateDescriptionScore(e, t) {
    const n = {
        score: 0,
        wordCount: 0,
        lengthScore: 0,
        formattingElements: {
            hasParagraphBreaks: !1,
            hasListElements: !1,
            hasFormatting: !1
        },
        formattingScore: 0,
        keywordRatio: 0,
        keywordScore: 0,
        keywordsFound: [],
        keywordsMissing: [],
        recommendations: []
    };
    n.wordCount = e.split(/\s+/).filter(Boolean).length;
    const s = e.length;
    n.lengthScore = s >= 160 ? 1.2 : s >= 100 && s < 160 ? .9 : s >= 50 && s < 100 ? .6 : .3, n.lengthScore < .9 && n.recommendations.push({
        text: "Aim for 160+ characters in your description",
        pills: []
    });
    const a = e.split(/\n\s*\n/);
    n.formattingElements.hasParagraphBreaks = a.length > 2 && a.some((e => e.length < 300));
    if (n.formattingElements.hasListElements = /(?:^|\n)\s*(?:[\+\-\*•]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(e) || /\*\s+\w+/.test(e) || /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦\+])\s+/u.test(e), n.formattingElements.hasFormatting = /[\*\_\#]|:[\w]+:/.test(e), n.formattingElements.hasListElements ? n.formattingScore = 1.2 : n.formattingScore = 0, n.formattingScore < 1.2) {
        let e = [];
        n.formattingElements.hasParagraphBreaks || e.push("paragraph breaks"), n.formattingElements.hasListElements || e.push("bullet points"), n.formattingElements.hasFormatting || e.push("formatting (*, _, #)"), e.length > 0 && n.recommendations.push({
            text: `Add ${e.join(", ")} for better readability`,
            pills: ["• Bullet point", "* Asterisk list", "1. Numbered list"]
        })
    }
    const o = t.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [],
        i = e.toLowerCase(),
        r = o.filter((e => i.includes(e))),
        l = o.filter((e => !i.includes(e)));
    return n.keywordsFound = r, n.keywordsMissing = l, n.keywordRatio = o.length > 0 ? r.length / o.length : 0, n.keywordScore = Math.min(1.6 * n.keywordRatio, 1.6), n.keywordScore < .8 && n.recommendations.push({
        text: "Include more keywords from your title in your description:",
        pills: n.keywordsMissing
    }), n.score = n.lengthScore + n.formattingScore + n.keywordScore, n
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
    const e = titleInput.value.trim(),
        t = descriptionInput.value.trim();
    e && t && 0 !== tags.length ? analyzeEtsyListing() : alert("Please fill in all fields and add at least one tag.")
}));