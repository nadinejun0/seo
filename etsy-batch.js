
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
                                obj[headers[j]] = currentLine[j].trim();
                            }
                            
                            // Add default values for missing fields
                            for (let j = currentLine.length; j < headers.length; j++) {
                                obj[headers[j]] = '';
                            }
                            
                            // Only add if we have the required fields
                            if (obj['Title'] && obj['Tags'] && obj['Description']) {
                                result.push(obj);
                            }
                        }
                        
                        currentLine = [];
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
            
            if (!title || !tagsInput || !description) {
                console.warn('Missing required fields for listing:', listing);
                return {
                    ...listing,
                    "Overall Score": "0.00",
                    "Title Score": "0.00",
                    "Tag Score": "0.00",
                    "Des. Score": "0.00",
                    "Focus Keyword Tags": "",
                };
            }
            
            // Backup the current global tags and then clear them
            const originalTags = Array.isArray(window.tags) ? [...window.tags] : [];
            window.tags = [];
            
            // Split the tags string, trim each tag, and add to the tags array
            const tagList = tagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag && tag.length <= 20);
            
            console.log('Processing tags:', tagList);
                
            // Add each tag to the global tags array
            tagList.forEach(tag => {
                if (window.tags.length < 13 && !window.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
                    window.tags.push(tag);
                }
            });
            
            console.log('Final tags array:', window.tags);
            
            // Calculate scores
            console.log('Calculating scores for title:', title.substring(0, 30) + '...');
            console.log('Tags for scoring:', window.tags);
            
            // Explicitly prepare the title for focus keyword detection
            const cleanedTitle = title.substring(0, 60).toLowerCase().replace(/[,.|\-:;'"!?()]/g, ' ').replace(/\s+/g, ' ').trim();
            console.log('Cleaned title for keyword matching:', cleanedTitle);
            
            // Manually detect matching keywords for debug purposes
            const matchingTagsDebug = [];
            window.tags.forEach(tag => {
                const cleanTag = tag.toLowerCase();
                if (cleanedTitle.includes(cleanTag)) {
                    console.log('Found matching tag in title:', tag);
                    matchingTagsDebug.push(tag);
                }
            });
            console.log('Manually detected focus keywords:', matchingTagsDebug);
            
            const titleScore = calculateTitleScore(title);
            console.log('Title score calculated:', titleScore.score, 'Focus keywords:', titleScore.matchingKeywords);
            
            // If matchingKeywords is empty but we found matches manually, override it
            if ((!titleScore.matchingKeywords || titleScore.matchingKeywords.length === 0) && matchingTagsDebug.length > 0) {
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
                
                // Adjust the overall title score to reflect the updated focus keyword score
                titleScore.score = titleScore.charCountScore + titleScore.focusKeywordScore + 
                                  titleScore.redundancyScore + titleScore.commaScore;
                
                console.log('Updated title score after focus keyword adjustment:', titleScore.score);
            }
            
            const tagScore = calculateTagsScore(window.tags);
            const descriptionScore = calculateDescriptionScore(description, title);
            
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
                "Title": title,
                "title_char (1.2)": titleScore.charCountScore.toFixed(1),
                "title_focus (1.2)": titleScore.focusKeywordScore ? titleScore.focusKeywordScore.toFixed(1) : "0.0",
                "title_redun (0.8)": titleScore.redundancyScore.toFixed(1),
                "title_comma (0.8)": titleScore.commaScore.toFixed(1),
                "Tag Score": tagScore.score.toFixed(2),
                "Tags": tagsInput,
                "Focus Keyword Tags": Array.isArray(titleScore.matchingKeywords) && titleScore.matchingKeywords.length > 0 
                    ? titleScore.matchingKeywords.join(',') 
                    : '',
                "tag_count (1.0)": tagScore.tagCountScore.toFixed(1),
                "tag_ratio (1.0)": tagScore.multiWordScore.toFixed(1),
                "tag_qual (1.0)": tagScore.qualityScore.toFixed(1),
                "tag_diver (1.0)": tagScore.diversityScore.toFixed(1),
                "Des. Score": descriptionScore.score.toFixed(2),
                "Description": description,
                "des_length (1.2)": descriptionScore.lengthScore.toFixed(1),
                "des_form (1.2)": descriptionScore.formattingScore.toFixed(1),
                "des_keyword (1.6)": descriptionScore.keywordScore.toFixed(1),
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
                'Des. Score', 'Description',
                'des_length (1.2)', 'des_form (1.2)', 'des_keyword (1.6)'
            ];
            
            // Create CSV header row
            let csv = orderedHeaders.join(',') + '\n';
            
            // Add data rows
            analysisResults.forEach(result => {
                const row = orderedHeaders.map(header => {
                    let value = result[header] || '';
                    
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
