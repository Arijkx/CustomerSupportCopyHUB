// Data structure for answers
let answers = [];
let categories = []; // List of all categories (including empty ones)
let currentEditingId = null;
let selectedCategory = 'all';
let pendingDeleteId = null; // ID of answer pending deletion

// DOM Elements
const answersList = document.getElementById('answersList');
const categorySidebar = document.getElementById('categorySidebar');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const newEntryBtn = document.getElementById('newEntryBtn');
const backupBtn = document.getElementById('backupBtn');
const entryModal = document.getElementById('entryModal');
const backupModal = document.getElementById('backupModal');
const entryForm = document.getElementById('entryForm');
const entryTitle = document.getElementById('entryTitle');
const entryContent = document.getElementById('entryContent');
const entryCategory = document.getElementById('entryCategory');
const newCategoryInput = document.getElementById('newCategoryInput');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.querySelector('.close');
const closeBackupModal = document.getElementById('closeBackupModal');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const uploadAllBtn = document.getElementById('uploadAllBtn');
const uploadFileInput = document.getElementById('uploadFileInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const categoryName = document.getElementById('categoryName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const closeCategoryModal = document.getElementById('closeCategoryModal');
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const successOkBtn = document.getElementById('successOkBtn');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const deleteModal = document.getElementById('deleteModal');
const deleteMessage = document.getElementById('deleteMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteModal = document.getElementById('closeDeleteModal');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadAnswers(); // This will also initialize categories from answers
    loadCategories(); // This loads stored categories and merges with answer categories
    updateCategorySelect();
    renderCategorySidebar();
    renderAnswers();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    newEntryBtn.addEventListener('click', openNewEntryModal);
    backupBtn.addEventListener('click', openBackupModal);
    entryForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', closeEntryModal);
    closeModal.addEventListener('click', closeEntryModal);
    closeBackupModal.addEventListener('click', () => {
        backupModal.classList.remove('show');
    });
    downloadAllBtn.addEventListener('click', downloadAllAnswers);
    uploadAllBtn.addEventListener('click', () => uploadFileInput.click());
    uploadFileInput.addEventListener('change', handleFileUpload);
    addCategoryBtn.addEventListener('click', openCategoryModal);
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    cancelCategoryBtn.addEventListener('click', closeCategoryModalFunc);
    closeCategoryModal.addEventListener('click', closeCategoryModalFunc);
    successOkBtn.addEventListener('click', closeSuccessModalFunc);
    closeSuccessModal.addEventListener('click', closeSuccessModalFunc);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModalFunc);
    closeDeleteModal.addEventListener('click', closeDeleteModalFunc);
}


// Load categories from localStorage
function loadCategories() {
    const stored = localStorage.getItem('customerSupportCategories');
    const categorySet = new Set();
    
    // Add categories from stored list
    if (stored) {
        const storedCategories = JSON.parse(stored);
        storedCategories.forEach(cat => categorySet.add(cat));
    }
    
    // Also add categories from existing answers
    answers.forEach(answer => {
        if (answer.category && answer.category !== 'Favoriten') {
            categorySet.add(answer.category);
        }
    });
    
    categories = Array.from(categorySet).sort();
    saveCategories();
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('customerSupportCategories', JSON.stringify(categories));
}

// Get all categories (from stored list and from answers)
function getCategories() {
    const categorySet = new Set(categories);
    // Also include categories from answers
    answers.forEach(answer => {
        if (answer.category && answer.category !== 'Favoriten') {
            categorySet.add(answer.category);
        }
    });
    return Array.from(categorySet).sort();
}

// Render category sidebar
function renderCategorySidebar() {
    const categories = getCategories();
    const allCount = answers.length;
    const favoritesCount = answers.filter(a => a.favorite === true).length;
    
    // Render category links
    categorySidebar.innerHTML = `
        <button class="category-link ${selectedCategory === 'all' ? 'active' : ''}" data-category="all" onclick="filterByCategory('all')">
            <span>All Categories</span>
            <span class="category-link-count" id="all-count">${allCount}</span>
        </button>
        <button class="category-link ${selectedCategory === 'Favoriten' ? 'active' : ''}" data-category="Favoriten" onclick="filterByCategory('Favoriten')">
            <span>⭐ Favoriten</span>
            <span class="category-link-count">${favoritesCount}</span>
        </button>
        ${categories.map(category => {
            const count = answers.filter(a => a.category === category).length;
            return `
                <button class="category-link ${selectedCategory === category ? 'active' : ''}" data-category="${escapeHtml(category)}" onclick="filterByCategory('${escapeHtml(category)}')">
                    <span>${escapeHtml(category)}</span>
                    <span class="category-link-count">${count}</span>
                </button>
            `;
        }).join('')}
    `;
}

// Filter by category
function filterByCategory(category) {
    selectedCategory = category;
    renderCategorySidebar();
    
    // Clear search when filtering
    searchInput.value = '';
    
    // Re-render answers with category filter
    renderAnswers();
}

// Update category select dropdown
function updateCategorySelect() {
    const categories = getCategories();
    entryCategory.innerHTML = '<option value="">-- Select Category --</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        entryCategory.appendChild(option);
    });
}

// Load answers from localStorage
function loadAnswers() {
    const stored = localStorage.getItem('customerSupportAnswers');
    if (stored) {
        answers = JSON.parse(stored);
        // Migrate old data without categories and favorites
        answers = answers.map(answer => {
            if (!answer.category) {
                answer.category = 'Uncategorized';
            }
            if (answer.favorite === undefined) {
                answer.favorite = false;
            }
            return answer;
        });
        
        // Add categories from answers to the categories list if not already there
        answers.forEach(answer => {
            if (answer.category && answer.category !== 'Favoriten' && !categories.includes(answer.category)) {
                categories.push(answer.category);
            }
        });
        categories.sort();
        saveCategories();
    } else {
        // Example data
        answers = [
            {
                id: Date.now(),
                title: 'Welcome Message',
                content: 'Hello,\n\nThank you for your message. We are happy to help you.\n\nBest regards\nYour Support Team',
                category: 'General',
                favorite: false
            },
            {
                id: Date.now() + 1,
                title: 'Refund Request',
                content: 'Hello,\n\nThank you for your refund request. We are processing your request and will get back to you within 2-3 business days.\n\nBest regards\nYour Support Team',
                category: 'Billing',
                favorite: false
            }
        ];
        // Initialize categories from example data
        categories = ['General', 'Billing'];
        saveCategories();
        saveAnswers();
    }
}

// Save answers to localStorage
function saveAnswers() {
    localStorage.setItem('customerSupportAnswers', JSON.stringify(answers));
}

// Render answers grouped by category
function renderAnswers(filteredAnswers = null) {
    let answersToRender = filteredAnswers || answers;
    
    // Apply category filter if not "all"
    if (selectedCategory !== 'all' && !filteredAnswers) {
        if (selectedCategory === 'Favoriten') {
            // Special handling for favorites - show all answers that are favorited
            answersToRender = answersToRender.filter(answer => answer.favorite === true);
        } else {
            answersToRender = answersToRender.filter(answer => answer.category === selectedCategory);
        }
    }
    
    if (answersToRender.length === 0) {
        answersList.innerHTML = `
            <div class="empty-state">
                <h3>No answers found</h3>
                <p>Create a new answer or change your search criteria.</p>
            </div>
        `;
        return;
    }

    // Show all answers in one list (no category tabs)
    // For "All Categories" show category badge, for specific categories don't show badge
    const showCategoryBadge = selectedCategory === 'all';
    
    answersList.innerHTML = answersToRender.map(answer => {
        const category = answer.category || 'Uncategorized';
        const favoriteIcon = answer.favorite ? '<span class="favorite-icon">⭐</span>' : '';
        const categoryBadge = showCategoryBadge ? `<span class="category-badge">${escapeHtml(category)}</span>` : '';
        
        return `
            <div class="answer-item" data-id="${answer.id}">
                <div class="answer-header" onclick="toggleAnswer(${answer.id})">
                    <div class="answer-title-wrapper">
                        ${favoriteIcon}
                        ${categoryBadge}
                        <span class="answer-title">${escapeHtml(answer.title)}</span>
                    </div>
                    <span class="answer-toggle">▼</span>
                </div>
                <div class="answer-content">
                    <div class="answer-preview">${escapeHtml(answer.content)}</div>
                    <div class="answer-actions">
                        <button class="btn btn-copy" onclick="copyAnswer(${answer.id}, event)" title="Copy">Copy</button>
                        <button class="btn btn-favorite ${answer.favorite ? 'active' : ''}" onclick="toggleFavorite(${answer.id}, event)" title="${answer.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                            ${answer.favorite ? '⭐' : '☆'}
                        </button>
                        <button class="btn btn-edit" onclick="editAnswer(${answer.id}, event)" title="Edit">Edit</button>
                        <button class="btn btn-download" onclick="downloadAnswer(${answer.id}, event)" title="Download">⬇</button>
                        <button class="btn btn-delete" onclick="deleteAnswer(${answer.id}, event)" title="Delete">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle category expand/collapse
function toggleCategory(categoryId) {
    const categoryContent = document.getElementById(categoryId);
    const toggle = document.getElementById(`${categoryId}-toggle`);
    
    if (categoryContent && toggle) {
        if (categoryContent.style.display === 'none') {
            categoryContent.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            categoryContent.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

// Toggle answer expand/collapse
function toggleAnswer(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.classList.toggle('expanded');
    }
}

// Copy answer
function copyAnswer(id, event) {
    event.stopPropagation();
    const answer = answers.find(a => a.id === id);
    if (answer) {
        navigator.clipboard.writeText(answer.content).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('Error copying:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = answer.content;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showCopyNotification();
            } catch (err) {
                alert('Error copying. Please copy manually.');
            }
            document.body.removeChild(textArea);
        });
    }
}

// Download single answer
function downloadAnswer(id, event) {
    event.stopPropagation();
    const answer = answers.find(a => a.id === id);
    if (answer) {
        const dataStr = JSON.stringify([answer], null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `answer-${answer.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Download all answers
function downloadAllAnswers() {
    const dataStr = JSON.stringify(answers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer-support-answers-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const uploadedData = JSON.parse(e.target.result);
            
            if (Array.isArray(uploadedData)) {
                // Merge with existing answers (avoid duplicates by ID)
                uploadedData.forEach(uploadedAnswer => {
                    const existingIndex = answers.findIndex(a => a.id === uploadedAnswer.id);
                    if (existingIndex !== -1) {
                        // Update existing
                        answers[existingIndex] = uploadedAnswer;
                    } else {
                        // Add new
                        answers.push(uploadedAnswer);
                    }
                });
                
                saveAnswers();
                updateCategorySelect();
                renderCategorySidebar();
                renderAnswers();
                handleSort();
                showSuccessModal('Answers uploaded successfully!', true);
            } else {
                alert('Invalid file format. Expected an array of answers.');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
    uploadFileInput.value = '';
}

// Show copy notification
function showCopyNotification() {
    let notification = document.querySelector('.copy-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = '✓ Copied to clipboard!';
        document.body.appendChild(notification);
    }
    
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Edit answer
function editAnswer(id, event) {
    event.stopPropagation();
    const answer = answers.find(a => a.id === id);
    if (answer) {
        currentEditingId = id;
        modalTitle.textContent = 'Edit Answer';
        entryTitle.value = answer.title;
        entryContent.value = answer.content;
        
        // Set category
        updateCategorySelect();
        if (answer.category) {
            entryCategory.value = answer.category;
        } else {
            entryCategory.value = '';
        }
        
        entryModal.classList.add('show');
        entryTitle.focus();
    }
}

// Delete answer
function deleteAnswer(id, event) {
    event.stopPropagation();
    const answer = answers.find(a => a.id === id);
    if (answer) {
        pendingDeleteId = id;
        deleteMessage.textContent = `Are you sure you want to delete "${answer.title}"?`;
        deleteModal.classList.add('show');
    }
}

// Confirm delete
function confirmDelete() {
    if (pendingDeleteId !== null) {
        answers = answers.filter(a => a.id !== pendingDeleteId);
        saveAnswers();
        renderCategorySidebar();
        renderAnswers();
        
        // Maintain search filter if active
        if (searchInput.value.trim()) {
            handleSearch();
        } else {
            handleSort();
        }
        
        closeDeleteModalFunc();
    }
}

// Close delete modal
function closeDeleteModalFunc() {
    deleteModal.classList.remove('show');
    pendingDeleteId = null;
}

// Search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = answers;
    
    // Apply category filter first
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(answer => answer.category === selectedCategory);
    }
    
    // Then apply search filter
    if (query !== '') {
        filtered = filtered.filter(answer => 
            answer.title.toLowerCase().includes(query) ||
            answer.content.toLowerCase().includes(query) ||
            (answer.category && answer.category.toLowerCase().includes(query))
        );
    }
    
    renderAnswers(filtered);
}

// Sort
function handleSort() {
    const sortValue = sortSelect.value;
    const sorted = [...answers];
    
    if (sortValue === 'name-asc') {
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'en'));
    } else if (sortValue === 'name-desc') {
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'en'));
    }
    
    answers = sorted;
    saveAnswers();
    renderAnswers();
}

// Open modal for new answer
function openNewEntryModal() {
    currentEditingId = null;
    modalTitle.textContent = 'Create New Answer';
    entryTitle.value = '';
    entryContent.value = '';
    entryCategory.value = '';
    updateCategorySelect();
    entryModal.classList.add('show');
    entryTitle.focus();
}

// Close modal
function closeEntryModal() {
    entryModal.classList.remove('show');
    currentEditingId = null;
    entryForm.reset();
}

// Open backup modal
function openBackupModal() {
    backupModal.classList.add('show');
}

// Handle form submit
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = entryTitle.value.trim();
    const content = entryContent.value.trim();
    const category = entryCategory.value.trim();
    
    if (!title || !content || !category) {
        alert('Please fill in all fields.');
        return;
    }
    
    if (currentEditingId) {
        // Edit existing
        const index = answers.findIndex(a => a.id === currentEditingId);
        if (index !== -1) {
            answers[index].title = title;
            answers[index].content = content;
            answers[index].category = category;
        }
    } else {
        // Create new
        const newAnswer = {
            id: Date.now(),
            title: title,
            content: content,
            category: category,
            favorite: false
        };
        answers.push(newAnswer);
    }
    
    saveAnswers();
    updateCategorySelect();
    renderCategorySidebar();
    renderAnswers();
    closeEntryModal();
    
    // Maintain sort order
    handleSort();
}

// Open category modal
function openCategoryModal() {
    categoryName.value = '';
    categoryModal.classList.add('show');
    categoryName.focus();
}

// Close category modal
function closeCategoryModalFunc() {
    categoryModal.classList.remove('show');
    categoryForm.reset();
}

// Show success modal
function showSuccessModal(message, closeBackupModal = false) {
    successMessage.textContent = message;
    successModal.classList.add('show');
    
    // Store flag to close backup modal
    successModal.dataset.closeBackup = closeBackupModal;
}

// Close success modal
function closeSuccessModalFunc() {
    successModal.classList.remove('show');
    
    // Close backup modal if flag is set
    if (successModal.dataset.closeBackup === 'true') {
        backupModal.classList.remove('show');
        successModal.dataset.closeBackup = 'false';
    }
}

// Handle category form submit
function handleCategoryFormSubmit(e) {
    e.preventDefault();
    
    const name = categoryName.value.trim();
    
    if (!name) {
        alert('Please enter a category name.');
        return;
    }
    
    // Check if category already exists
    const allCategories = getCategories();
    if (allCategories.includes(name)) {
        alert('This category already exists.');
        return;
    }
    
    // Add category to the list
    categories.push(name);
    categories.sort();
    saveCategories();
    
    // Update UI
    updateCategorySelect();
    renderCategorySidebar();
    
    closeCategoryModalFunc();
}

// HTML Escaping
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle favorite status
function toggleFavorite(id, event) {
    event.stopPropagation();
    const answer = answers.find(a => a.id === id);
    if (answer) {
        // Save expanded state and content before updating
        const item = document.querySelector(`[data-id="${id}"]`);
        const wasExpanded = item?.classList.contains('expanded');
        const answerContent = item?.querySelector('.answer-content');
        
        // Toggle favorite status
        answer.favorite = !answer.favorite;
        saveAnswers();
        
        // Update only the favorite button and sidebar, not the entire list
        if (item) {
            const favoriteBtn = item.querySelector('.btn-favorite');
            if (favoriteBtn) {
                if (answer.favorite) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.innerHTML = '⭐';
                    favoriteBtn.title = 'Remove from favorites';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.innerHTML = '☆';
                    favoriteBtn.title = 'Add to favorites';
                }
            }
            
            // Update favorite icon in title if present
            const titleWrapper = item.querySelector('.answer-title-wrapper');
            if (titleWrapper) {
                const favoriteIcon = titleWrapper.querySelector('.favorite-icon');
                if (answer.favorite) {
                    if (!favoriteIcon) {
                        const icon = document.createElement('span');
                        icon.className = 'favorite-icon';
                        icon.textContent = '⭐';
                        titleWrapper.insertBefore(icon, titleWrapper.firstChild);
                    }
                } else {
                    if (favoriteIcon) {
                        favoriteIcon.remove();
                    }
                }
            } else {
                // For category view, update title with favorite icon
                const answerTitle = item.querySelector('.answer-title');
                if (answerTitle) {
                    const currentText = answerTitle.textContent.trim();
                    if (answer.favorite && !currentText.startsWith('⭐')) {
                        answerTitle.textContent = `⭐ ${currentText}`;
                    } else if (!answer.favorite && currentText.startsWith('⭐')) {
                        answerTitle.textContent = currentText.replace(/^⭐\s*/, '');
                    }
                }
            }
        }
        
        // Update sidebar only (don't re-render the list to avoid closing/animating)
        renderCategorySidebar();
    }
}

// Global functions for onclick handlers
window.toggleAnswer = toggleAnswer;
window.toggleCategory = toggleCategory;
window.copyAnswer = copyAnswer;
window.editAnswer = editAnswer;
window.deleteAnswer = deleteAnswer;
window.downloadAnswer = downloadAnswer;
window.filterByCategory = filterByCategory;
window.toggleFavorite = toggleFavorite;
