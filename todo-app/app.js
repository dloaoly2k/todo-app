/**
 * Multi-List To-Do Application
 * Handles multiple named to-do lists with individual task management
 */

// ===== DOM ELEMENTS =====
// Dashboard elements
const dashboardView = document.getElementById('dashboardView');
const newListNameInput = document.getElementById('newListName');
const createListBtn = document.getElementById('createListBtn');
const listsContainer = document.getElementById('listsContainer');

// Theme toggle
const themeToggleBtn = document.getElementById('themeToggle');

// List view elements
const listView = document.getElementById('listView');
const backToDashboardBtn = document.getElementById('backToDashboard');
const currentListName = document.getElementById('currentListName');
const editListNameBtn = document.getElementById('editListNameBtn');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const deleteListBtn = document.getElementById('deleteListBtn');

// Modal elements
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');

// Debug: Check if all elements are found
console.log('DOM Elements Check:', {
    dashboardView: !!dashboardView,
    newListNameInput: !!newListNameInput,
    createListBtn: !!createListBtn,
    listsContainer: !!listsContainer,
    themeToggleBtn: !!themeToggleBtn,
    listView: !!listView,
    backToDashboardBtn: !!backToDashboardBtn,
    currentListName: !!currentListName,
    editListNameBtn: !!editListNameBtn,
    taskInput: !!taskInput,
    addTaskBtn: !!addTaskBtn,
    taskList: !!taskList,
    deleteListBtn: !!deleteListBtn,
    confirmModal: !!confirmModal,
    modalTitle: !!modalTitle,
    modalMessage: !!modalMessage,
    confirmYesBtn: !!confirmYesBtn,
    confirmNoBtn: !!confirmNoBtn
});

// ===== APPLICATION STATE =====
let lists = [];
let currentListId = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Drag and drop state
let draggedElement = null;
let draggedIndex = -1;

// ===== UTILITY FUNCTIONS =====

/**
 * Generates a unique ID for lists and tasks
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Saves lists to localStorage
 * @param {Array} listsArray - Array of list objects to save
 */
function saveListsToStorage(listsArray) {
    try {
        localStorage.setItem('todoLists', JSON.stringify(listsArray));
        console.log('Lists saved to localStorage successfully');
    } catch (error) {
        console.error('Error saving lists to localStorage:', error);
    }
}

/**
 * Loads lists from localStorage
 * @returns {Array} Array of list objects or empty array if none found
 */
function loadListsFromStorage() {
    try {
        const storedLists = localStorage.getItem('todoLists');
        return storedLists ? JSON.parse(storedLists) : [];
    } catch (error) {
        console.error('Error loading lists from localStorage:', error);
        return [];
    }
}

/**
 * Creates a new list object
 * @param {string} name - List name
 * @returns {Object} List object with id, name, tasks, and metadata
 */
function createListObject(name) {
    return {
        id: generateId(),
        name: name.trim(),
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Creates a new task object
 * @param {string} text - Task description text
 * @returns {Object} Task object with id, text, and completed status
 */
function createTaskObject(text) {
    return {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggles between light and dark theme
 */
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    console.log(`Theme switched to: ${currentTheme}`);
}

/**
 * Initializes the theme based on stored preference
 */
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    console.log(`Theme initialized to: ${currentTheme}`);
}

// ===== DRAG AND DROP FUNCTIONS =====

/**
 * Handles the start of dragging a task
 * @param {Event} event - Drag start event
 * @param {HTMLElement} taskElement - The task element being dragged
 */
function handleDragStart(event, taskElement) {
    draggedElement = taskElement;
    draggedIndex = Array.from(taskList.children).indexOf(taskElement);
    taskElement.classList.add('dragging');
    
    // Set a clean drag image without rotation or weird effects
    const dragImage = taskElement.cloneNode(true);
    dragImage.style.opacity = '0.9';
    dragImage.style.transform = 'none';
    dragImage.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
    dragImage.style.borderRadius = 'var(--radius-lg)';
    dragImage.style.width = taskElement.offsetWidth + 'px';
    dragImage.style.height = taskElement.offsetHeight + 'px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.zIndex = '-1';
    dragImage.style.pointerEvents = 'none';
    
    // Remove any existing drag classes from the clone
    dragImage.classList.remove('dragging', 'drag-over');
    
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
    
    // Remove the temporary element after a short delay
    setTimeout(() => {
        if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
        }
    }, 0);
    
    console.log(`Started dragging task at index: ${draggedIndex}`);
}

/**
 * Handles dragging over a task
 * @param {Event} event - Drag over event
 * @param {HTMLElement} taskElement - The task element being dragged over
 */
function handleDragOver(event, taskElement) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Remove drag-over class from all tasks
    taskList.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    // Add drag-over class to current task
    taskElement.classList.add('drag-over');
}

/**
 * Handles leaving a task during drag
 * @param {Event} event - Drag leave event
 * @param {HTMLElement} taskElement - The task element being left
 */
function handleDragLeave(event, taskElement) {
    taskElement.classList.remove('drag-over');
}

/**
 * Handles dropping a task
 * @param {Event} event - Drop event
 * @param {HTMLElement} taskElement - The task element being dropped on
 */
function handleDrop(event, taskElement) {
    event.preventDefault();
    
    if (!draggedElement || draggedElement === taskElement) {
        return;
    }
    
    const dropIndex = Array.from(taskList.children).indexOf(taskElement);
    
    // Remove drag classes
    draggedElement.classList.remove('dragging');
    taskElement.classList.remove('drag-over');
    
    // Reorder tasks in the DOM
    if (draggedIndex < dropIndex) {
        taskElement.parentNode.insertBefore(draggedElement, taskElement.nextSibling);
    } else {
        taskElement.parentNode.insertBefore(draggedElement, taskElement);
    }
    
    // Update the tasks array
    reorderTasks(draggedIndex, dropIndex);
    
    console.log(`Moved task from index ${draggedIndex} to ${dropIndex}`);
    
    // Reset drag state
    draggedElement = null;
    draggedIndex = -1;
}

/**
 * Handles the end of dragging
 * @param {Event} event - Drag end event
 */
function handleDragEnd(event) {
    // Remove drag classes from all tasks
    taskList.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
    });
    
    // Reset drag state
    draggedElement = null;
    draggedIndex = -1;
}

/**
 * Reorders tasks in the data structure
 * @param {number} fromIndex - Original index
 * @param {number} toIndex - New index
 */
function reorderTasks(fromIndex, toIndex) {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    // Get the task to move
    const taskToMove = list.tasks[fromIndex];
    if (!taskToMove) return;
    
    // Remove from original position
    list.tasks.splice(fromIndex, 1);
    
    // Insert at new position
    list.tasks.splice(toIndex, 0, taskToMove);
    
    // Update metadata and save
    updateListMetadata(currentListId);
    saveListsToStorage(lists);
    
    console.log(`Tasks reordered in data structure`);
}

/**
 * Handles keyboard events for task reordering
 * @param {Event} event - Keyboard event
 * @param {HTMLElement} taskElement - The task element
 */
function handleTaskKeyboard(event, taskElement) {
    const currentIndex = Array.from(taskList.children).indexOf(taskElement);
    const totalTasks = taskList.children.length;
    
    switch (event.key) {
        case 'ArrowUp':
            if (currentIndex > 0) {
                event.preventDefault();
                const newIndex = currentIndex - 1;
                moveTask(currentIndex, newIndex);
            }
            break;
        case 'ArrowDown':
            if (currentIndex < totalTasks - 1) {
                event.preventDefault();
                const newIndex = currentIndex + 1;
                moveTask(currentIndex, newIndex);
            }
            break;
    }
}

/**
 * Moves a task to a new position
 * @param {number} fromIndex - Original index
 * @param {number} toIndex - New index
 */
function moveTask(fromIndex, toIndex) {
    const taskElements = Array.from(taskList.children);
    const taskToMove = taskElements[fromIndex];
    
    if (fromIndex < toIndex) {
        taskList.insertBefore(taskToMove, taskElements[toIndex].nextSibling);
    } else {
        taskList.insertBefore(taskToMove, taskElements[toIndex]);
    }
    
    reorderTasks(fromIndex, toIndex);
    
    // Focus the moved task
    taskToMove.focus();
    
    console.log(`Task moved from index ${fromIndex} to ${toIndex} via keyboard`);
}

// ===== VIEW MANAGEMENT =====

/**
 * Shows the dashboard view
 */
function showDashboard() {
    dashboardView.classList.add('active');
    listView.classList.remove('active');
    currentListId = null;
    console.log('Switched to dashboard view');
}

/**
 * Shows the list view for a specific list
 * @param {string} listId - ID of the list to display
 */
function showListView(listId) {
    const list = lists.find(l => l.id === listId);
    if (!list) {
        console.error('List not found:', listId);
        return;
    }
    
    currentListId = listId;
    currentListName.textContent = list.name;
    
    dashboardView.classList.remove('active');
    listView.classList.add('active');
    
    renderTasks(list.tasks);
    console.log(`Switched to list view: ${list.name}`);
}

// ===== DOM MANIPULATION FUNCTIONS =====

/**
 * Creates the HTML structure for a list card
 * @param {Object} list - List object containing id, name, and tasks
 * @returns {HTMLElement} Complete list card element
 */
function createListCard(list) {
    const card = document.createElement('div');
    card.className = 'list-card';
    card.dataset.listId = list.id;
    
    const completedTasks = list.tasks.filter(task => task.completed).length;
    const totalTasks = list.tasks.length;
    
    card.innerHTML = `
        <h3>${escapeHtml(list.name)}</h3>
        <div class="task-count">${completedTasks} of ${totalTasks} tasks completed</div>
        <div class="list-actions">
            <button class="edit-list-btn" data-list-id="${list.id}">Edit Name</button>
            <button class="delete-list-btn" data-list-id="${list.id}">Delete List</button>
        </div>
    `;
    
    return card;
}

/**
 * Creates the HTML structure for a single task item
 * @param {Object} task - Task object containing id, text, and completed status
 * @returns {HTMLElement} Complete task list item element
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;
    
    if (task.completed) {
        li.classList.add('completed');
    }
    
    // Add drag and drop attributes
    li.draggable = true;
    li.setAttribute('draggable', 'true');
    li.tabIndex = 0; // Make focusable for keyboard navigation
    
    li.innerHTML = `
        <div class="task-content">
            <div class="drag-handle" aria-label="Drag to reorder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="8" r="2"/>
                    <circle cx="16" cy="8" r="2"/>
                    <circle cx="8" cy="16" r="2"/>
                    <circle cx="16" cy="16" r="2"/>
                </svg>
            </div>
            <input type="checkbox" 
                   class="task-checkbox" 
                   ${task.completed ? 'checked' : ''} 
                   aria-label="Mark task as complete">
            <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <button class="delete-btn" aria-label="Delete task">
            <span class="delete-icon">×</span>
        </button>
    `;
    
    // Add drag and drop event listeners
    li.addEventListener('dragstart', (e) => handleDragStart(e, li));
    li.addEventListener('dragover', (e) => handleDragOver(e, li));
    li.addEventListener('dragleave', (e) => handleDragLeave(e, li));
    li.addEventListener('drop', (e) => handleDrop(e, li));
    li.addEventListener('dragend', handleDragEnd);
    
    // Add keyboard support for accessibility
    li.addEventListener('keydown', (e) => handleTaskKeyboard(e, li));
    
    return li;
}

/**
 * Renders all lists to the dashboard
 * @param {Array} listsArray - Array of list objects to render
 */
function renderLists(listsArray) {
    if (!listsContainer) {
        console.error('listsContainer element not found');
        return;
    }
    
    listsContainer.innerHTML = '';
    
    if (listsArray.length === 0) {
        listsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d; grid-column: 1 / -1;">No lists created yet. Create your first list above!</p>';
        return;
    }
    
    listsArray.forEach(list => {
        const listCard = createListCard(list);
        listsContainer.appendChild(listCard);
    });
    
    console.log(`Rendered ${listsArray.length} lists`);
}

/**
 * Renders all tasks for the current list
 * @param {Array} tasksArray - Array of task objects to render
 */
function renderTasks(tasksArray) {
    if (!taskList) {
        console.error('taskList element not found');
        return;
    }
    
    taskList.innerHTML = '';
    
    if (tasksArray.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No tasks yet. Add your first task above!</p>';
        return;
    }
    
    tasksArray.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
    
    console.log(`Rendered ${tasksArray.length} tasks`);
}

// ===== LIST MANAGEMENT FUNCTIONS =====

/**
 * Adds a new list
 * @param {string} listName - Name of the new list
 */
function addList(listName) {
    console.log('addList called with:', listName);
    
    if (!listName || listName.trim().length === 0) {
        console.warn('Attempted to create list with empty name');
        return;
    }
    
    // Check for duplicate names
    const existingList = lists.find(list => list.name.toLowerCase() === listName.trim().toLowerCase());
    if (existingList) {
        alert('A list with this name already exists!');
        return;
    }
    
    const newList = createListObject(listName);
    lists.push(newList);
    
    saveListsToStorage(lists);
    renderLists(lists);
    
    // Clear input and focus
    if (newListNameInput) {
        newListNameInput.value = '';
        newListNameInput.focus();
    }
    
    console.log('List created successfully:', newList);
}

/**
 * Edits a list name
 * @param {string} listId - ID of the list to edit
 * @param {string} newName - New name for the list
 */
function editListName(listId, newName) {
    const list = lists.find(l => l.id === listId);
    if (!list) {
        console.error('List not found for editing:', listId);
        return;
    }
    
    if (!newName || newName.trim().length === 0) {
        alert('List name cannot be empty!');
        return;
    }
    
    // Check for duplicate names (excluding the current list)
    const existingList = lists.find(l => l.id !== listId && l.name.toLowerCase() === newName.trim().toLowerCase());
    if (existingList) {
        alert('A list with this name already exists!');
        return;
    }
    
    list.name = newName.trim();
    list.updatedAt = new Date().toISOString();
    
    saveListsToStorage(lists);
    renderLists(lists);
    
    // Update current list name if we're viewing this list
    if (currentListId === listId) {
        currentListName.textContent = list.name;
    }
    
    console.log(`List ${listId} name updated to: ${list.name}`);
}

/**
 * Deletes a list
 * @param {string} listId - ID of the list to delete
 */
function deleteList(listId) {
    lists = lists.filter(list => list.id !== listId);
    saveListsToStorage(lists);
    renderLists(lists);
    
    // If we're currently viewing the deleted list, go back to dashboard
    if (currentListId === listId) {
        showDashboard();
    }
    
    console.log(`List ${listId} deleted successfully`);
}

/**
 * Updates list metadata
 * @param {string} listId - ID of the list to update
 */
function updateListMetadata(listId) {
    const list = lists.find(l => l.id === listId);
    if (list) {
        list.updatedAt = new Date().toISOString();
        saveListsToStorage(lists);
    }
}

// ===== TASK MANAGEMENT FUNCTIONS =====

/**
 * Adds a new task to the current list
 * @param {string} taskText - Text content of the task
 */
function addTask(taskText) {
    if (!currentListId) {
        console.error('No current list selected');
        return;
    }
    
    if (!taskText || taskText.trim().length === 0) {
        console.warn('Attempted to add empty task');
        return;
    }
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) {
        console.error('Current list not found');
        return;
    }
    
    const newTask = createTaskObject(taskText);
    list.tasks.push(newTask);
    
    updateListMetadata(currentListId);
    saveListsToStorage(lists);
    
    // Render the new task
    const taskElement = createTaskElement(newTask);
    taskList.appendChild(taskElement);
    
    // Update dashboard if we're on list view
    renderLists(lists);
    
    console.log('Task added successfully:', newTask);
}

/**
 * Toggles the completion status of a task
 * @param {string} taskId - ID of the task to toggle
 */
function toggleTaskCompletion(taskId) {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    const task = list.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        updateListMetadata(currentListId);
        saveListsToStorage(lists);
        
        // Update visual state
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            if (task.completed) {
                taskElement.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
            }
        }
        
        // Update dashboard
        renderLists(lists);
        
        console.log(`Task ${taskId} completion toggled to: ${task.completed}`);
    }
}

/**
 * Deletes a task from the current list
 * @param {string} taskId - ID of the task to delete
 */
function deleteTask(taskId) {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    list.tasks = list.tasks.filter(task => task.id !== taskId);
    updateListMetadata(currentListId);
    saveListsToStorage(lists);
    
    // Remove from DOM
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }
    
    // Update dashboard
    renderLists(lists);
    
    console.log(`Task ${taskId} deleted successfully`);
}

// ===== MODAL MANAGEMENT =====

/**
 * Shows confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} onConfirm - Function to call on confirmation
 */
function showConfirmModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmModal.classList.add('active');
    
    // Set up one-time event listeners
    const handleConfirm = () => {
        confirmModal.classList.remove('active');
        onConfirm();
        confirmYesBtn.removeEventListener('click', handleConfirm);
        confirmNoBtn.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        confirmModal.classList.remove('active');
        confirmYesBtn.removeEventListener('click', handleConfirm);
        confirmNoBtn.removeEventListener('click', handleCancel);
    };
    
    confirmYesBtn.addEventListener('click', handleConfirm);
    confirmNoBtn.addEventListener('click', handleCancel);
}

/**
 * Shows edit list name modal
 * @param {string} listId - ID of the list to edit
 * @param {string} currentName - Current name of the list
 */
function showEditListModal(listId, currentName) {
    modalTitle.textContent = 'Edit List Name';
    modalMessage.innerHTML = `
        <input type="text" id="editListNameInput" value="${escapeHtml(currentName)}" 
               placeholder="Enter new list name..." maxlength="50" style="width: 100%; padding: 8px; margin: 10px 0;">
    `;
    confirmModal.classList.add('active');
    
    // Focus on input
    setTimeout(() => {
        const editInput = document.getElementById('editListNameInput');
        if (editInput) {
            editInput.focus();
            editInput.select();
        }
    }, 100);
    
    // Set up one-time event listeners
    const handleConfirm = () => {
        const editInput = document.getElementById('editListNameInput');
        const newName = editInput ? editInput.value.trim() : '';
        confirmModal.classList.remove('active');
        editListName(listId, newName);
        confirmYesBtn.removeEventListener('click', handleConfirm);
        confirmNoBtn.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        confirmModal.classList.remove('active');
        confirmYesBtn.removeEventListener('click', handleConfirm);
        confirmNoBtn.removeEventListener('click', handleCancel);
    };
    
    // Handle Enter key in input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };
    
    confirmYesBtn.addEventListener('click', handleConfirm);
    confirmNoBtn.addEventListener('click', handleCancel);
    
    // Add keypress listener to input
    setTimeout(() => {
        const editInput = document.getElementById('editListNameInput');
        if (editInput) {
            editInput.addEventListener('keypress', handleKeyPress);
        }
    }, 100);
}

// ===== EVENT HANDLERS =====

/**
 * Handles list creation form submission
 * @param {Event} event - Form submission event
 */
function handleCreateList(event) {
    console.log('handleCreateList called');
    event.preventDefault();
    
    if (!newListNameInput) {
        console.error('newListNameInput element not found');
        return;
    }
    
    const listName = newListNameInput.value.trim();
    console.log('List name from input:', listName);
    addList(listName);
}

/**
 * Handles clicks on list cards and buttons
 * @param {Event} event - Click event
 */
function handleListClick(event) {
    const target = event.target;
    
    // Handle list card clicks (navigate to list)
    if (target.closest('.list-card') && !target.closest('.list-actions')) {
        const listId = target.closest('.list-card').dataset.listId;
        showListView(listId);
    }
    
    // Handle edit list button clicks
    if (target.classList.contains('edit-list-btn')) {
        const listId = target.dataset.listId;
        const list = lists.find(l => l.id === listId);
        if (list) {
            showEditListModal(listId, list.name);
        }
    }
    
    // Handle delete list button clicks
    if (target.classList.contains('delete-list-btn')) {
        const listId = target.dataset.listId;
        const list = lists.find(l => l.id === listId);
        
        showConfirmModal(
            'Delete List',
            `Are you sure you want to delete "${list.name}" and all its tasks? This action cannot be undone.`,
            () => deleteList(listId)
        );
    }
}

/**
 * Handles task form submission
 * @param {Event} event - Form submission event
 */
function handleAddTask(event) {
    event.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText) {
        addTask(taskText);
        taskInput.value = '';
        taskInput.focus();
    }
}

/**
 * Handles clicks on task items using event delegation
 * @param {Event} event - Click event
 */
function handleTaskClick(event) {
    const target = event.target;
    
    // Handle checkbox clicks
    if (target.classList.contains('task-checkbox')) {
        const taskId = target.closest('.task-item').dataset.taskId;
        toggleTaskCompletion(taskId);
    }
    
    // Handle delete button clicks
    if (target.classList.contains('delete-btn') || target.classList.contains('delete-icon')) {
        const taskId = target.closest('.task-item').dataset.taskId;
        deleteTask(taskId);
    }
}

/**
 * Handles keyboard events for accessibility
 * @param {Event} event - Keyboard event
 */
function handleKeyboardEvents(event) {
    // Allow Enter key to submit forms
    if (event.key === 'Enter') {
        if (event.target === newListNameInput) {
            handleCreateList(event);
        } else if (event.target === taskInput) {
            handleAddTask(event);
        }
    }
    
    // Allow Space key to toggle checkboxes
    if (event.key === ' ' && event.target.classList.contains('task-checkbox')) {
        event.preventDefault();
        event.target.click();
    }
}

/**
 * Handles edit list name button click in list view
 */
function handleEditCurrentListName() {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    showEditListModal(currentListId, list.name);
}

/**
 * Handles delete list button click in list view
 */
function handleDeleteCurrentList() {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    showConfirmModal(
        'Delete List',
        `Are you sure you want to delete "${list.name}" and all its tasks? This action cannot be undone.`,
        () => {
            deleteList(currentListId);
            showDashboard();
        }
    );
}

// ===== INITIALIZATION =====

/**
 * Initializes the application
 */
function initializeApp() {
    console.log('Initializing Multi-List To-Do Application...');
    
    // Initialize theme
    initializeTheme();
    
    // Load existing lists from localStorage
    lists = loadListsFromStorage();
    console.log(`Loaded ${lists.length} lists from localStorage`);
    
    // Render existing lists
    renderLists(lists);
    
    // Set up event listeners
    setupEventListeners();
    
    // Focus on input for immediate usability
    if (newListNameInput) {
        newListNameInput.focus();
    }
    
    console.log('Application initialized successfully');
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Theme toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
        console.log('Theme toggle button event listener added');
    } else {
        console.error('themeToggleBtn element not found');
    }
    
    // Dashboard events
    if (createListBtn) {
        console.log('Adding click listener to createListBtn');
        createListBtn.addEventListener('click', handleCreateList);
    } else {
        console.error('createListBtn element not found');
    }
    
    if (newListNameInput) {
        newListNameInput.addEventListener('keypress', handleKeyboardEvents);
    }
    
    if (listsContainer) {
        listsContainer.addEventListener('click', handleListClick);
    }
    
    // List view events
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', showDashboard);
    }
    
    if (editListNameBtn) {
        editListNameBtn.addEventListener('click', handleEditCurrentListName);
    }
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', handleAddTask);
    }
    
    if (taskInput) {
        taskInput.addEventListener('keypress', handleKeyboardEvents);
    }
    
    if (taskList) {
        taskList.addEventListener('click', handleTaskClick);
    }
    
    if (deleteListBtn) {
        deleteListBtn.addEventListener('click', handleDeleteCurrentList);
    }
    
    // Modal events
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('active');
            }
        });
    }
    
    // Prevent form submissions
    document.addEventListener('submit', (e) => e.preventDefault());
    
    console.log('Event listeners set up successfully');
}

// ===== APPLICATION STARTUP =====

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes to refresh data if needed
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        const currentLists = loadListsFromStorage();
        if (JSON.stringify(currentLists) !== JSON.stringify(lists)) {
            lists = currentLists;
            renderLists(lists);
            
            // Update current list view if we're on one
            if (currentListId) {
                const currentList = lists.find(l => l.id === currentListId);
                if (currentList) {
                    renderTasks(currentList.tasks);
                } else {
                    showDashboard(); // List was deleted
                }
            }
            
            console.log('Lists refreshed from localStorage');
        }
    }
});
