class StudentUIDManager {
    constructor() {
        this.currentUID = null;
        this.init();
    }

    init() {
        this.captureUIDFromURL();
        this.setupEventListeners();
        this.initializeStudentSystem();
    }

    captureUIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const uid = urlParams.get('uid') || urlParams.get('id') || urlParams.get('user_id');

        if (uid) {
            this.currentUID = uid;
            sessionStorage.setItem('capturedUID', uid);
            this.displayCapturedUID();
        } else {
            this.currentUID = sessionStorage.getItem('capturedUID');
            // If no UID is found on page load, the system will now explicitly wait for one for new registrations.
        }
    }

    displayCapturedUID() {
        if (this.currentUID) {
            let uidDisplay = document.getElementById('captured-uid-display');
            if (!uidDisplay) {
                uidDisplay = document.createElement('div');
                uidDisplay.id = 'captured-uid-display';
                uidDisplay.style.cssText = `
                    background: #e8f5e8;
                    border: 1px solid #27ae60;
                    color: #27ae60;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                    font-weight: 500;
                `;
                const heading = document.querySelector('.content h2');
                if (heading) {
                    heading.insertAdjacentElement('afterend', uidDisplay);
                }
            }
            uidDisplay.innerHTML = `
                <strong>Captured UID:</strong> ${this.currentUID}
                <button onclick="studentUIDManager.clearUID()" style="
                    background: transparent;
                    border: none;
                    color: #27ae60;
                    cursor: pointer;
                    margin-left: 10px;
                    text-decoration: underline;
                ">Clear</button>
            `;
        }
    }

    clearUID() {
        this.currentUID = null;
        sessionStorage.removeItem('capturedUID');
        const uidDisplay = document.getElementById('captured-uid-display');
        if (uidDisplay) {
            uidDisplay.remove();
        }
        console.log('UID cleared');
    }

    setupEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('add-btn')) {
                this.openModal();
                const form = document.getElementById('studentForm');
                if (!form.dataset.editingId) {
                    // For new registrations, activate the waiting state for UID
                    this.promptForUIDScan();
                } else {
                    // Handle case where user clicks 'Add Student' after editing, reset state
                    delete form.dataset.editingId;
                    const modalTitle = document.querySelector('.modal-content h3');
                    const submitBtn = document.querySelector('.modal-actions button[type="submit"]');
                    if (modalTitle) modalTitle.textContent = 'Register New Student';
                    if (submitBtn) submitBtn.textContent = 'Submit';
                    this.promptForUIDScan();
                }
            }

            if (e.target.id === 'closeModal') {
                this.closeModal();
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'studentForm') {
                e.preventDefault();
                this.handleStudentFormSubmit(e);
            }
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('studentModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Event listener for global key presses to simulate UID scan
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('studentModal');
            const uidInput = document.getElementById('uid');
            // Check if the modal is open, and if we are not in editing mode, and the UID input is ready for scan
            if (modal && modal.style.display === 'flex' && !document.getElementById('studentForm').dataset.editingId && uidInput && uidInput.readOnly && uidInput.value === 'Scan UID Code...') {
                // Simulate UID scanning by typing. In a real scenario, this would be from a scanner.
                // For demonstration, let's assume 'Enter' finalizes the scan.
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    // Simulate fetching the UID after "scanning"
                    this.fetchLatestUIDAndPopulateForm();
                }
            }
        });
    }

    openModal() {
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.style.display = 'flex';
            const form = document.getElementById('studentForm');
            if (form) {
                if (!form.dataset.editingId) {
                    form.reset();
                    const uidInput = document.getElementById('uid');
                    if (uidInput) {
                        uidInput.value = '';
                        uidInput.readOnly = true; // Always readonly for new entries
                        uidInput.style.backgroundColor = '';
                        uidInput.style.border = '';
                        uidInput.title = '';
                    }
                    const modalTitle = document.querySelector('.modal-content h3');
                    const submitBtn = document.querySelector('.modal-actions button[type="submit"]');
                    if (modalTitle) modalTitle.textContent = 'Register New Student';
                    if (submitBtn) submitBtn.textContent = 'Submit';
                    // The promptForUIDScan() will be called from the click event listener.
                }
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('studentForm');
            if (form) {
                delete form.dataset.editingId;
                form.reset();
            }
            const modalTitle = document.querySelector('.modal-content h3');
            const submitBtn = document.querySelector('.modal-actions button[type="submit"]');
            if (modalTitle) modalTitle.textContent = 'Register New Student';
            if (submitBtn) submitBtn.textContent = 'Submit';
            this.toggleFormFields(true); // Re-enable other fields on close
            document.getElementById('uid').value = ''; // Clear UID
        }
    }

    // New method to prompt for UID scan and disable other fields
    promptForUIDScan() {
        const uidInput = document.getElementById('uid');
        if (uidInput) {
            uidInput.value = 'Scan UID Code...';
            uidInput.style.backgroundColor = '#fff3cd'; // Light yellow for a prompt
            uidInput.style.border = '1px dashed #d6a100'; // Dashed border for prompt
            uidInput.title = 'Waiting for UID scan';
            uidInput.readOnly = true; // Keep it read-only
            this.toggleFormFields(false); // Disable other form fields
            this.showNotification('Please scan the UID code to proceed.', 'info');
        }
    }

    // Helper to toggle other form fields
    toggleFormFields(enable) {
        const form = document.getElementById('studentForm');
        if (!form) return;

        const fields = form.querySelectorAll('input:not(#uid), select, textarea, button[type="submit"]');
        fields.forEach(field => {
            if (field.type === 'submit') {
                field.disabled = !enable;
                field.style.opacity = enable ? '1' : '0.5';
                field.style.cursor = enable ? 'pointer' : 'not-allowed';
            } else {
                field.readOnly = !enable;
                field.style.backgroundColor = enable ? '' : '#f0f0f0';
                field.style.cursor = enable ? 'text' : 'not-allowed';
            }
        });
    }

    async fetchLatestUID() {
        try {
            const response = await fetch('https://bravetosmart.onrender.com/api/students/get-latest-uid');
            if (response.ok) {
                const data = await response.json();
                return data.latestUid || data; // Adjust based on your API's actual response format
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to fetch latest UID from API: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error fetching latest UID:', error);
            this.showNotification('Could not fetch UID. Network error or server issue.', 'error');
            return null;
        }
    }

    async fetchLatestUIDAndPopulateForm() {
        const uidInput = document.getElementById('uid');
        if (uidInput) {
            uidInput.value = 'Fetching UID...';
            uidInput.style.backgroundColor = '#e8f5e8';
            uidInput.style.border = '2px solid #27ae60';
            uidInput.title = 'Fetching UID from server';

            const latestUid = await this.fetchLatestUID();
            if (latestUid) {
                uidInput.value = latestUid;
                this.currentUID = latestUid;
                uidInput.style.backgroundColor = '#e8f5e8';
                uidInput.style.border = '2px solid #27ae60';
                uidInput.title = 'UID captured';
                this.toggleFormFields(true); // Enable other fields once UID is provided
                this.showNotification('UID captured successfully!', 'success');
            } else {
                uidInput.value = 'Error fetching UID.';
                uidInput.style.backgroundColor = '#f8d7da'; // Light red for error
                uidInput.style.border = '1px solid #dc3545';
                uidInput.title = 'Failed to get UID, try again.';
                this.toggleFormFields(false); // Keep other fields disabled
                this.showNotification('Failed to get UID. Please try again or check server.', 'error');
            }
        }
    }

    handleStudentFormSubmit(e) {
        const formData = new FormData(e.target);
        const studentData = {};

        for (let [key, value] of formData.entries()) {
            studentData[key] = value.trim();
        }

        const requiredFields = ['name', 'matricNo', 'email', 'phone', 'department', 'uid'];
        const missingFields = requiredFields.filter(field => !studentData[field]);

        if (missingFields.length > 0) {
            this.showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
            return;
        }

        // Additional check to ensure UID is not the placeholder message
        if (studentData.uid === 'Scan UID Code...' || studentData.uid === 'Fetching UID...' || studentData.uid === 'Error fetching UID.') {
             this.showNotification('Please scan a valid UID before submitting.', 'error');
             return;
        }

        console.log('Student data being submitted:', studentData);

        this.processStudentData(studentData);
        // Modal is closed within processStudentData or after successful API call
    }

    processStudentData(studentData) {
        const form = document.getElementById('studentForm');
        const editingId = form.dataset.editingId;

        if (editingId) {
            this.updateStudent(editingId, studentData);
            delete form.dataset.editingId;
            const modalTitle = document.querySelector('.modal-content h3');
            const submitBtn = document.querySelector('.modal-actions button[type="submit"]');
            if (modalTitle) modalTitle.textContent = 'Register New Student';
            if (submitBtn) submitBtn.textContent = 'Submit';
            this.showNotification('Student updated successfully!');
            this.closeModal(); // Close after update
        } else {
            this.sendToAPI(studentData).then(result => {
                if (result) { // Only store and close if API call was successful
                    this.storeStudentLocally(studentData);
                    this.showNotification('Student added successfully with UID: ' + studentData.uid, 'success');
                    this.closeModal(); // Close after successful add
                }
            });
        }
        this.loadExistingStudents();
    }

    updateStudent(studentId, updatedData) {
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        const studentIndex = students.findIndex(s => (s._id || s.id) === studentId);

        if (studentIndex !== -1) {
            updatedData._id = students[studentIndex]._id || students[studentIndex].id;
            updatedData.id = students[studentIndex].id;
            updatedData.createdAt = students[studentIndex].createdAt;
            updatedData.updatedAt = new Date().toISOString();

            students[studentIndex] = updatedData;
            localStorage.setItem('students', JSON.stringify(students));

            this.updateStudentAPI(studentId, updatedData);
            console.log('Student updated:', updatedData);
        }
    }

    async updateStudentAPI(studentId, updatedData) {
        try {
            const response = await fetch(`https://bravetosmart.onrender.com/api/students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Student updated in API:', result);
                return result;
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to update student in API: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('API Update Error:', error);
            this.showNotification('Student updated locally, but API update failed: ' + error.message, 'warning');
        }
    }

    async sendToAPI(studentData) {
        try {
            const response = await fetch('https://bravetosmart.onrender.com/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Student added to API:', result);
                return result;
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to add student to API: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error adding student to API: ' + error.message, 'error');
            return null; // Return null to indicate failure
        }
    }

    storeStudentLocally(studentData) {
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        studentData.id = studentData.id || Date.now().toString(); // Use a temp ID if API doesn't return one immediately
        studentData.createdAt = new Date().toISOString();
        students.push(studentData);
        localStorage.setItem('students', JSON.stringify(students));
        console.log('Student stored locally:', studentData);
    }

    showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c';
        } else if (type === 'warning' || type === 'info') { // Added 'info' type
            notification.style.backgroundColor = '#f39c12';
        } else {
            notification.style.backgroundColor = '#27ae60';
        }

        document.body.appendChild(notification);

        notification.style.cssText += `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease-in-out;
        `;
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    initializeStudentSystem() {
        this.loadStudentsFromAPI();
        this.setupSearchFunctionality();
    }

    async loadStudentsFromAPI() {
        try {
            const response = await fetch('https://bravetosmart.onrender.com/api/students', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const students = await response.json();
                localStorage.setItem('students', JSON.stringify(students));
                if (students.length > 0) {
                    this.displayStudents(students);
                } else {
                    this.showEmptyState();
                }
                this.updateStudentCount();
            } else {
                throw new Error('Failed to load students from API');
            }
        } catch (error) {
            console.error('API Load Error:', error);
            this.showNotification('Failed to load from server, showing cached data', 'warning');
            this.loadExistingStudents();
        }
    }

    loadExistingStudents() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        if (students.length > 0) {
            this.displayStudents(students);
        } else {
            this.showEmptyState();
        }
        this.updateStudentCount();
    }

    displayStudents(students) {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        let tableContainer = document.querySelector('.students-table');
        if (!tableContainer) {
            tableContainer = document.createElement('div');
            tableContainer.className = 'students-table';
            const topActions = document.querySelector('.top-actions');
            if (topActions) {
                topActions.insertAdjacentElement('afterend', tableContainer);
            }
        }

        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Name</th>
                        <th>Matric No</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Level</th>
                        <th>Phone</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.uid || 'N/A'}</td>
                            <td>${student.name || 'N/A'}</td>
                            <td>${student.matricNo || student.matric || 'N/A'}</td>
                            <td>${student.email || 'N/A'}</td>
                            <td>${student.department || 'N/A'}</td>
                            <td>${student.level || 'N/A'}</td>
                            <td>${student.phone || 'N/A'}</td>
                            <td>${student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="edit-btn" onclick="studentUIDManager.editStudent('${student._id || student.id}')">Edit</button>
                                <button class="delete-btn" onclick="studentUIDManager.deleteStudent('${student._id || student.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
        tableContainer.style.display = 'block';
    }

    updateStudentCount() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const badge = document.querySelector('.nav-links .badge');
        if (badge) {
            badge.textContent = `(${students.length})`;
        }
    }

    setupSearchFunctionality() {
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.searchStudents(e.target.value);
            });
        }
    }

    searchStudents(query) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');

        if (!query.trim()) {
            if (students.length > 0) {
                this.displayStudents(students);
            } else {
                this.showEmptyState();
            }
            return;
        }

        const filteredStudents = students.filter(student =>
            (student.name && student.name.toLowerCase().includes(query.toLowerCase())) ||
            (student.matricNo && student.matricNo.toLowerCase().includes(query.toLowerCase())) ||
            (student.matric && student.matric.toLowerCase().includes(query.toLowerCase())) ||
            (student.email && student.email.toLowerCase().includes(query.toLowerCase())) ||
            (student.department && student.department.toLowerCase().includes(query.toLowerCase())) ||
            (student.uid && student.uid.toLowerCase().includes(query.toLowerCase()))
        );

        if (filteredStudents.length > 0) {
            this.displayStudents(filteredStudents);
        } else {
            this.showNoResultsState(query);
        }
    }

    showEmptyState() {
        const emptyState = document.querySelector('.empty-state');
        const tableContainer = document.querySelector('.students-table');

        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="icon">👥</div>
                <h3>No Students Found</h3>
                <p>Start by adding your first student to the system</p>
                <button class="add-btn main">➕ Add Student</button>
            `;
        }

        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
    }

    showNoResultsState(query) {
        const emptyState = document.querySelector('.empty-state');
        const tableContainer = document.querySelector('.students-table');

        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="icon">🔍</div>
                <h3>No Results Found</h3>
                <p>No students match your search for "${query}"</p>
                <button class="add-btn main">➕ Add Student</button>
            `;
        }

        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.studentUIDManager = new StudentUIDManager();
});