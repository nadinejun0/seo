/**
 * Batch Grading Module for Etsy Listing Optimizer
 * Processes CSV files with multiple listings and outputs grading results
 */

import { gradeTitle } from './modules/title.js';
import { gradeTags } from './modules/tags.js';
import { gradeDescription } from './modules/description.js';
import { calculateOverallGrade } from './utils/grading.js';

/**
 * Initialize the batch grading functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    const batchFileInput = document.getElementById('batch-file');
    const batchGradeBtn = document.getElementById('batch-grade-btn');
    const batchResultsArea = document.getElementById('batch-results');
    const batchLoading = document.getElementById('batch-loading');
    const batchError = document.getElementById('batch-error');
    const downloadBtn = document.getElementById('download-results');
    
    let processedData = null;
    
    if (batchGradeBtn) {
        batchGradeBtn.addEventListener('click', () => {
            if (!batchFileInput.files || !batchFileInput.files[0]) {
                showBatchError('Please select a CSV file to process', batchError);
                return;
            }
            
            const file = batchFileInput.files[0];
            
            // Check file type
            if (!file.name.endsWith('.csv')) {
                showBatchError('Please upload a valid CSV file', batchError);
                return;
            }
            
            // Reset previous results
            if (batchResultsArea) {
                batchResultsArea.textContent = '';
                batchResultsArea.classList.add('hidden');
            }
            
            if (downloadBtn) {
                downloadBtn.classList.add('hidden');
            }
            
            // Show loading indicator
            if (batchLoading) {
                batchLoading.classList.add('visible');
            }
            
            // Process the file
            processCSVFile(file)
                .then(results => {
                    processedData = results;
                    displayBatchResults(results, batchResultsArea);
                    
                    if (downloadBtn) {
                        downloadBtn.classList.remove('hidden');
                    }
                })
                .catch(error => {
                    console.error('CSV processing error:', error);
                    let errorMsg = 'Error processing file: ' + error.message;
                    
                    // Add helpful suggestions based on the error
                    if (error.message.includes('Required column')) {
                        errorMsg += '. Please ensure your CSV has the required columns: title, tags, description. Download the sample template for reference.';
                    } else if (error.message.includes('No data found')) {
                        errorMsg += '. Please check that your CSV file is not empty and is properly formatted.';
                    }
                    
                    showBatchError(errorMsg, batchError);
                })
                .finally(() => {
                    if (batchLoading) {
                        batchLoading.classList.remove('visible');
                    }
                });
        });
    }
    
    // Download results button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (processedData) {
                downloadCSV(processedData);
            } else {
                showBatchError('No data to download. Please process a file first.', batchError);
            }
        });
    }
});

/**
 * Process a CSV file and grade all listings
 * @param {File} file - The CSV file to process
 * @returns {Promise<Array>} - Promise resolving to processed results
 */
function processCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                // Add more debugging
                console.log('File loaded, content length:', event.target.result.length);
                console.log('First 100 chars:', event.target.result.substring(0, 100));
                
                // Parse CSV
                const csvData = parseCSV(event.target.result);
                
                console.log('Total CSV rows found:', csvData.length);
                
                if (csvData.length === 0) {
                    throw new Error('No data found in the CSV file');
                }
                
                // Check required columns
                const headers = csvData[0];
                console.log('CSV Headers:', headers);
                const requiredColumns = ['title', 'tags', 'description'];
                
                for (const col of requiredColumns) {
                    if (!headers.includes(col)) {
                        throw new Error(`Required column "${col}" not found in CSV. Found columns: ${headers.join(', ')}`);
                    }
                }
                
                // Get column indices
                const titleIndex = headers.indexOf('title');
                const tagsIndex = headers.indexOf('tags');
                const descriptionIndex = headers.indexOf('description');
                
                // Process each row (skip header)
                const results = [];
                let processedCount = 0;
                let skippedCount = 0;
                
                for (let i = 1; i < csvData.length; i++) {
                    const row = csvData[i];
                    
                    // Skip empty rows
                    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
                        skippedCount++;
                        console.log(`Skipping row ${i}: Empty row`);
                        continue;
                    }
                    
                    // Check if row has all columns
                    if (titleIndex >= row.length || tagsIndex >= row.length || descriptionIndex >= row.length) {
                        skippedCount++;
                        console.log(`Skipping row ${i}: Incomplete row, has ${row.length} columns, title idx: ${titleIndex}, tags idx: ${tagsIndex}, desc idx: ${descriptionIndex}`);
                        continue;
                    }
                    
                    // Get listing data
                    const title = row[titleIndex] || '';
                    const tagsString = row[tagsIndex] || '';
                    const description = row[descriptionIndex] || '';
                    processedCount++;
                    
                    // Convert tags to array
                    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
                    
                    // Grade the listing
                    const titleResults = gradeTitle(title, tagsArray);
                    const tagsResults = tagsArray.length > 0 ? gradeTags(tagsArray, title) : { total_score: 0 };
                    const descriptionResults = description ? gradeDescription(description, title) : { total_score: 0 };
                    
                    // Calculate overall grade
                    const overallGrade = calculateOverallGrade(
                        titleResults.total_score,
                        tagsResults.total_score,
                        descriptionResults.total_score
                    );
                    
                    // Add to results
                    results.push({
                        title,
                        tags: tagsString,
                        description,
                        title_score: titleResults.total_score.toFixed(1),
                        tags_score: tagsResults.total_score.toFixed(1),
                        description_score: descriptionResults.total_score.toFixed(1),
                        overall_score: overallGrade.score.toFixed(1),
                        grade: overallGrade.letter,
                        
                        // Detailed scores
                        title_char_score: titleResults.character_count.score.toFixed(1),
                        title_focus_score: titleResults.focus_keywords.score.toFixed(1),
                        title_stuffing_score: titleResults.keyword_stuffing.score.toFixed(1),
                        title_structure_score: titleResults.structure.score.toFixed(1),
                        
                        tags_count_score: tagsResults.tag_count ? tagsResults.tag_count.score.toFixed(1) : '0.0',
                        tags_multiword_score: tagsResults.multi_word_tags ? tagsResults.multi_word_tags.score.toFixed(1) : '0.0',
                        tags_chain_score: tagsResults.chain_structure ? tagsResults.chain_structure.score.toFixed(1) : '0.0',
                        tags_diversity_score: tagsResults.diversity ? tagsResults.diversity.score.toFixed(1) : '0.0',
                        
                        desc_length_score: descriptionResults.length ? descriptionResults.length.score.toFixed(1) : '0.0',
                        desc_formatting_score: descriptionResults.formatting ? descriptionResults.formatting.score.toFixed(1) : '0.0',
                        desc_keywords_score: descriptionResults.keyword_integration ? descriptionResults.keyword_integration.score.toFixed(1) : '0.0'
                    });
                }
                
                console.log(`CSV processing stats: Total rows: ${csvData.length}, Processed: ${processedCount}, Skipped: ${skippedCount}`);
                console.log(`Skipped + Processed = ${skippedCount + processedCount}, should equal ${csvData.length - 1} (total rows minus header)`);
                
                resolve(results);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error reading file'));
        };
        
        // Read the file using UTF-8 encoding
        reader.readAsText(file, 'UTF-8');
        console.log('Reading file:', file.name, 'size:', file.size);
    });
}

/**
 * Parse CSV string into array of arrays
 * @param {string} csvText - The CSV text to parse
 * @returns {Array<Array<string>>} - Parsed CSV data
 */
function parseCSV(csvText) {
    // The main issue is that we're splitting by newlines first, which breaks for fields with internal newlines
    // Let's log some debug info first
    console.log('Starting CSV parsing, text length:', csvText.length);
    
    // We need to parse character by character, not line by line
    const result = [];
    let currentRow = [];
    let currentValue = '';
    let inQuotes = false;
    let lineCount = 0;
    
    // Count how many quote chars we have in total (for debugging)
    const quoteCount = (csvText.match(/"/g) || []).length;
    console.log('Total quote characters in CSV:', quoteCount);
    
    // Count newlines in CSV
    const newlineCount = (csvText.match(/\n/g) || []).length;
    console.log('Total newlines in CSV:', newlineCount);
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1] || '';
        
        // Handle newlines (CR, LF, or CRLF)
        if (char === '\r' && nextChar === '\n') {
            // CRLF newline - skip the CR and handle the LF in the next iteration
            continue; 
        }
        
        if ((char === '\n' || char === '\r') && !inQuotes) {
            // End of row (if not in quotes)
            currentRow.push(currentValue.trim());
            result.push(currentRow);
            currentRow = [];
            currentValue = '';
            lineCount++;
            continue;
        }
        
        // Handle quotes
        if (char === '"') {
            if (!inQuotes) {
                // Starting a quoted field
                inQuotes = true;
            } else if (nextChar === '"') {
                // Escaped quote inside a quoted field
                currentValue += '"';
                i++; // Skip the next quote
            } else {
                // Ending a quoted field
                inQuotes = false;
            }
            continue;
        }
        
        // Handle commas
        if (char === ',' && !inQuotes) {
            // End of field
            currentRow.push(currentValue.trim());
            currentValue = '';
            continue;
        }
        
        // Regular character
        currentValue += char;
    }
    
    // Add the last field and row if not empty
    if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim());
        result.push(currentRow);
    }
    
    console.log('CSV parsing complete, found', result.length, 'rows');
    return result;
}

/**
 * Display batch processing results
 * @param {Array} results - The processed results
 * @param {HTMLElement} resultsArea - The element to display results in
 */
function displayBatchResults(results, resultsArea) {
    if (!resultsArea) return;
    
    // Calculate summary stats
    const totalListings = results.length;
    let aGrades = 0, bGrades = 0, cGrades = 0, dGrades = 0;
    let avgOverallScore = 0, avgTitleScore = 0, avgTagsScore = 0, avgDescScore = 0;
    
    results.forEach(result => {
        avgOverallScore += parseFloat(result.overall_score);
        avgTitleScore += parseFloat(result.title_score);
        avgTagsScore += parseFloat(result.tags_score);
        avgDescScore += parseFloat(result.description_score);
        
        switch (result.grade) {
            case 'A': aGrades++; break;
            case 'B': bGrades++; break;
            case 'C': cGrades++; break;
            case 'D': dGrades++; break;
        }
    });
    
    avgOverallScore = (avgOverallScore / totalListings).toFixed(1);
    avgTitleScore = (avgTitleScore / totalListings).toFixed(1);
    avgTagsScore = (avgTagsScore / totalListings).toFixed(1);
    avgDescScore = (avgDescScore / totalListings).toFixed(1);
    
    // Create results HTML
    let html = `
        <h3>Batch Grading Results (${totalListings} listings)</h3>
        
        <div class="batch-summary">
            <div class="summary-section">
                <h4>Grade Distribution</h4>
                <div class="grade-distribution">
                    <div class="grade-bar">
                        <span class="grade-label">A (${aGrades})</span>
                        <div class="bar grade-a" style="width: ${(aGrades / totalListings) * 100}%"></div>
                    </div>
                    <div class="grade-bar">
                        <span class="grade-label">B (${bGrades})</span>
                        <div class="bar grade-b" style="width: ${(bGrades / totalListings) * 100}%"></div>
                    </div>
                    <div class="grade-bar">
                        <span class="grade-label">C (${cGrades})</span>
                        <div class="bar grade-c" style="width: ${(cGrades / totalListings) * 100}%"></div>
                    </div>
                    <div class="grade-bar">
                        <span class="grade-label">D (${dGrades})</span>
                        <div class="bar grade-d" style="width: ${(dGrades / totalListings) * 100}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>Average Scores</h4>
                <div class="average-scores">
                    <div class="score-item">
                        <span class="score-label">Overall:</span>
                        <span class="score-value">${avgOverallScore}/4.0</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Title:</span>
                        <span class="score-value">${avgTitleScore}/4.0</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Tags:</span>
                        <span class="score-value">${avgTagsScore}/4.0</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Description:</span>
                        <span class="score-value">${avgDescScore}/4.0</span>
                    </div>
                </div>
            </div>
        </div>
        
        <p>A CSV file with detailed results has been generated. Click "Download Results" to save it.</p>
    `;
    
    resultsArea.innerHTML = html;
    resultsArea.classList.remove('hidden');
}

/**
 * Download results as CSV file
 * @param {Array} data - The data to download
 */
function downloadCSV(data) {
    if (!data || data.length === 0) return;
    
    // Define CSV headers
    const csvHeaders = [
        'title',
        'overall_score',
        'grade',
        'title_score',
        'tags_score',
        'description_score',
        'title_char_score',
        'title_focus_score',
        'title_stuffing_score',
        'title_structure_score',
        'tags_count_score',
        'tags_multiword_score',
        'tags_chain_score',
        'tags_diversity_score',
        'desc_length_score',
        'desc_formatting_score',
        'desc_keywords_score'
    ];
    
    // Create CSV content
    let csvContent = csvHeaders.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = csvHeaders.map(header => {
            let value = row[header] || '';
            
            // Escape quotes and wrap with quotes if necessary
            if (header === 'title' || header === 'tags' || header === 'description') {
                value = value.replace(/"/g, '""');
                value = `"${value}"`;
            }
            
            return value;
        });
        
        csvContent += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'etsy_seo_results.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Show batch error message
 * @param {string} message - The error message
 * @param {HTMLElement} errorElement - The element to display error in
 */
function showBatchError(message, errorElement) {
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

// Make the module accessible outside
window.batchGrader = {
    processCSVFile,
    downloadCSV
};