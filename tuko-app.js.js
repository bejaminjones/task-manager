// In-memory storage for questions
let questions = {
    light: [],
    medium: [],
    deep: []
};

// DOM Elements
let questionsList, newQuestionForm, newQuestionText, newQuestionCategory;
let categoryBtns, exportBtn, importBtn, exportArea, exportData;
let copyExportBtn, closeExportBtn, editQuestionForm, editQuestionId;
let editQuestionText, editQuestionCategory, saveQuestionBtn;
let editQuestionModal, importModal, importData, confirmImportBtn;
let searchInput, clearSearchBtn, deleteConfirmModal;
let deleteQuestionText, confirmDeleteBtn;

// Current filter and search state
let currentCategory = 'light';
let searchTerm = '';
let deleteQuestionId = null;

// Initialize the app
function init() {
    // Initialize DOM elements
    questionsList = document.getElementById('questionsList');
    newQuestionForm = document.getElementById('newQuestionForm');
    newQuestionText = document.getElementById('newQuestionText');
    newQuestionCategory = document.getElementById('newQuestionCategory');
    categoryBtns = document.querySelectorAll('.category-btn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    exportArea = document.getElementById('exportArea');
    exportData = document.getElementById('exportData');
    copyExportBtn = document.getElementById('copyExportBtn');
    closeExportBtn = document.getElementById('closeExportBtn');
    editQuestionForm = document.getElementById('editQuestionForm');
    editQuestionId = document.getElementById('editQuestionId');
    editQuestionText = document.getElementById('editQuestionText');
    editQuestionCategory = document.getElementById('editQuestionCategory');
    saveQuestionBtn = document.getElementById('saveQuestionBtn');
    editQuestionModal = new bootstrap.Modal(document.getElementById('editQuestionModal'));
    importModal = new bootstrap.Modal(document.getElementById('importModal'));
    importData = document.getElementById('importData');
    confirmImportBtn = document.getElementById('confirmImportBtn');
    searchInput = document.getElementById('searchInput');
    clearSearchBtn = document.getElementById('clearSearchBtn');
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteQuestionText = document.getElementById('deleteQuestionText');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    loadQuestions();
    bindEvents();
    updateUI();
}

// Load questions from localStorage
function loadQuestions() {
    try {
        const savedQuestions = localStorage.getItem('tukoQuestions');
        if (savedQuestions) {
            questions = JSON.parse(savedQuestions);
        } else {
            // Initialize with empty arrays if nothing is saved
            questions = { light: [], medium: [], deep: [] };
            saveQuestions();
        }
    } catch (e) {
        console.error('Error loading questions:', e);
        showToast('Error loading questions. Starting with empty list.', 'danger');
        questions = { light: [], medium: [], deep: [] };
    }
}

// Save questions to localStorage
function saveQuestions() {
    try {
        localStorage.setItem('tukoQuestions', JSON.stringify(questions));
        updateStats();
    } catch (e) {
        console.error('Error saving questions:', e);
        showToast('Error saving questions', 'danger');
    }
}

// Bind event listeners
function bindEvents() {
    // Category selection
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderQuestions();
        });
    });

    // Add new question
    newQuestionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addQuestion(newQuestionText.value, newQuestionCategory.value);
    });

    // Export questions
    exportBtn.addEventListener('click', exportQuestions);
    copyExportBtn.addEventListener('click', copyExport);
    closeExportBtn.addEventListener('click', () => {
        exportArea.style.display = 'none';
    });
    document.getElementById('downloadSwiftBtn').addEventListener('click', downloadSwiftFile);

    // Import questions
    importBtn.addEventListener('click', () => importModal.show());
    confirmImportBtn.addEventListener('click', importQuestions);

    // Edit question
    saveQuestionBtn.addEventListener('click', saveEditedQuestion);

    // Search functionality
    searchInput.addEventListener('input', function() {
        searchTerm = this.value.toLowerCase();
        renderQuestions();
    });
    
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        renderQuestions();
    });

    // Delete confirmation
    confirmDeleteBtn.addEventListener('click', function() {
        if (deleteQuestionId !== null) {
            deleteQuestion(deleteQuestionId);
            deleteConfirmModal.hide();
        }
    });
}

// Update the UI
function updateUI() {
    updateStats();
    renderQuestions();
}

// Update question statistics
function updateStats() {
    document.getElementById('lightCount').textContent = questions.light.length;
    document.getElementById('mediumCount').textContent = questions.medium.length;
    document.getElementById('deepCount').textContent = questions.deep.length;
}

// Render questions based on current category and search
function renderQuestions() {
    let html = '';
    let filteredQuestions = [];

    // Get questions based on category filter
    if (currentCategory === 'all') {
        for (const category of ['light', 'medium', 'deep']) {
            filteredQuestions = filteredQuestions.concat(
                questions[category].map(q => ({ text: q, category: category, id: generateId(q, category) }))
            );
        }
    } else {
        filteredQuestions = questions[currentCategory].map(q => ({ 
            text: q, 
            category: currentCategory,
            id: generateId(q, currentCategory)
        }));
    }

    // Apply search filter if needed
    if (searchTerm) {
        filteredQuestions = filteredQuestions.filter(q => 
            q.text.toLowerCase().includes(searchTerm)
        );
    }

    // Generate HTML for each question
    if (filteredQuestions.length === 0) {
        html = '<div class="text-center text-muted p-4">No questions found. Try a different category or search term.</div>';
    } else {
        filteredQuestions.forEach(q => {
            const categoryClass = `${q.category}-category`;
            const categoryBg = `${q.category}-category-bg`;
            html += `
                <div class="card mb-3 ${categoryBg}" data-id="${q.id}" data-category="${q.category}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div class="question-text">${q.text}</div>
                            <div class="question-actions">
                                <button class="icon-btn edit-btn ${categoryClass}" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="icon-btn delete-btn text-danger" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    questionsList.innerHTML = html;

    // Add event handlers to the newly created elements
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.card');
            const id = card.dataset.id;
            const category = card.dataset.category;
            const text = card.querySelector('.question-text').textContent;
            openEditModal(id, text, category);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.card');
            const id = card.dataset.id;
            const text = card.querySelector('.question-text').textContent;
            openDeleteConfirmation(id, text);
        });
    });

    document.querySelectorAll('.question-text').forEach(text => {
        text.addEventListener('click', function() {
            const card = this.closest('.card');
            const id = card.dataset.id;
            const category = card.dataset.category;
            const questionText = this.textContent;
            openEditModal(id, questionText, category);
        });
    });
}

// Add a new question
function addQuestion(text, category) {
    if (!text.trim()) {
        showToast('Please enter a question', 'warning');
        return;
    }

    // Check if the question already exists in the category
    if (questions[category].includes(text)) {
        showToast('This question already exists in this category', 'warning');
        return;
    }
    
    // Ensure the text ends with a question mark
    if (!text.trim().endsWith('?')) {
        text = text.trim() + '?';
    }

    questions[category].push(text);
    saveQuestions();
    renderQuestions();
    
    // Reset the form
    newQuestionText.value = '';
    showToast('Question added successfully!', 'success');
}

// Delete a question
function deleteQuestion(id) {
    const [category, index] = parseQuestionId(id);
    if (category && index !== -1) {
        questions[category].splice(index, 1);
        saveQuestions();
        renderQuestions();
        showToast('Question deleted', 'success');
    }
}

// Open edit modal
function openEditModal(id, text, category) {
    editQuestionId.value = id;
    editQuestionText.value = text;
    editQuestionCategory.value = category;
    editQuestionModal.show();
}

// Save edited question
function saveEditedQuestion() {
    const id = editQuestionId.value;
    const newText = editQuestionText.value;
    const newCategory = editQuestionCategory.value;
    
    if (!newText.trim()) {
        showToast('Question text cannot be empty', 'warning');
        return;
    }

    // Format with question mark if needed
    let formattedText = newText.trim();
    if (!formattedText.endsWith('?')) {
        formattedText += '?';
    }

    const [oldCategory, index] = parseQuestionId(id);
    
    if (oldCategory && index !== -1) {
        // Remove from old category
        questions[oldCategory].splice(index, 1);
        
        // Add to potentially new category
        questions[newCategory].push(formattedText);
        
        saveQuestions();
        renderQuestions();
        editQuestionModal.hide();
        showToast('Question updated successfully', 'success');
    }
}

// Open delete confirmation modal
function openDeleteConfirmation(id, text) {
    deleteQuestionId = id;
    deleteQuestionText.textContent = text;
    deleteConfirmModal.show();
}

// Export questions to Swift format
function exportQuestions() {
    // Start with the file header
    let swift = `//
//  Questions.swift
//  Tuko
//
//  Generated on ${new Date().toLocaleDateString()}
//

import Foundation

struct Questions {
`;
    const categories = ['light', 'medium', 'deep'];
    
    // Add each category array
    categories.forEach(category => {
        swift += `    static let ${category} = [\n`;
        questions[category].forEach((q, i) => {
            // Escape double quotes and properly format Swift string
            const escapedQuestion = q.replace(/"/g, '\\"');
            swift += `        "${escapedQuestion}"`;
            if (i < questions[category].length - 1) {
                swift += ',';
            }
            swift += '\n';
        });
        swift += `    ]\n\n`;
    });
    
    // Add the remainder of the Questions struct from the original file
    swift += `    // Singleton instance of the procedural question generator
    private static let questionGenerator = ProceduralQuestionGenerator()
    
    // The number of questions to generate at once
    private static let generationBatchSize = 10
    
    // The threshold for when to generate more questions
    private static let generationThreshold = 10
    
    // Key for storing whether generated questions are enabled
    private static let useGeneratedQuestionsKey = "useGeneratedQuestions"
    
    // Key for storing generated questions in UserDefaults
    private static func storageKey(for category: ConversationCategory) -> String {
        return "GeneratedQuestions_\\(category.rawValue)"
    }
    
    // Getter and setter for useGeneratedQuestions - using UserDefaults directly instead of @AppStorage
    static var useGeneratedQuestions: Bool {
        get {
            return UserDefaults.standard.bool(forKey: useGeneratedQuestionsKey)
        }
        set {
            UserDefaults.standard.set(newValue, forKey: useGeneratedQuestionsKey)
        }
    }
    
    // Getter method that combines default and generated questions
    static func getQuestions(for category: ConversationCategory) -> [String] {
        // Get the default questions
        let defaultQuestions: [String]
        switch category {
        case .light:
            defaultQuestions = light
        case .medium:
            defaultQuestions = medium
        case .deep:
            defaultQuestions = deep
        }
        
        // If generated questions are disabled, just return the defaults
        guard useGeneratedQuestions else {
            return defaultQuestions
        }
        
        // Combine with any stored generated questions
        let generatedQuestions = getStoredQuestions(for: category)
        let combinedQuestions = defaultQuestions + generatedQuestions
        
        // If we're running low on questions, trigger generation of more
        if generatedQuestions.count < generationThreshold {
            Task {
                await generateNewQuestions(for: category)
            }
        }
        
        return combinedQuestions
    }
    
    // Generate new questions - returns the count of newly added questions
    @discardableResult
    static func generateNewQuestions(for category: ConversationCategory) async -> [String] {
        // Generate new questions
        let newQuestions = questionGenerator.generateQuestions(for: category, count: generationBatchSize)
        
        // Add to stored questions and get count of actually added questions
        let addedQuestions = await addToStoredQuestions(newQuestions, for: category)
        
        return addedQuestions
    }
    
    // Get stored questions
    private static func getStoredQuestions(for category: ConversationCategory) -> [String] {
        let key = storageKey(for: category)
        return UserDefaults.standard.stringArray(forKey: key) ?? []
    }
    
    // Add to stored questions (avoiding duplicates)
    // Returns the list of questions that were actually added (no duplicates)
    private static func addToStoredQuestions(_ questions: [String], for category: ConversationCategory) async -> [String] {
        let key = storageKey(for: category)
        var existingQuestions = getStoredQuestions(for: category)
        var addedQuestions: [String] = []
        
        for question in questions {
            if !existingQuestions.contains(question) {
                existingQuestions.append(question)
                addedQuestions.append(question)
            }
        }
        
        if !addedQuestions.isEmpty {
            UserDefaults.standard.set(existingQuestions, forKey: key)
        }
        
        return addedQuestions
    }
    
    // Clear stored generated questions
    static func clearGeneratedQuestions(for category: ConversationCategory? = nil) {
        if let category = category {
            let key = storageKey(for: category)
            UserDefaults.standard.removeObject(forKey: key)
        } else {
            for category in ConversationCategory.allCases {
                let key = storageKey(for: category)
                UserDefaults.standard.removeObject(forKey: key)
            }
        }
    }
    
    // Check if generating
    static var isGeneratingQuestions: Bool {
        questionGenerator.isGenerating
    }
}`;

    exportData.value = swift;
    exportArea.style.display = 'block';
    exportData.select();
}

// Copy exported data to clipboard
function copyExport() {
    exportData.select();
    document.execCommand('copy');
    showToast('Copied to clipboard!', 'success');
}

// Download Questions.swift file
function downloadSwiftFile() {
    const content = exportData.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Questions.swift';
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Questions.swift downloaded!', 'success');
}

// Import questions
function importQuestions() {
    // Determine which tab is active
    const swiftTabActive = document.getElementById('swift-tab').classList.contains('active');
    
    if (swiftTabActive) {
        importFromSwift();
    } else {
        importFromJSON();
    }
}

// Import from JSON format
function importFromJSON() {
    try {
        const importedData = JSON.parse(importData.value);
        
        let importCount = 0;
        let skipCount = 0;
        
        ['light', 'medium', 'deep'].forEach(category => {
            if (Array.isArray(importedData[category])) {
                importedData[category].forEach(q => {
                    let formattedQ = q.trim();
                    if (!formattedQ.endsWith('?')) {
                        formattedQ += '?';
                    }
                    
                    if (!questions[category].includes(formattedQ)) {
                        questions[category].push(formattedQ);
                        importCount++;
                    } else {
                        skipCount++;
                    }
                });
            }
        });
        
        finishImport(importCount, skipCount);
    } catch (e) {
        console.error('JSON Import error:', e);
        showToast('Invalid JSON format. Please check your data.', 'danger');
    }
}

// Import from Questions.swift format
function importFromSwift() {
    const swiftContent = document.getElementById('importSwiftData').value;
    
    try {
        let importCount = 0;
        let skipCount = 0;
        
        // Process each category
        ['light', 'medium', 'deep'].forEach(category => {
            // Create regex pattern to match Swift array declarations
            // This looks for patterns like: static let light = [ ... ]
            const regex = new RegExp(`static\\s+let\\s+${category}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'i');
            const match = swiftContent.match(regex);
            
            if (match && match[1]) {
                // Extract the array content
                let arrayContent = match[1];
                
                // Split by commas, but be careful about commas within quotes
                let items = [];
                let currentItem = '';
                let inQuotes = false;
                let escaping = false;
                
                for (let i = 0; i < arrayContent.length; i++) {
                    const char = arrayContent[i];
                    
                    if (escaping) {
                        currentItem += char;
                        escaping = false;
                        continue;
                    }
                    
                    if (char === '\\') {
                        currentItem += char;
                        escaping = true;
                        continue;
                    }
                    
                    if (char === '"' && !escaping) {
                        inQuotes = !inQuotes;
                        continue;
                    }
                    
                    if (char === ',' && !inQuotes) {
                        if (currentItem.trim()) {
                            items.push(currentItem.trim());
                        }
                        currentItem = '';
                        continue;
                    }
                    
                    currentItem += char;
                }
                
                // Add the last item if there is one
                if (currentItem.trim()) {
                    items.push(currentItem.trim());
                }
                
                // Process each item - remove quotes and handle duplicates
                items.forEach(item => {
                    // Remove quotes and trim whitespace
                    let questionText = item.replace(/^"/, '').replace(/"$/, '').trim();
                    
                    // Unescape quotes
                    questionText = questionText.replace(/\\"/g, '"');
                    
                    // Ensure it ends with a question mark
                    if (!questionText.endsWith('?')) {
                        questionText += '?';
                    }
                    
                    // Add if not a duplicate
                    if (!questions[category].includes(questionText)) {
                        questions[category].push(questionText);
                        importCount++;
                    } else {
                        skipCount++;
                    }
                });
            }
        });
        
        finishImport(importCount, skipCount);
    } catch (e) {
        console.error('Swift Import error:', e);
        showToast('Error parsing Swift file. Please check the format.', 'danger');
    }
}

// Complete the import process
function finishImport(importCount, skipCount) {
    saveQuestions();
    renderQuestions();
    importModal.hide();
    
    if (importCount > 0) {
        showToast(`Imported ${importCount} questions successfully! (${skipCount} duplicates skipped)`, 'success');
    } else if (skipCount > 0) {
        showToast(`No new questions imported. ${skipCount} duplicates were skipped.`, 'warning');
    } else {
        showToast('No valid questions found in import data', 'warning');
    }
    
    // Clear the import fields
    document.getElementById('importData').value = '';
    document.getElementById('importSwiftData').value = '';
}

// Generate a unique ID for a question
function generateId(text, category) {
    const index = questions[category].indexOf(text);
    return `${category}-${index}`;
}

// Parse a question ID to get category and index
function parseQuestionId(id) {
    const parts = id.split('-');
    if (parts.length === 2) {
        const category = parts[0];
        const index = parseInt(parts[1], 10);
        return [category, index];
    }
    return [null, -1];
}

// Show a toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast show bg-${type} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white">
            <strong class="me-auto">Tuko Question Manager</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 500);
    }, 5000);
    
    // Add close button functionality
    toast.querySelector('.btn-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 500);
    });
}

// Initialize the app on page load
document.addEventListener('DOMContentLoaded', init);