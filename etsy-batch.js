
        // DOM elements
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const fileInfo = document.getElementById('fileInfo');
        // Using let instead of const to avoid conflict with any global declarations from etsygrade.js
        let batchAnalyzeBtn = document.getElementById('analyzeBtn');
        let batchDownloadBtn = document.getElementById('downloadBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const resultsArea = document.getElementById('resultsArea');
        const resultsBody = document.getElementById('resultsBody');
        const totalAnalyzed = document.getElementById('totalAnalyzed');
        const downloadLink = document.getElementById('downloadLink');
        
        // Global variables
        let csvFile = null;
        let parsedData = [];
        let analysisResults = [];
        
        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.classList.add('active');
        }
        
        function unhighlight() {
            uploadArea.classList.remove('active');
        }
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                handleFile(files[0]);
            }
        }
        
        // File input handling
        fileInput.addEventListener('change', function(e) {
            console.log('File input change event triggered');
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
        
        function handleFile(file) {
            console.log('Handling file:', file.name, file.type);
            // Accept any file ending with .csv regardless of MIME type
            // Some browsers/systems may not report CSV files as text/csv
            if (!file.name.toLowerCase().endsWith('.csv')) {
                alert('Please upload a CSV file.');
                return;
            }
            
            csvFile = file;
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            batchAnalyzeBtn.disabled = false;
        }
        
        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' bytes';
            else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            else return (bytes / 1048576).toFixed(1) + ' MB';
        }
        
        // Parse CSV function with robust handling of line breaks and quotes
        function parseCSV(text) {
            // Log some info about the CSV text being parsed
            console.log('CSV text length:', text.length);
            console.log('First 100 chars of CSV:', JSON.stringify(text.substring(0, 100)));
            console.log('Number of newlines in CSV:', (text.match(/\n/g) || []).length);
            console.log('Number of quotes in CSV:', (text.match(/"/g) || []).length);
            
            const result = [];
            const headers = [];
            let currentLine = [];
            let currentField = '';
            let inQuotes = false;
            
            // Add a trailing newline to simplify processing
            text += '\n';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1] || '';
                
                // Handle quotes
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Double quotes inside quotes - add a single quote and skip the next char
                        currentField += '"';
                        i++;
                    } else {
                        // Toggle quote mode
                        inQuotes = !inQuotes;
                    }
                } 
                // Handle commas
                else if (char === ',' && !inQuotes) {
                    // End of field
                    currentLine.push(currentField);
                    currentField = '';
                }
                // Handle newlines
                else if ((char === '\r' || char === '\n') && !inQuotes) {
                    // Skip empty newlines if we're not in a field
                    if (char === '\r' && nextChar === '\n') {
                        i++; // Skip the \n in \r\n
                    }
                    
                    // Only process if we have content (not just sequential newlines)
                    if (currentField !== '' || currentLine.length > 0) {
                        // Add the last field
                        currentLine.push(currentField);
                        currentField = '';
                        
                        // Process the line
                        if (headers.length === 0) {
                            // First line - use as headers
                            for (let j = 0; j < currentLine.length; j++) {
                                headers.push(currentLine[j].trim());
                            }
                        } else if (currentLine.length > 0) {
                            // Data line - create an object with header keys
                            const obj = {};
                            const minLength = Math.min(headers.length, currentLine.length);
                            
                            for (let j = 0; j < minLength; j++) {
                                // Don't trim the Description field - preserve all whitespace and newlines
                                if (headers[j] === 'Description') {
                                    obj[headers[j]] = currentLine[j];
                                } else {
                                    obj[headers[j]] = currentLine[j].trim();
                                }
                            }
                            
                            // Add default values for missing fields
                            for (let j = currentLine.length; j < headers.length; j++) {
                                obj[headers[j]] = '';
                            }
                            
                            // Include any row that has at least one non-empty field
                            if (obj['Title'] || obj['Tags'] || obj['Description']) {
                                // Ensure all fields exist (even if empty)
                                obj['Title'] = obj['Title'] || '';
                                obj['Tags'] = obj['Tags'] || '';
                                obj['Description'] = obj['Description'] || '';
                                result.push(obj);
                            }
                        }
                        
                        currentLine = [];
                    }
                }
                // Handle newlines INSIDE quoted fields (preserve them)
                else if ((char === '\r' || char === '\n') && inQuotes) {
                    // Keep the newline character in the field
                    currentField += '\n';
                    
                    // Skip the \n in \r\n sequences
                    if (char === '\r' && nextChar === '\n') {
                        i++;
                    }
                }
                // Normal character
                else {
                    currentField += char;
                }
            }
            
            return {
                headers: headers,
                data: result
            };
        }
        
        // Analyze button click handler
        batchAnalyzeBtn.addEventListener('click', function() {
            if (!csvFile) return;
            
            console.log('Starting file analysis...');
            
            const reader = new FileReader();
            reader.readAsText(csvFile);
            
            reader.onload = function(e) {
                console.log('File loaded successfully');
                const csvText = e.target.result;
                console.log('CSV text length:', csvText.length);
                try {
                    const parsedCSV = parseCSV(csvText);
                    console.log('CSV parsed, headers:', parsedCSV.headers);
                    console.log('CSV parsed, row count:', parsedCSV.data.length);
                    
                    parsedData = parsedCSV.data;
                    
                    if (parsedData.length === 0) {
                        alert('No valid data found in the CSV file. Make sure it contains Title, Tags, and Description columns.');
                        return;
                    }
                    
                    // Begin processing
                    progressBar.style.display = 'block';
                    processListings(parsedData);
                } catch (error) {
                    console.error('Error parsing CSV:', error);
                    alert('Error parsing the CSV file: ' + error.message);
                }
            };
            
            reader.onerror = function(error) {
                console.error('Error reading file:', error);
                alert('Error reading the file. Please try again.');
            };
        });
        
        // Process listings in batches to avoid UI freezing
        function processListings(listings) {
            analysisResults = [];
            let processed = 0;
            const total = listings.length;
            
            // Process in batches of 5
            function processBatch(startIndex) {
                const endIndex = Math.min(startIndex + 5, total);
                
                for (let i = startIndex; i < endIndex; i++) {
                    const listing = listings[i];
                    const result = analyzeListingForCSV(listing);
                    analysisResults.push(result);
                    
                    processed++;
                    updateProgress(processed / total);
                }
                
                // Continue with next batch or finish
                if (processed < total) {
                    setTimeout(() => processBatch(endIndex), 0);
                } else {
                    finishProcessing();
                }
            }
            
            // Start processing
            processBatch(0);
        }
        
        function updateProgress(ratio) {
            const percent = Math.round(ratio * 100);
            progressFill.style.width = percent + '%';
        }
        
        function finishProcessing() {
            progressBar.style.display = 'none';
            
            // Show results area
            resultsArea.style.display = 'block';
            totalAnalyzed.textContent = analysisResults.length;
            
            // Clear previous results
            resultsBody.innerHTML = '';
            
            // Add results to table (show first 50 for performance)
            const displayLimit = Math.min(analysisResults.length, 50);
            
            for (let i = 0; i < displayLimit; i++) {
                const result = analysisResults[i];
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${escapeHTML(result.Title.substring(0, 50))}${result.Title.length > 50 ? '...' : ''}</td>
                    <td>${result["Overall Score"]}</td>
                    <td>${result["Title Score"]}</td>
                    <td>${result["Tag Score"]}</td>
                    <td>${result["Des. Score"]}</td>
                    <td>${result["Focus Keyword Tags"]}</td>
                `;
                
                resultsBody.appendChild(row);
            }
            
            // Make download available
            generateCSVDownload();
        }
        
        // Function to analyze a single listing for CSV output
        function analyzeListingForCSV(listing) {
            console.log('Analyzing listing:', listing.Title);
            
            // Handle case sensitivity in column names
            const title = listing.Title || listing.title;
            const tagsInput = listing.Tags || listing.tags;
            const description = listing.Description || listing.description;
            
            // Process even if some fields are empty, but log a warning
            if (!title && !tagsInput && !description) {
                console.warn('All fields empty for listing:', listing);
                return {
                    ...listing,
                    "Overall Score": "0.00",
                    "Title Score": "0.00",
                    "Tag Score": "0.00",
                    "Des. Score": "0.00",
                    "Focus Keyword Tags": "",
                    "Analysis Note": "Empty row"
                };
            }
            
            
            // If any fields are missing, use empty strings
            const processTitle = title || '';
            const processTagsInput = tagsInput || '';
            // Make sure to preserve all newlines in the description
            const processDescription = description || '';
            
            // Log raw description to debug character count issues
            console.log('Raw description from CSV:', processDescription);
            console.log('Raw description length:', processDescription.length);
            
            // Store this description in local storage for comparison
            try {
                localStorage.setItem('batchDescription', processDescription);
                console.log('Stored description in localStorage for comparison');
            } catch (e) {
                console.error('Failed to store description for comparison:', e);
            }
            
            // Log a warning if any fields are empty
            if (!processTitle || !processTagsInput || !processDescription) {
                console.warn('Some fields missing for listing:', {
                    hasTitle: !!processTitle,
                    hasTags: !!processTagsInput,
                    hasDescription: !!processDescription
                });
            }
            
            // Backup the current global tags and then clear them
            const originalTags = Array.isArray(window.tags) ? [...window.tags] : [];
            window.tags = [];
            
            // Split the tags string, trim each tag, and add to the tags array
            const tagList = processTagsInput ? processTagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag && tag.length <= 20) : [];
            
            console.log('Processing tags:', tagList);
                
            // Add each tag to the global tags array
            tagList.forEach(tag => {
                if (window.tags.length < 13 && !window.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
                    window.tags.push(tag);
                }
            });
            
            console.log('Final tags array:', window.tags);
            
            // Calculate scores
            console.log('Calculating scores for title:', processTitle ? processTitle.substring(0, 30) + '...' : '(empty title)');
            console.log('Tags for scoring:', window.tags);
            
            // Explicitly prepare the title for focus keyword detection
            // Allow special characters used in international tags and trademarks/copyright symbols
            // Keep: apostrophes, hyphens, trademark/copyright symbols (™©), and accented characters
            // Remove: commas, periods, pipes, colons, semicolons, quotes, question marks, parentheses
            const cleanedTitle = processTitle ? processTitle.substring(0, 60).toLowerCase()
                .replace(/[,.|:;"!?()]/g, ' ') // Remove punctuation except apostrophes, hyphens
                .replace(/\s+/g, ' ')
                .trim() : '';
                
            // Create a version without hyphens for comparison
            const cleanedTitleWithoutHyphens = cleanedTitle 
                ? cleanedTitle.replace(/-/g, ' ').replace(/\s+/g, ' ').trim() 
                : '';
                
            console.log('Cleaned title with hyphens:', cleanedTitle);
            console.log('Cleaned title without hyphens:', cleanedTitleWithoutHyphens);
            
            // Manually detect matching keywords for debug purposes
            const matchingTagsDebug = [];
            window.tags.forEach(tag => {
                const cleanTag = tag.toLowerCase();
                
                // Only exact matches count as focus keywords - exact phrases only
                // "balmoral sage" will only match if "balmoral sage" appears in title
                // "balmoral - sage" will NOT match "balmoral sage"
                if (cleanedTitle.includes(cleanTag)) {
                    console.log('Found matching tag in title:', tag);
                    matchingTagsDebug.push(tag);
                }
            });
            console.log('Manually detected focus keywords:', matchingTagsDebug);
            
            // Calculate scores only if we have data
            const titleScore = processTitle ? calculateTitleScore(processTitle) : { 
                score: 0, charCountScore: 0, focusKeywordScore: 0, redundancyScore: 0, 
                commaScore: 0, matchingKeywords: [] 
            };
            
            console.log('Title score calculated:', titleScore.score, 'Focus keywords:', titleScore.matchingKeywords);
            
            // If matchingKeywords is empty but we found matches manually, override it
            if (processTitle && (!titleScore.matchingKeywords || titleScore.matchingKeywords.length === 0) && matchingTagsDebug.length > 0) {
                console.log('Overriding empty matchingKeywords with manually detected keywords');
                titleScore.matchingKeywords = matchingTagsDebug;
                titleScore.focusKeywords = matchingTagsDebug.length;
                
                // Recalculate focus keyword score using the correct formula:
                // 0 keywords = 0.0 points
                // 1 keyword = 0.3 points
                // 2 keywords = 0.6 points
                // 3 keywords = 0.9 points
                // 4+ keywords = 1.2 points (max)
                titleScore.focusKeywordScore = Math.min(0.3 * matchingTagsDebug.length, 1.2);
                
                // adjust the overall title score to reflect the updated focus keyword score
                titleScore.score = titleScore.charCountScore + titleScore.focusKeywordScore + 
                                  titleScore.redundancyScore + titleScore.commaScore;
                
                console.log('Updated title score after focus keyword adjustment:', titleScore.score);
            }
            
            const tagScore = window.tags.length > 0 ? calculateTagsScore(window.tags) : {
                score: 0, tagCountScore: 0, multiWordScore: 0, qualityScore: 0, diversityScore: 0 
            };
            
            
            // We need to create our own description score using the matching keywords from the title
            let descriptionScore = {
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
            
            if (processDescription) {
                try {
                    // 1. Calculate word count
                    descriptionScore.wordCount = processDescription.split(/\s+/).filter(Boolean).length;
                    
                    // 2. Calculate length score
                    // Log the raw description for debugging
                    console.log('Raw description:', processDescription.substring(0, 50) + '...');
                    
                    // Calculate length after trimming to ensure consistent measurement
                    const descLength = processDescription.length;
                    console.log('DESCRIPTION LENGTH:', descLength, 'characters');
                    
                    // Check for missing newlines
                    const newlineCount = (processDescription.match(/\n/g) || []).length;
                    const crCount = (processDescription.match(/\r/g) || []).length;
                    console.log('Newline counts: \\n =', newlineCount, '\\r =', crCount);
                    
                    // Check if description has any ASCII/Unicode issues
                    const specialChars = processDescription.match(/[^\x20-\x7E]/g) || [];
                    console.log('Special characters found:', specialChars.length, 'chars');
                    
                    // Display the first 100 characters literally
                    console.log('First 100 chars of description:', 
                                JSON.stringify(processDescription.substring(0, 100)));
                                
                    // Count character categories for debugging
                    const whitespaceCount = (processDescription.match(/\s/g) || []).length;
                    const alphanumCount = (processDescription.match(/[a-zA-Z0-9]/g) || []).length;
                    const punctCount = (processDescription.match(/[.,;:!?'"()[\]{}]/g) || []).length;
                    console.log('Character breakdown:', {
                        whitespace: whitespaceCount,
                        alphanumeric: alphanumCount,
                        punctuation: punctCount,
                        other: processDescription.length - whitespaceCount - alphanumCount - punctCount
                    });
                    
                    // Check specific character sequences that might cause issues
                    const bulletPoints = (processDescription.match(/[•●►]/g) || []).length;
                    console.log('Bullet points found:', bulletPoints);
                    
                    // Display actual characters for debugging
                    const charCodes = Array.from(processDescription.substring(0, 50))
                        .map(char => char.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
                    console.log('First 50 character codes:', charCodes);
                    
                    // Debug comparative lengths
                    const normalizedDesc = processDescription.normalize('NFC');
                    console.log('Normalized description length:', normalizedDesc.length);
                    console.log('Original vs Normalized length diff:', 
                                processDescription.length - normalizedDesc.length);
                    
                    // Apply scoring based on exact length
                    if (descLength >= 1151) {
                        descriptionScore.lengthScore = 1.2;
                        console.log('Description Length Score: 1.2 (≥1151 chars)');
                    } else if (descLength >= 787 && descLength <= 1150) {
                        descriptionScore.lengthScore = 0.9;
                        console.log('Description Length Score: 0.9 (787-1150 chars)');
                    } else if (descLength >= 393 && descLength <= 786) {
                        descriptionScore.lengthScore = 0.6;
                        console.log('Description Length Score: 0.6 (393-786 chars)');
                    } else if (descLength >= 160 && descLength <= 392) {
                        descriptionScore.lengthScore = 0.3;
                        console.log('Description Length Score: 0.3 (160-392 chars)');
                    } else {
                        descriptionScore.lengthScore = 0;
                        console.log('Description Length Score: 0.0 (<160 chars)');
                    }
                    
                    // 3. Check for formatting elements
                    const paragraphs = processDescription.split(/\n\s*\n/);
                    descriptionScore.formattingElements.hasParagraphBreaks = paragraphs.length > 2 && 
                        paragraphs.some(section => section.length < 300);
                        
                    descriptionScore.formattingElements.hasListElements = /(?:^|\n)\s*(?:[\+\-\*•●►]|(?:\d+[\.\)]|[a-zA-Z][\.\)]))\s+/.test(processDescription) || 
                                                  /\*\s+\w+/.test(processDescription) || 
                                                  /(?:^|\n)\s*(?:\p{Emoji}|[✓✔☑√➢◦●►\+])\s+/u.test(processDescription);
                                                  
                    descriptionScore.formattingElements.hasFormatting = /[\*\_\#]|:[\w]+:/.test(processDescription);
                    
                    // Set formatting score
                    descriptionScore.formattingScore = descriptionScore.formattingElements.hasListElements ? 1.2 : 0;
                    
                    // 4. Get the first 160 chars of description
                    const first160Chars = processDescription.substring(0, 160).toLowerCase();
                    
                    // 5. Use the matching keywords from the title
                    // These are the focus keywords that appeared in the title
                    const focusKeywords = titleScore.matchingKeywords || [];
                    
                    // 6. Check which of these focus keywords are present in the first 160 chars
                    descriptionScore.keywordsFound = focusKeywords.filter(tag => {
                        return first160Chars.includes(tag.toLowerCase());
                    });
                    
                    descriptionScore.keywordsMissing = focusKeywords.filter(tag => {
                        return !first160Chars.includes(tag.toLowerCase());
                    });
                    
                    // 7. Calculate keyword score
                    descriptionScore.keywordRatio = focusKeywords.length > 0 ? 
                        descriptionScore.keywordsFound.length / focusKeywords.length : 0;
                    descriptionScore.keywordScore = Math.min(1.6 * descriptionScore.keywordRatio, 1.6);
                    
                    // 8. Calculate final score
                    descriptionScore.score = descriptionScore.lengthScore + 
                                           descriptionScore.formattingScore + 
                                           descriptionScore.keywordScore;
                    
                    // Log final description scores for debugging
                    console.log('Final Description Scores:', {
                        length: descriptionScore.lengthScore,
                        formatting: descriptionScore.formattingScore,
                        keywords: descriptionScore.keywordScore,
                        total: descriptionScore.score
                    });
                    
                } catch (err) {
                    console.error("Error calculating batch description score:", err);
                }
            }
            
            // Ensure the title score is correctly calculated with all components
            const titleScoreFinal = 
                titleScore.charCountScore + 
                titleScore.focusKeywordScore + 
                titleScore.redundancyScore + 
                titleScore.commaScore;
                
            // Log the title score components for debugging
            console.log('Title score components:', {
                charCount: titleScore.charCountScore,
                focus: titleScore.focusKeywordScore,
                redundancy: titleScore.redundancyScore,
                comma: titleScore.commaScore,
                total: titleScoreFinal
            });
                
            // If there's a significant difference between our calculation and the original score, use our calculation
            if (Math.abs(titleScore.score - titleScoreFinal) > 0.1) {
                console.log('Correcting title score from', titleScore.score, 'to', titleScoreFinal);
                titleScore.score = titleScoreFinal;
            }
            
            // Calculate overall score
            const overallScore = 
                (titleScore.score * 0.4) + 
                (tagScore.score * 0.4) + 
                (descriptionScore.score * 0.2);
                
            const grade = getGrade(overallScore);
            
            // Create result object with detailed breakdown matching the correct CSV format
            const result = {
                "Overall Score": overallScore.toFixed(2),
                "Title Score": titleScore.score.toFixed(2),
                "Title": processTitle,
                "title_char (1.2)": titleScore.charCountScore.toFixed(1),
                "title_focus (1.2)": titleScore.focusKeywordScore ? titleScore.focusKeywordScore.toFixed(1) : "0.0",
                "title_redun (0.8)": titleScore.redundancyScore.toFixed(1),
                "title_comma (0.8)": titleScore.commaScore.toFixed(1),
                "Tag Score": tagScore.score.toFixed(2),
                "Tags": processTagsInput,
                "Focus Keyword Tags": Array.isArray(titleScore.matchingKeywords) && titleScore.matchingKeywords.length > 0 
                    ? titleScore.matchingKeywords.join(',') 
                    : '',
                // Add information for incomplete records
                "Incomplete": (!title || !tagsInput || !description) ? "Yes" : "No",
                "tag_count (1.0)": tagScore.tagCountScore.toFixed(1),
                "tag_ratio (1.0)": tagScore.multiWordScore.toFixed(1),
                "tag_qual (1.0)": tagScore.qualityScore.toFixed(1),
                "tag_diver (1.0)": tagScore.diversityScore.toFixed(1),
                "Des. Score": descriptionScore.score.toFixed(2),
                "Description": processDescription,
                "des_length (1.2)": descriptionScore.lengthScore.toFixed(1),
                "des_form (1.2)": descriptionScore.formattingScore.toFixed(1),
                "des_keyword (1.6)": descriptionScore.keywordScore.toFixed(1),
                // Additional debug field (reference to descLength doesn't exist in this scope)
                "Description Length": processDescription.length + " chars",
                // Store the full raw description for verification
                "Raw Description": processDescription,
                // Add missing fields
                "Missing Fields": [
                    !title ? "Title" : "",
                    !tagsInput ? "Tags" : "",
                    !description ? "Description" : ""
                ].filter(Boolean).join(", "),
            };
            
            // Restore the original tags
            window.tags = originalTags;
            
            console.log('Analysis complete for:', title.substring(0, 30) + '...');
            return result;
        }
        
        // Generate CSV download
        function generateCSVDownload() {
            if (analysisResults.length === 0) return;
            
            // Define the exact column order to match the required format
            const orderedHeaders = [
                'Overall Score', 'Title Score', 'Title', 
                'title_char (1.2)', 'title_focus (1.2)', 'title_redun (0.8)', 'title_comma (0.8)',
                'Tag Score', 'Tags', 'Focus Keyword Tags',
                'tag_count (1.0)', 'tag_ratio (1.0)', 'tag_qual (1.0)', 'tag_diver (1.0)',
                'Des. Score', 'Description', 'Description Length',
                'des_length (1.2)', 'des_form (1.2)', 'des_keyword (1.6)',
                'Incomplete', 'Missing Fields'
            ];
            
            // Create CSV header row
            let csv = orderedHeaders.join(',') + '\n';
            
            // Add data rows
            analysisResults.forEach(result => {
                const row = orderedHeaders.map(header => {
                    let value = result[header] || '';
                    
                    // Make sure description length matches actual character count
                    if (header === 'Description Length' && result['Description']) {
                        const actualLength = result['Description'].length;
                        value = actualLength + " chars";
                        console.log('Final description length for CSV:', actualLength);
                    }
                    
                    // Properly escape and quote fields
                    if (typeof value === 'string') {
                        // Double up any quotes in the content
                        value = value.replace(/"/g, '""');
                        
                        // If it contains commas, newlines, or quotes, wrap in quotes
                        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                            value = `"${value}"`;
                        }
                    }
                    
                    return value;
                }).join(',');
                
                csv += row + '\n';
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = `etsy_listings_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
            
            // Also enable download button
            batchDownloadBtn.style.display = 'inline-block';
            batchDownloadBtn.onclick = function() {
                downloadLink.click();
            };
        }
        
        // Helper function to escape HTML special characters
        function escapeHTML(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        
        // Debug function to analyze character differences between batch and single methods
        function analyzeStringDifferences(batchString, singleString) {
            if (!batchString || !singleString) {
                console.log('Cannot compare strings - one or both are empty');
                return;
            }
            
            console.log('COMPARE - Batch length:', batchString.length);
            console.log('COMPARE - Single length:', singleString.length);
            console.log('COMPARE - Length difference:', batchString.length - singleString.length);
            
            // Check first 10 characters in detail
            console.log('COMPARE - First 10 batch chars:', 
                Array.from(batchString.substring(0, 10))
                    .map((c, i) => `${i}:"${c}"(${c.charCodeAt(0)})`).join(', '));
            console.log('COMPARE - First 10 single chars:', 
                Array.from(singleString.substring(0, 10))
                    .map((c, i) => `${i}:"${c}"(${c.charCodeAt(0)})`).join(', '));
            
            // Check if trimming makes them match
            const trimmedBatch = batchString.trim();
            console.log('COMPARE - Trimmed batch length:', trimmedBatch.length);
            console.log('COMPARE - After trim difference:', trimmedBatch.length - singleString.length);
            
            // Check for invisible/problematic characters
            const invisibleCharsBatch = batchString.match(/[\x00-\x1F\x7F-\x9F\u2000-\u200F\u2028-\u202F]/g) || [];
            const invisibleCharsSingle = singleString.match(/[\x00-\x1F\x7F-\x9F\u2000-\u200F\u2028-\u202F]/g) || [];
            console.log('COMPARE - Invisible chars batch:', invisibleCharsBatch.length);
            console.log('COMPARE - Invisible chars single:', invisibleCharsSingle.length);
        }
