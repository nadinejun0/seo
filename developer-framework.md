# Etsy SEO Tool: Developer Implementation Guide

This document outlines the specific technical requirements and implementation details for the Etsy SEO scoring algorithm. Use this as a reference when modifying or extending the codebase.

## Core Architecture

- **Main Scoring Functions**:
  - `calculateTitleScore(title)` → Returns title score object
  - `calculateTagsScore(tags)` → Returns tags score object
  - `calculateDescriptionScore(description, title, focusKeywords)` → Returns description score object
  - `analyzeEtsyListing()` → Primary orchestration function
  - `analyzeListingForCSV(listing)` → Batch processing variant

- **Data Flow**:
  1. Input data collected (title, tags, description)
  2. Tags processed first (to identify focus keywords)
  3. Title processed with tags array for focus keyword identification
  4. Description processed using focus keywords from title
  5. Overall score computed as weighted average

## Component Interconnections & Scoring Dependencies

The scoring system has critical dependencies between components that impact the overall score. Modifying one component can affect others in the scoring flow.

### Dependency Chain

```
Tags → Title → Description → Overall Score
```

### Key Interconnections:

1. **Tags → Title (Focus Keywords Connection)**:
   - Tags array is used to identify focus keywords in the title
   - The `matchingKeywords` property is the critical link between components
   - When empty tags array: focus keywords in title = 0 points (max 1.2 points lost)
   - Implementation:
     ```javascript
     // In calculateTitleScore:
     const matchingKeywords = tags.filter(tag => 
       titleWithHyphens.includes(tag.toLowerCase())
     );
     titleScore.matchingKeywords = matchingKeywords; // THIS IS THE CRITICAL CONNECTION
     ```

2. **Title → Description (Focus Keywords Propagation)**:
   - `matchingKeywords` from title processing are passed to description scoring
   - This is NOT a separate calculation - it directly uses title's matchingKeywords property
   - If no focus keywords found in title, description's keyword integration = 0 (max 1.6 points lost)
   - Implementation:
     ```javascript
     // In analyzeEtsyListing:
     // First calculate title score
     const titleScore = calculateTitleScore(title);
     
     // Then use title's matchingKeywords for description
     const descriptionScore = calculateDescriptionScore(
       description, 
       title, 
       titleScore.matchingKeywords // PROPAGATING THE CONNECTION
     );
     ```
   - In batch processing, similar pattern is used:
     ```javascript
     // If matchingKeywords is empty but manually detected tags exist,
     // override the matchingKeywords array
     if (titleScore.matchingKeywords.length === 0 && matchingTagsDebug.length > 0) {
       titleScore.matchingKeywords = matchingTagsDebug; // Ensuring connection is maintained
     }
     ```

3. **Shared Global State (Critical for Scoring Chain)**:
   - The global `tags` array is used across all components
   - Any modification to tags affects the entire scoring chain
   - In batch processing, tags environment is reset for each listing
   - Implementation:
     ```javascript
     // Save original tags
     const originalTags = Array.isArray(window.tags) ? [...window.tags] : [];
     // Clear tags for this listing
     window.tags = [];
     // Process the current listing...
     // Then restore original tags
     window.tags = originalTags;
     ```

### Scoring Breakdowns & Weights

| Component    | Max Score | Subcomponents                         | Internal Weights |
|--------------|-----------|---------------------------------------|------------------|
| **Title**    | 4.0       | Character Count                       | 1.2 points (30%) |
|              |           | Focus Keywords                        | 1.2 points (30%) |
|              |           | Redundancy                            | 0.8 points (20%) |
|              |           | Separators                            | 0.8 points (20%) |
| **Tags**     | 4.0       | Tag Count                             | 1.0 points (25%) |
|              |           | Multi-word Ratio                      | 1.0 points (25%) |
|              |           | Quality                               | 1.0 points (25%) |
|              |           | Diversity                             | 1.0 points (25%) |
| **Description** | 4.0    | Length                                | 1.2 points (30%) |
|              |           | Formatting                            | 1.2 points (30%) |
|              |           | Keyword Integration                   | 1.6 points (40%) |
| **Overall**  | 4.0       | Title Score × 0.4                     | 1.6 points (40%) |
|              |           | Tags Score × 0.4                      | 1.6 points (40%) |
|              |           | Description Score × 0.2               | 0.8 points (20%) |

### Impact of Component Changes

When modifying any algorithm component, consider these impacts:

1. **Tag-Related Changes**:
   - Affects: Tag score (direct), Title score (via focus keywords), Description score (via focus keywords)
   - Example: Changing tag diversity algorithm impacts 25% of Tags score (1.0 of 4.0 points)
   - Cascading Effect: Can affect up to 1.0 (Tags) + 1.2 (Title) + 1.6 (Description) = 3.8 points

2. **Title-Related Changes**:
   - Affects: Title score (direct), Description score (via focus keywords)
   - Example: Changing separator detection affects 20% of Title score (0.8 of 4.0 points)
   - Note: In the code, this is implemented as `commaScore` but it measures all separator types (commas, pipes, dashes) combined, not just commas
   - Cascading Effect: Title changes that affect focus keywords can impact description scoring

3. **Description-Related Changes**:
   - Affects: Description score only (no upstream dependencies)
   - Example: Changing length brackets affects 30% of Description score (1.2 of 4.0 points)
   - Isolation: Changes here don't affect other components

4. **Global Weighting Changes**:
   - Changing the 40/40/20 split affects all scores proportionally 
   - Current code: `const o = .4 * (n?.score || 0) + .4 * (s?.score || 0) + .2 * (a?.score || 0);`

## Technical Constraints

### Input Limits:
- **Title**: Maximum 140 characters
- **Tags**: 
  - Maximum 13 tags
  - Each tag maximum 20 characters
  - Duplicate tags not allowed (case-insensitive check)
- **Description**: Up to 102,400 characters (Etsy limit)

### Output Format:
- All scores normalized to 0.0-4.0 scale
- Component scores (title, tags, description) each range from 0.0-4.0
- Overall score = (Title × 0.4) + (Tags × 0.4) + (Description × 0.2)

## Critical Variables and Cross-Component Dependencies

Before diving into implementation details, it's essential to understand the critical variables that connect the components:

### The `matchingKeywords` Chain

1. **Origin in Title**: `matchingKeywords` is created in `calculateTitleScore`
2. **Propagation**: This array is passed to `calculateDescriptionScore`
3. **Usage**: Used in description to score keyword integration (highest-weighted description component)

```
tags → calculateTitleScore → matchingKeywords → calculateDescriptionScore → keyword integration score
```

If this chain is broken at any point, the cascading effect is substantial:
- Breaking the tags → title connection: Lose up to 1.2 points in title score
- Breaking the title → description connection: Lose up to 1.6 points in description score

### Practical Example of Cascading Effects

If a developer modifies `calculateTitleScore` but forgets to properly populate the `matchingKeywords` array:

```javascript
// Incorrect implementation
function calculateTitleScore(title) {
  // ... calculations ...
  
  // Developer forgot to include this critical property!
  return {
    score: totalScore,
    // matchingKeywords: matchingKeywords  <-- MISSING!
  };
}
```

The impact would be:
1. Title score would still be calculated correctly
2. BUT description's keyword integration would receive 0 points
3. This would lower description score by up to 1.6 points
4. Overall impact: up to 0.32 points loss (20% of 1.6)
5. Possible grade change (e.g., from B to C)

## Implementation Details by Component

### Title Processing (calculateTitleScore)

```javascript
// Implementation logic (pseudocode)
function calculateTitleScore(title) {
  // First 60 chars cleaned for focus keyword detection
  const titleForMatching = title.substring(0, 60).toLowerCase()
    .replace(/[,.|:;"!?()]/g, ' ')  // Remove specific punctuation
    .replace(/\s+/g, ' ')           // Normalize spaces
    .trim();
    
  // Character count scoring
  const charCount = title.length;
  let charCountScore = 0;
  if (charCount >= 70 && charCount <= 140) charCountScore = 1.2;
  else if (charCount >= 50 && charCount < 70) charCountScore = 0.6;
  else charCountScore = 0.3;
  
  // Calculate focus keywords - MUST use global tags array
  const matchingKeywords = tags.filter(tag => 
    titleForMatching.includes(tag.toLowerCase())
  );
  
  // Focus keyword score - 0.3 points per keyword up to 1.2 max
  const focusKeywordScore = Math.min(matchingKeywords.length * 0.3, 1.2);
  
  // Remaining calculations for redundancy (0.8) and structural elements (0.8)
  // Note: In the actual code, the structural elements score is named 'commaScore'
  // even though it counts all separator types (commas, pipes, dashes) combined
  // Importantly, pipes and dashes only count when they have spaces on both sides (" | ", " - ")
  // This spacing requirement ensures they create clear visual keyword separation for readability
  // Commas are counted without requiring spaces
  // ...
  
  // CRITICAL: Must include matchingKeywords in the return object
  return {
    score: charCountScore + focusKeywordScore + redundancyScore + separatorScore,
    matchingKeywords: matchingKeywords, // Required for description scoring!
    // other properties...
  };
}
```

**Key Requirements**:
- Must preserve apostrophes and hyphens when processing title for matching
- Exact substring matching is used (not word boundary or fuzzy matching)
- Focus keyword matching is case-insensitive
- **CRITICAL FOR SCORE CHAIN**: Must properly populate and return the `matchingKeywords` array
  - If `matchingKeywords` is missing or empty when it shouldn't be, check:
    1. Is the global `tags` array populated correctly?
    2. Is the title preprocessing removing characters it shouldn't?
    3. Is the return object including the `matchingKeywords` property?

### Tag Processing (calculateTagsScore)

```javascript
// Implementation logic (pseudocode)
function calculateTagsScore(tags) {
  // Tag count score (1.0 max)
  const tagCountScore = Math.min(tags.length / 13, 1.0);
  
  // Multi-word ratio score (1.0 max)
  const multiWordTags = tags.filter(tag => tag.split(' ').length > 1);
  const multiWordRatio = tags.length > 0 ? multiWordTags.length / tags.length : 0;
  const multiWordScore = multiWordRatio; // Direct 1:1 mapping
  
  // Tag quality score (1.0 max)
  const lowQualityTags = tags.filter(tag => 
    tag.length < 10 && tag.split(' ').length < 3
  );
  let qualityScore = 1.0;
  if (lowQualityTags.length === 1) qualityScore = 0.5;
  else if (lowQualityTags.length > 1) qualityScore = 0.0;
  
  // Diversity score (1.0 max)
  const allWords = [];
  const uniqueWords = new Set();
  tags.forEach(tag => {
    const words = tag.toLowerCase().split(' ');
    allWords.push(...words);
    words.forEach(word => uniqueWords.add(word));
  });
  
  const diversityRatio = allWords.length > 0 ? uniqueWords.size / allWords.length : 0;
  let diversityScore = 0.2;
  if (diversityRatio >= 0.8) diversityScore = 1.0;
  else if (diversityRatio >= 0.6) diversityScore = 0.8;
  else if (diversityRatio >= 0.4) diversityScore = 0.5;
  
  return {
    score: tagCountScore + multiWordScore + qualityScore + diversityScore,
    // other properties...
  };
}
```

**Key Requirements**:
- Tag length check must occur before adding any tag (max 20 chars)
- Tag count must never exceed 13 (Etsy's limit)
- Tag uniqueness check must be case-insensitive
- Diversity calculation must account for all words across all tags
- This function has no dependencies but is critical for downstream components

### Description Processing (calculateDescriptionScore)

```javascript
// Implementation logic (pseudocode)
function calculateDescriptionScore(description, title, focusKeywords) {
  // Length score (1.2 max)
  const descLength = description.length;
  let lengthScore = 0;
  if (descLength >= 1151) lengthScore = 1.2;
  else if (descLength >= 787) lengthScore = 0.9;
  else if (descLength >= 393) lengthScore = 0.6;
  else if (descLength >= 160) lengthScore = 0.3;
  
  // Formatting score (1.2 max) - check for list elements
  const hasListElements = /(?:^|\n)\s*(?:[\+\-\*•●►]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(description) || 
                          /\*\s+\w+/.test(description) || 
                          /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦●►\+])\s+/u.test(description);
  const formattingScore = hasListElements ? 1.2 : 0;
  
  // Keyword integration score (1.6 max)
  const first160Chars = description.substring(0, 160).toLowerCase();
  const keywordsFound = focusKeywords.filter(keyword => 
    first160Chars.includes(keyword.toLowerCase())
  );
  
  const keywordRatio = focusKeywords.length > 0 ? 
    keywordsFound.length / focusKeywords.length : 0;
  const keywordScore = Math.min(1.6 * keywordRatio, 1.6);
  
  return {
    score: lengthScore + formattingScore + keywordScore,
    // other properties...
  };
}
```

**Key Requirements**:
- Character count must be exact - no trimming of description before counting
- List element detection must support all formats (bullets, numbers, letters, symbols)
- **CRITICAL FOR SCORE CHAIN**: Focus keywords MUST come from title's matchingKeywords array
  - Don't recalculate focus keywords in this function
  - If description keyword integration score is 0 unexpectedly, check the matchingKeywords being passed in
  - Adding console.log statements can help: `console.log('Focus keywords for description:', focusKeywords);`
- Only check first 160 characters for keyword integration (this is a critical SEO area)
- Watch for encoding issues with international characters in descriptions

## Scoring Calculation Deep Dive

### What Moves the Needle Most

Based on the scoring weights, these factors have the largest impact on overall score:

1. **Description Keyword Integration (1.6 points in Description = 0.32 points overall)**
   - Getting focus keywords from title into first 160 chars of description
   - Critical dependency on title focus keywords

2. **Title Character Count and Focus Keywords (1.2 points each in Title = 0.48 points each overall)**
   - Optimizing title length to 70-140 characters
   - Including tag keywords in first 60 chars of title

3. **Tag Attributes (all 1.0 points in Tags = 0.4 points each overall)**
   - Using all 13 allowed tags
   - Having high proportion of multi-word tags
   - Avoiding low-quality tags
   - Maintaining high word diversity

### A/B Test Scenario:
When making algorithm changes, consider this example of impact:

```
Original Product:
- Title with 1 focus keyword (0.3 of 1.2 points)
- Optimized for everything else

Algorithm Change:
- Modified focus keyword detection to include hyphenated word variants

New Outcome:
- Title now detects 3 focus keywords (0.9 of 1.2 points)
- Description now has more matching keywords (increased keyword integration)

Net Score Impact:
- Title: +0.6 points × 40% weight = +0.24 points overall
- Description: Up to +1.6 points × 20% weight = +0.32 points overall
- Total potential improvement: +0.56 points overall (can change grade level)
```

## Batch Processing Specifics

### CSV Processing:
- CSV parser must support quoted fields with embedded commas and newlines
- All newlines must be preserved in description fields (don't trim)
- Description length calculation must match the single tool's calculation

### Performance Considerations:
- Process listings in batches of 5 to prevent UI freezing
- Use separate global tags array for each listing to prevent cross-contamination
- Restore original tags array after processing each listing

### Error Handling:
- Handle missing fields gracefully (null/undefined checks)
- Provide fallback scores for missing data components
- Log warnings for incomplete listings

## Security Concerns

- Always escape HTML when outputting to tables/DOM
- Validate all tag inputs for max length before adding
- Sanitize CSV content before processing

## Testing Guidelines

- Test with extreme values (empty strings, max length strings)
- Test with international characters and special symbols
- Verify scores match between batch and single-item processing
- Confirm character counts are consistent across tools
- Validate that focus keyword detection works with preserved symbols

## Debugging

### Console Logging

Extensive console logging is available throughout the code to help diagnose issues:

- **Score Calculation Logs**: Each component logs its score calculations
  ```javascript
  console.log('Title score calculated:', titleScore);
  console.log('Tag score calculated:', tagScore);
  console.log('Description score calculated:', descriptionScore);
  ```

- **Character Processing Logs**: Track how special characters and Unicode are handled
  ```javascript
  console.log('Title processed with hyphens:', titleWithHyphens);
  console.log('DESCRIPTION LENGTH:', descLength, 'characters');
  console.log('Special characters found:', specialChars.length, 'chars');
  ```

- **Focus Keyword Detection**: See which tags match with the title
  ```javascript
  console.log('Found matching tag in title:', tag);
  console.log('Manually detected focus keywords:', matchingTagsDebug);
  ```

- **Batch Processing**: Track CSV processing and length calculations
  ```javascript
  console.log('Raw description length:', processDescription.length);
  console.log('First 50 character codes:', charCodes);
  ```

Developers should check the browser console when making algorithm changes to verify calculations are being performed as expected.

## Visualization of Score Component Breakdown

```
Overall Score (4.0 max)
├── Title Score (40% of total) - 1.6 pts max contribution
│   ├── Character Count (30% of Title) - 1.2 pts max
│   ├── Focus Keywords (30% of Title) - 1.2 pts max
│   ├── Redundancy (20% of Title) - 0.8 pts max
│   └── Structural Elements / Separators (20% of Title) - 0.8 pts max
├── Tags Score (40% of total) - 1.6 pts max contribution
│   ├── Tag Count (25% of Tags) - 1.0 pts max
│   ├── Multi-word Ratio (25% of Tags) - 1.0 pts max
│   ├── Quality (25% of Tags) - 1.0 pts max
│   └── Diversity (25% of Tags) - 1.0 pts max
└── Description Score (20% of total) - 0.8 pts max contribution
    ├── Length (30% of Description) - 1.2 pts max
    ├── Formatting (30% of Description) - 1.2 pts max
    └── Keyword Integration (40% of Description) - 1.6 pts max
```

---

*Last updated: 04/02/2025*