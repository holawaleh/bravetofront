// API Configuration
const API_BASE_URL = 'https://bravetosmart.onrender.com/api';

// Global state
let students = [];
let currentUID = null;
let isLoadingUID = false;
let uidPollingInterval = null;

// DOM Elements
const studentsTab = document.getElementById('students-tab');
const studentsList = document.getElementById('students-list');
const noStudentsDiv = document.getElementById('no-students');
const addStudentModal = document.getElementById('add-student-modal');
const studentDetailsModal = document.getElementById('student-details-modal');
const addStudentBtn = document.getElementById('add-student-btn');
const closeModalBtn = document.getElementById('close-modal');
const studentForm = document.getElementById('student-form');
const searchInput = document.getElementById('search-input');
const studentCountSpan = document.getElementById('student-count');
const currentUIDElement = document.getElementById('current-uid');
const refreshUIDBtn = document.getElementById('refresh-uid-btn');
const submitBtn = document.getElementById('submit-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    await loadStudents();
    setupTabNavigation();
}

// Setup event listeners
function setupEventListeners() {
    // Add student button
    addStudentBtn.addEventListener('click', openAddStudentModal);
    
    // Close modal button
    closeModalBtn.addEventListener('click', closeAddStudentModal);
    
    // Close modal on backdrop click
    addStudentModal.addEventListener('click', (e) => {
        if (e.target === addStudentModal) {
            closeAddStudentModal();
        }
    });
    
    studentDetailsModal.addEventListener('click', (e) => {
        if (e.target === studentDetailsModal) {
            closeStudentDetailsModal();
        }
    });
    
    // Student form submission
    studentForm.addEventListener('submit', handleStudentRegistration);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Refresh UID button
    refreshUIDBtn.addEventListener('click', refreshUID);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddStudentModal();
            closeStudentDetailsModal();
        }
    });
}

// Setup tab navigation
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// API Functions
async function fetchStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.students || data || [];
    } catch (error) {
        console.error('Error fetching students:', error);
        showToast('Error fetching students', 'Failed to load student data', 'error');
        return [];
    }
}

async function fetchLatestUID() {
    try {
        const response = await fetch(`${API_BASE_URL}/students/get-latest-uid`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.uid || null;
    } catch (error) {
        console.error('Error fetching latest UID:', error);
        return null;
    }
}

async function registerStudent(studentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/students/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error registering student:', error);
        throw error;
    }
}

async function fetchStudentByUID(uid) {
    try {
        const response = await fetch(`${API_BASE_URL}/students/uid/${uid}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching student by UID:', error);
        throw error;
    }
}

// Load and display students
async function loadStudents() {
    try {
        students = await fetchStudents();
        displayStudents(students);
        updateStudentCount(students.length);
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Loading Error', 'Failed to load students', 'error');
    }
}

// Display students in the grid
function displayStudents(studentsToShow) {
    if (!studentsToShow || studentsToShow.length === 0) {
        studentsList.innerHTML = '';
        noStudentsDiv.style.display = 'block';
        return;
    }
    
    noStudentsDiv.style.display = 'none';
    studentsList.innerHTML = studentsToShow.map(student => createStudentCard(student)).join('');
    
    // Add click event listeners to student cards
    const studentCards = document.querySelectorAll('.student-card');
    studentCards.forEach((card, index) => {
        card.addEventListener('click', () => showStudentDetails(studentsToShow[index]));
    });
}

// Create a student card HTML
function createStudentCard(student) {
    return `
        <div class="student-card">
            <div class="student-info">
                <div class="student-name">${escapeHtml(student.name)}</div>
                <div class="student-matric">${escapeHtml(student.matricNo)}</div>
            </div>
            <div class="student-details">
                <div class="student-detail">
                    <div class="detail-label">Level</div>
                    <div class="detail-value">${escapeHtml(student.level)} Level</div>
                </div>
                <div class="student-detail">
                    <div class="detail-label">Department</div>
                    <div class="detail-value">${escapeHtml(student.department)}</div>
                </div>
                <div class="student-detail">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${escapeHtml(student.email)}</div>
                </div>
                <div class="student-detail">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${escapeHtml(student.phone)}</div>
                </div>
            </div>
            <div class="student-uid">${escapeHtml(student.uid || 'No UID')}</div>
        </div>
    `;
}

// Update student count
function updateStudentCount(count) {
    studentCountSpan.textContent = count;
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayStudents(students);
        return;
    }
    
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.matricNo.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.department.toLowerCase().includes(searchTerm) ||
        (student.uid && student.uid.toLowerCase().includes(searchTerm))
    );
    
    displayStudents(filteredStudents);
}

// Modal functions
function openAddStudentModal() {
    addStudentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset form
    studentForm.reset();
    currentUID = null;
    updateUIDDisplay();
    
    // Start polling for UID
    startUIDPolling();
}

function closeAddStudentModal() {
    addStudentModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Stop polling for UID
    stopUIDPolling();
    
    // Reset form state
    resetFormState();
}

function showStudentDetails(student) {
    const detailsContent = document.getElementById('student-details-content');
    detailsContent.innerHTML = `
        <div class="student-details-grid">
            <div class="detail-group">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${escapeHtml(student.name)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Matric Number</div>
                <div class="detail-value">${escapeHtml(student.matricNo)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Email Address</div>
                <div class="detail-value">${escapeHtml(student.email)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Phone Number</div>
                <div class="detail-value">${escapeHtml(student.phone)}</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Level</div>
                <div class="detail-value">${escapeHtml(student.level)} Level</div>
            </div>
            <div class="detail-group">
                <div class="detail-label">Department</div>
                <div class="detail-value">${escapeHtml(student.department)}</div>
            </div>
            <div class="detail-group uid-display">
                <div class="detail-label">RFID UID</div>
                <div class="detail-value">${escapeHtml(student.uid || 'No UID assigned')}</div>
            </div>
        </div>
    `;
    
    studentDetailsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStudentDetailsModal() {
    studentDetailsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// UID Management
function startUIDPolling() {
    if (uidPollingInterval) {
        clearInterval(uidPollingInterval);
    }
    
    // Poll immediately
    pollForUID();
    
    // Then poll every 2 seconds
    uidPollingInterval = setInterval(pollForUID, 2000);
}

function stopUIDPolling() {
    if (uidPollingInterval) {
        clearInterval(uidPollingInterval);
        uidPollingInterval = null;
    }
}

async function pollForUID() {
    if (isLoadingUID) return;
    
    try {
        const uid = await fetchLatestUID();
        if (uid && uid !== currentUID) {
            currentUID = uid;
            updateUIDDisplay();
            showToast('UID Captured', `New RFID UID detected: ${uid}`, 'success');
        }
    } catch (error) {
        console.error('Error polling for UID:', error);
    }
}

async function refreshUID() {
    if (isLoadingUID) return;
    
    isLoadingUID = true;
    updateUIDDisplay();
    refreshUIDBtn.disabled = true;
    
    try {
        const uid = await fetchLatestUID();
        currentUID = uid;
        updateUIDDisplay();
        
        if (uid) {
            showToast('UID Refreshed', `Current UID: ${uid}`, 'success');
        } else {
            showToast('No UID Found', 'No RFID UID available', 'warning');
        }
    } catch (error) {
        console.error('Error refreshing UID:', error);
        showToast('Refresh Failed', 'Failed to refresh UID', 'error');
    } finally {
        isLoadingUID = false;
        refreshUIDBtn.disabled = false;
        updateUIDDisplay();
    }
}

function updateUIDDisplay() {
    const uidText = currentUIDElement.querySelector('.uid-text');
    const uidLoading = currentUIDElement.querySelector('.uid-loading');
    
    if (isLoadingUID) {
        uidLoading.classList.add('active');
        uidText.textContent = 'Refreshing...';
    } else {
        uidLoading.classList.remove('active');
        if (currentUID) {
            uidText.textContent = currentUID;
            uidText.style.color = 'var(--success-color)';
        } else {
            uidText.textContent = 'Waiting for RFID scan...';
            uidText.style.color = 'var(--text-muted)';
        }
    }
}

// Form handling
async function handleStudentRegistration(e) {
    e.preventDefault();
    
    if (!currentUID) {
        showToast('UID Required', 'Please wait for RFID UID to be captured', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(studentForm);
    const studentData = {
        name: formData.get('name').trim(),
        matricNo: formData.get('matricNo').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        level: formData.get('level'),
        department: formData.get('department').trim(),
    };
    
    // Validate form data
    if (!validateStudentData(studentData)) {
        return;
    }
    
    // Show loading state
    setSubmitButtonLoading(true);
    
    try {
        // Register student
        const result = await registerStudent(studentData);
        
        // Show success message
        showToast('Student Registered', `${studentData.name} has been successfully registered`, 'success');
        
        // Reload students list
        await loadStudents();
        
        // Close modal
        closeAddStudentModal();
        
    } catch (error) {
        console.error('Error registering student:', error);
        showToast('Registration Failed', error.message || 'Failed to register student', 'error');
    } finally {
        setSubmitButtonLoading(false);
    }
}

function validateStudentData(data) {
    const requiredFields = ['name', 'matricNo', 'email', 'phone', 'level', 'department'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showToast('Validation Error', `${field.charAt(0).toUpperCase() + field.slice(1)} is required`, 'error');
            return false;
        }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showToast('Validation Error', 'Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

function setSubmitButtonLoading(loading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.classList.add('active');
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoading.classList.remove('active');
        submitBtn.disabled = false;
    }
}

function resetFormState() {
    setSubmitButtonLoading(false);
    currentUID = null;
    updateUIDDisplay();
}

// Toast notifications
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
    
    // Remove on click
    toast.addEventListener('click', () => {
        toast.remove();
    });
}

function getToastIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle';
        case 'error':
            return 'fas fa-exclamation-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        default:
            return 'fas fa-info-circle';
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for modal management
window.openAddStudentModal = openAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.closeStudentDetailsModal = closeStudentDetailsModal;