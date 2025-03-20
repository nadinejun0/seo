/**
 * Main application file for Etsy Listing Optimizer
 * 
 * Real-time grading system with optimization recommendations
 */

// Import modules
import { gradeTitle } from './modules/title.js';
import { gradeTags, processCommaSeparatedTags } from './modules/tags.js';
import { gradeDescription } from './modules/description.js';
import { 
    calculateOverallGrade, 
    formatGradeResults, 
    getGradeClass,
    shouldAllowOptimization
} from './utils/grading.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application components
 */
function initializeApp() {
    // DOM Elements
    const elements = {
        form: document.getElementById('optimizer-form'),
        title: {
            field: document.getElementById('title'),
            countDisplay: document.getElementById('title-count'),
            feedback: document.getElementById('title-feedback'),
            gradeBtn: document.getElementById('title-grade-btn'),
            optimizeBtn: document.getElementById('title-only-btn')
        },
        tags: {
            container: document.getElementById('tags-container'),
            input: document.getElementById('tag-input'),
            countDisplay: document.getElementById('tag-count'),
            feedback: document.getElementById('tags-feedback'),
            gradeBtn: document.getElementById('tags-grade-btn'),
            optimizeBtn: document.getElementById('tags-only-btn')
        },
        description: {
            field: document.getElementById('description'),
            feedback: document.getElementById('description-feedback'),
            gradeBtn: document.getElementById('description-grade-btn'),
            optimizeBtn: document.getElementById('description-only-btn')
        },
        results: {
            section: document.getElementById('results'),
            loading: document.querySelector('.loading'),
            gradeDisplay: document.getElementById('overall-grade'),
            titleScore: document.querySelector('.title-score'),
            tagsScore: document.querySelector('.tags-score'),
            descriptionScore: document.querySelector('.description-score'),
            scoreCards: document.querySelector('.score-cards .card')
        },
        errorDisplay: document.getElementById('error-display'),
        gradeAllBtn: document.getElementById('grade-all-btn'),
        realTimeScore: document.getElementById('real-time-score'),
        optimizeDisabledMsg: document.getElementById('optimize-disabled-msg')
    };
    
    // App state
    const state = {
        tags: [],
        scores: {
            title: 0,
            tags: 0,
            description: 0,
            overall: 0
        },
        letterGrade: 'D',
        inputChanged: false
    };
    
    // Initialize components
    initTitleComponent(elements, state);
    initTagsComponent(elements, state);
    initDescriptionComponent(elements, state);
    initFormSubmission(elements, state);
    
    // Initial grading if fields have content
    setTimeout(() => {
        updateAllGrades(elements, state);
    }, 500);
}

/**
 * Initialize title-related functionality
 */
function initTitleComponent(elements, state) {
    // Character counter and realtime grading for title
    elements.title.field.addEventListener('input', () => {
        const count = elements.title.field.value.length;
        elements.title.countDisplay.textContent = count;
        
        if (count >= 100 && count <= 140) {
            elements.title.countDisplay.style.color = '#4CAF50';
        } else {
            elements.title.countDisplay.style.color = count < 100 ? '#FFC107' : '#F44336';
        }
        
        state.inputChanged = true;
        updateAllGrades(elements, state);
    });
    
    // Title grading
    elements.title.gradeBtn.addEventListener('click', () => {
        elements.title.feedback.classList.add('hidden');
        elements.errorDisplay.classList.add('hidden');
        
        const title = elements.title.field.value.trim();
        
        if (!title) {
            showError('Please enter a product title', elements);
            return;
        }
        
        // Grade the title
        const gradeResult = gradeTitle(title, state.tags);
        state.scores.title = gradeResult.total_score;
        
        // Display detailed feedback
        elements.title.feedback.innerHTML = formatGradeResults(gradeResult, 'title');
        elements.title.feedback.classList.remove('hidden');
        
        // Update overall grade
        updateOverallGrade(elements, state);
    });
    
    // Title optimization - disabled unless score is low enough
    elements.title.optimizeBtn.addEventListener('click', async () => {
        if (!shouldAllowOptimization(state.scores.title)) {
            showMessage('Title already scores well. Optimization not needed.', elements);
            return;
        }
        
        await optimizeField('title', elements, state);
        updateAllGrades(elements, state);
    });
}

/**
 * Initialize tags-related functionality
 */
function initTagsComponent(elements, state) {
    // Tag updates and real-time grading
    const updateTags = () => {
        const tagCount = state.tags.length;
        elements.tags.countDisplay.textContent = tagCount;
        
        if (tagCount >= 13) {
            elements.tags.input.disabled = true;
            elements.tags.input.placeholder = "Maximum tags reached (13)";
        } else {
            elements.tags.input.disabled = false;
            elements.tags.input.placeholder = "Type a tag and press Enter or paste comma-separated list...";
        }
        
        state.inputChanged = true;
        updateAllGrades(elements, state);
    };
    
    // Render tags in UI
    const renderTags = () => {
        // Clear existing tags (except input)
        const existingTags = elements.tags.container.querySelectorAll('.tag');
        existingTags.forEach(tag => tag.remove());
        
        // Add tags
        state.tags.forEach((tag, index) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            
            // Add character count indicator with color
            let lengthClass = '';
            if (tag.length > 20) {
                lengthClass = 'tag-length-error';
            } else if (tag.length > 15) {
                lengthClass = 'tag-length-warn';
            }
            
            tagElement.innerHTML = tag + 
                `<span class="tag-length ${lengthClass}">(${tag.length})</span>` + 
                '<span class="tag-delete" data-index="' + index + '">×</span>';
            
            elements.tags.container.insertBefore(tagElement, elements.tags.input);
        });
        
        updateTags();
    };
    
    // Add single tag
    const addTag = (newTag) => {
        newTag = newTag.trim();
        if (newTag === '' || state.tags.length >= 13) return false;
        
        // Validate tag length (max 20 characters)
        if (newTag.length > 20) {
            showError(`Tag skipped: "${newTag}" is too long (${newTag.length}/20). Must be 20 characters or less.`, elements);
            return false;
        }
        
        // Check for duplicates
        if (state.tags.includes(newTag)) {
            showError(`Tag skipped: "${newTag}" is already in your tag list.`, elements);
            return false;
        }
        
        state.tags.push(newTag);
        return true;
    };
    
    // Process comma-separated tags input
    elements.tags.input.addEventListener('input', function() {
        const currentLength = this.value.trim().length;
        
        // Show warning if approaching or exceeding max length
        if (currentLength > 20) {
            showError(`Tag is too long (${currentLength}/20). Must be 20 characters or less.`, elements);
        } else if (currentLength > 15) {
            elements.errorDisplay.textContent = `Tag length: ${currentLength}/20 (approaching limit)`;
            elements.errorDisplay.classList.remove('hidden');
            elements.errorDisplay.style.color = 'var(--warning-orange)';
            elements.errorDisplay.style.fontWeight = 'normal';
        } else if (elements.errorDisplay.textContent.includes('Tag length') || 
                elements.errorDisplay.textContent.includes('Tag is too long')) {
            elements.errorDisplay.classList.add('hidden');
        }
    });
    
    // Handle tag addition (Enter key or comma-separated list)
    elements.tags.input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            e.preventDefault();
            
            if (this.value.includes(',')) {
                const result = processCommaSeparatedTags(this.value, state.tags);
                state.tags = result.tags;
                
                if (result.addedTags.length > 0) {
                    renderTags();
                    
                    if (result.skippedTags.length > 0) {
                        showError(`Added ${result.addedTags.length} tags. Skipped ${result.skippedTags.length} tags (duplicates or too long).`, elements);
                    } else {
                        elements.errorDisplay.classList.add('hidden');
                    }
                }
            } else {
                if (addTag(this.value)) {
                    renderTags();
                }
            }
            
            this.value = '';
        }
    });
    
    // Handle paste events
    elements.tags.input.addEventListener('paste', function(e) {
        setTimeout(() => {
            if (this.value.includes(',')) {
                const result = processCommaSeparatedTags(this.value, state.tags);
                state.tags = result.tags;
                renderTags();
                this.value = '';
                
                if (result.skippedTags.length > 0) {
                    showError(`Added ${result.addedTags.length} tags. Skipped ${result.skippedTags.length} tags.`, elements);
                }
            }
        }, 0);
    });
    
    // Remove tag when delete button is clicked
    elements.tags.container.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-delete')) {
            const index = parseInt(e.target.dataset.index);
            state.tags.splice(index, 1);
            renderTags();
        }
    });
    
    // Tag grading
    elements.tags.gradeBtn.addEventListener('click', () => {
        elements.tags.feedback.classList.add('hidden');
        elements.errorDisplay.classList.add('hidden');
        
        if (state.tags.length === 0) {
            showError('Please add at least one tag', elements);
            return;
        }
        
        const title = elements.title.field.value.trim();
        
        // Grade the tags
        const gradeResult = gradeTags(state.tags, title);
        state.scores.tags = gradeResult.total_score;
        
        // Display detailed feedback
        elements.tags.feedback.innerHTML = formatGradeResults(gradeResult, 'tags');
        elements.tags.feedback.classList.remove('hidden');
        
        // Update overall grade
        updateOverallGrade(elements, state);
    });
    
    // Tag optimization
    elements.tags.optimizeBtn.addEventListener('click', async () => {
        if (!shouldAllowOptimization(state.scores.tags)) {
            showMessage('Tags already score well. Optimization not needed.', elements);
            return;
        }
        
        await optimizeField('tags', elements, state);
        updateAllGrades(elements, state);
    });
}

/**
 * Initialize description-related functionality
 */
function initDescriptionComponent(elements, state) {
    // Description changes - real-time grading
    elements.description.field.addEventListener('input', () => {
        state.inputChanged = true;
        updateAllGrades(elements, state);
    });
    
    // Description grading
    elements.description.gradeBtn.addEventListener('click', () => {
        elements.description.feedback.classList.add('hidden');
        elements.errorDisplay.classList.add('hidden');
        
        const description = elements.description.field.value.trim();
        const title = elements.title.field.value.trim();
        
        if (!description) {
            showError('Please enter a product description', elements);
            return;
        }
        
        // Grade the description
        const gradeResult = gradeDescription(description, title);
        state.scores.description = gradeResult.total_score;
        
        // Display detailed feedback
        elements.description.feedback.innerHTML = formatGradeResults(gradeResult, 'description');
        elements.description.feedback.classList.remove('hidden');
        
        // Update overall grade
        updateOverallGrade(elements, state);
    });
    
    // Description optimization
    elements.description.optimizeBtn.addEventListener('click', async () => {
        if (!shouldAllowOptimization(state.scores.description)) {
            showMessage('Description already scores well. Optimization not needed.', elements);
            return;
        }
        
        await optimizeField('description', elements, state);
        updateAllGrades(elements, state);
    });
}

/**
 * Initialize form submission
 */
function initFormSubmission(elements, state) {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        elements.errorDisplay.classList.add('hidden');
        
        const title = elements.title.field.value.trim();
        
        if (!title) {
            showError('Please enter a product title', elements);
            return;
        }
        
        if (shouldAllowOptimization(state.scores.overall)) {
            showLoading(true, elements);
            
            try {
                await optimizeAll(elements, state);
                updateAllGrades(elements, state);
            } catch (error) {
                showError('Error: ' + error.message, elements);
            } finally {
                showLoading(false, elements);
            }
        } else {
            showMessage('Your listing already scores well (grade ' + state.letterGrade + '). Optimization not needed.', elements);
        }
    });
}

/**
 * Update all grades and display real-time feedback
 */
function updateAllGrades(elements, state) {
    if (!state.inputChanged) return;
    
    const title = elements.title.field.value.trim();
    const description = elements.description.field.value.trim();
    
    // Grade all components
    state.scores.title = title ? gradeTitle(title, state.tags).total_score : 0;
    state.scores.tags = state.tags.length > 0 ? gradeTags(state.tags, title).total_score : 0;
    state.scores.description = description ? gradeDescription(description, title).total_score : 0;
    
    // Calculate overall grade
    updateOverallGrade(elements, state);
    
    // Update optimization buttons based on scores
    updateOptimizationButtons(elements, state);
    
    state.inputChanged = false;
}

/**
 * Update overall grade and display it
 */
function updateOverallGrade(elements, state) {
    // Calculate overall grade
    const overall = calculateOverallGrade(
        state.scores.title,
        state.scores.tags,
        state.scores.description
    );
    
    state.scores.overall = overall.score;
    state.letterGrade = overall.letter;
    
    // Update real-time score display
    if (elements.realTimeScore) {
        elements.realTimeScore.textContent = `${overall.score.toFixed(1)}/4.0 (Grade ${overall.letter})`;
        
        // Update color based on grade
        elements.realTimeScore.className = 'real-time-score ' + getGradeClass(overall.letter).replace('grade-', 'text-');
    }
    
    // Update individual component scores if available
    if (elements.results.titleScore) {
        elements.results.titleScore.textContent = state.scores.title.toFixed(1) + '/4.0';
    }
    
    if (elements.results.tagsScore) {
        elements.results.tagsScore.textContent = state.scores.tags.toFixed(1) + '/4.0';
    }
    
    if (elements.results.descriptionScore) {
        elements.results.descriptionScore.textContent = state.scores.description.toFixed(1) + '/4.0';
    }
    
    // Update grade display in results section
    if (elements.results.gradeDisplay) {
        elements.results.gradeDisplay.textContent = `${overall.score.toFixed(1)}/4.0 (${overall.letter})`;
        
        // Set the appropriate grade class
        const gradeClass = getGradeClass(overall.letter);
        const scoreElement = elements.results.gradeDisplay.closest('.score');
        if (scoreElement) {
            // Remove all existing grade classes
            scoreElement.classList.remove('grade-a', 'grade-b', 'grade-c', 'grade-d');
            // Add the correct grade class
            scoreElement.classList.add(gradeClass);
        }
    }
}

/**
 * Update optimization buttons based on scores
 */
function updateOptimizationButtons(elements, state) {
    // Title optimization button
    if (elements.title.optimizeBtn) {
        elements.title.optimizeBtn.disabled = !shouldAllowOptimization(state.scores.title);
    }
    
    // Tags optimization button
    if (elements.tags.optimizeBtn) {
        elements.tags.optimizeBtn.disabled = !shouldAllowOptimization(state.scores.tags);
    }
    
    // Description optimization button
    if (elements.description.optimizeBtn) {
        elements.description.optimizeBtn.disabled = !shouldAllowOptimization(state.scores.description);
    }
    
    // Main optimize button
    const mainOptimizeBtn = elements.form.querySelector('button[type="submit"]');
    if (mainOptimizeBtn) {
        mainOptimizeBtn.disabled = !shouldAllowOptimization(state.scores.overall);
    }
    
    // Show/hide optimization disabled message
    if (elements.optimizeDisabledMsg) {
        if (shouldAllowOptimization(state.scores.overall)) {
            elements.optimizeDisabledMsg.classList.add('hidden');
        } else {
            elements.optimizeDisabledMsg.classList.remove('hidden');
        }
    }
}

/**
 * Show error message
 */
function showError(message, elements) {
    elements.errorDisplay.textContent = message;
    elements.errorDisplay.classList.remove('hidden');
    elements.errorDisplay.style.color = '#F44336';
    elements.errorDisplay.style.fontWeight = 'bold';
}

/**
 * Show general message
 */
function showMessage(message, elements) {
    elements.errorDisplay.textContent = message;
    elements.errorDisplay.classList.remove('hidden');
    elements.errorDisplay.style.color = '#4CAF50';
    elements.errorDisplay.style.fontWeight = 'normal';
}

/**
 * Show/hide loading indicator
 */
function showLoading(isLoading, elements) {
    if (isLoading) {
        elements.results.loading.style.display = 'flex';
    } else {
        elements.results.loading.style.display = 'none';
    }
}

/**
 * Optimize a specific field via API
 */
async function optimizeField(field, elements, state) {
    // Show loading state
    const buttonMap = {
        'title': elements.title.optimizeBtn,
        'tags': elements.tags.optimizeBtn,
        'description': elements.description.optimizeBtn
    };
    
    const button = buttonMap[field];
    const originalText = button.textContent;
    button.textContent = 'Optimizing...';
    button.disabled = true;
    
    try {
        // This would be an actual API call in a real implementation
        // For now, we'll simulate it with some basic logic
        
        const result = simulateOptimization(field, elements, state);
        
        // Update the appropriate field with the optimized content
        switch (field) {
            case 'title':
                elements.title.field.value = result.improvements.improved_title;
                break;
            case 'tags':
                state.tags = result.improvements.improved_tags;
                renderTags();
                break;
            case 'description':
                elements.description.field.value = result.improvements.improved_description;
                break;
        }
        
        // Show success message
        showMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} optimized successfully!`, elements);
        
    } catch (error) {
        showError('Error: ' + error.message, elements);
    } finally {
        // Reset button
        button.textContent = originalText;
        button.disabled = !shouldAllowOptimization(state.scores[field]);
    }
}

/**
 * Optimize all fields
 */
async function optimizeAll(elements, state) {
    try {
        // Placeholder for real API integration
        const result = simulateOptimization('all', elements, state);
        
        // Update all fields with optimized content
        elements.title.field.value = result.improvements.improved_title;
        state.tags = result.improvements.improved_tags;
        elements.description.field.value = result.improvements.improved_description;
        
        // Update UI
        renderTags();
        
        // Show success message
        showMessage('All fields optimized successfully!', elements);
        
    } catch (error) {
        showError('Error: ' + error.message, elements);
    }
}

/**
 * Placeholder function to simulate API responses
 * In a real application, this would call the actual API
 */
function simulateOptimization(field, elements, state) {
    // Get current values
    const title = elements.title.field.value.trim();
    const tags = state.tags;
    const description = elements.description.field.value.trim();
    
    // Create a simulated response
    return {
        scores: {
            title_score: { value: 3.5 },
            tags_score: { value: 3.8 },
            description_score: { value: 3.6 },
            overall_grade: { value: 3.6, letter: 'A' }
        },
        improvements: {
            improved_title: field === 'all' || field === 'title' ? 
                "Vintage Persian Runner Boho Pink Rug Handmade | Geometric Tribal Oriental Turkish Carpet | Bohemian Wool Hallway Entry Decor Small Area Mat" : 
                title,
                
            improved_tags: field === 'all' || field === 'tags' ? 
                ["vintage persian rug", "boho pink rug", "handmade carpet", "geometric tribal rug", "oriental turkish carpet", "bohemian wool rug", "hallway runner", "small area mat", "entry decor", "wool decor", "geometric carpet", "tribal design", "vintage decor"] : 
                tags,
                
            improved_description: field === 'all' || field === 'description' ?
                `This beautiful vintage Persian runner is a handmade masterpiece that adds bohemian charm to any space. The pink hues create a warm, inviting atmosphere in your home.

**Features:**
* Authentic handcrafted Persian runner with geometric tribal patterns
* Vibrant pink color with bohemian aesthetic
* Made from 100% natural wool for durability and warmth
* Perfect size for hallways, entryways, or as an accent piece
* Unique Oriental Turkish carpet design with rich cultural heritage
* Each rug is handmade, ensuring a one-of-a-kind addition to your home

**Dimensions:** [Add your specific dimensions here]

**Care Instructions:**
* Vacuum regularly on low setting without beater bar
* For spills, blot immediately with clean white cloth
* Professional cleaning recommended for deep cleaning
* Rotate periodically to ensure even wear

**Perfect for:** Adding a touch of elegance to your hallway, entry, or any space needing a pop of color and artistic flair. These vintage-inspired rugs make excellent gifts for new homeowners, boho decor enthusiasts, or anyone appreciating handcrafted textiles.

*Note: Due to the handmade nature of this product, slight variations in color and pattern may occur, making each piece uniquely yours.*` : 
                description,
                
            title_improvement_note: "Changed commas to pipes for better visual separation.",
            tags_improvement_note: "Created multi-word tags with better chain structure and increased specificity.",
            description_improvement_note: "Added structured formatting with bullet points and keyword integration."
        }
    };
}