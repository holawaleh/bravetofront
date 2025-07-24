document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("studentModal");
    const addBtns = document.querySelectorAll(".add-btn");
    const closeBtn = document.getElementById("closeModal");
    const uidInput = document.getElementById("uid");
    const form = document.getElementById("studentForm");
    const studentTable = document.querySelector(".empty-state"); // This targets the empty-state div, which will be replaced by the table
    const badge = document.querySelector(".badge");

    let students = []; // all students
    let currentPage = 1;
    const perPage = 10;

    // Show Modal and Fetch UID
    addBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            modal.style.display = "block";
            // Set UID input to prompt for scan and disable other fields
            uidInput.value = 'Scan UID Code...';
            uidInput.style.backgroundColor = '#fff3cd'; // Light yellow for a prompt
            uidInput.style.border = '1px dashed #d6a100'; // Dashed border for prompt
            uidInput.title = 'Waiting for UID scan';
            uidInput.readOnly = true; // Keep it read-only

            toggleFormFields(false); // Disable other form fields initially
            showNotification('Please scan the UID code to proceed.', 'info');
        });
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        form.reset(); // Reset form when closing
        toggleFormFields(true); // Re-enable all fields on close
        uidInput.value = ''; // Clear UID input
        uidInput.style.backgroundColor = '';
        uidInput.style.border = '';
        uidInput.title = '';
    });

    // Fetch latest UID from API
    async function fetchLatestUID() {
        try {
            const res = await fetch("https://bravetosmart.onrender.com/api/students/get-latest-uid");
            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`Failed to fetch UID: ${res.status} - ${errorData}`);
            }
            const data = await res.json();
            return data.latestUid || data; // Assuming it returns {latestUid: "..."} or directly the string
        } catch (error) {
            console.error("Error fetching UID:", error);
            showNotification('Could not fetch UID from server. Please try again.', 'error');
            return null;
        }
    }

    // Function to handle UID population after "scan"
    async function handleUIDScan() {
        uidInput.value = 'Fetching UID...';
        uidInput.style.backgroundColor = '#e8f5e8';
        uidInput.style.border = '2px solid #27ae60';
        uidInput.title = 'Fetching UID from server';

        const fetchedUid = await fetchLatestUID();
        if (fetchedUid) {
            uidInput.value = fetchedUid;
            uidInput.style.backgroundColor = '#e8f5e8';
            uidInput.style.border = '2px solid #27ae60';
            uidInput.title = 'UID captured successfully';
            toggleFormFields(true); // Enable other fields
            showNotification('UID captured successfully!', 'success');
        } else {
            uidInput.value = 'Error/No UID'; // Clear or indicate error
            uidInput.style.backgroundColor = '#f8d7da'; // Light red for error
            uidInput.style.border = '1px solid #dc3545';
            uidInput.title = 'Failed to get UID, try again';
            toggleFormFields(false); // Keep other fields disabled
            showNotification('Failed to capture UID. Please scan again.', 'error');
        }
    }

    // Simulate UID scanning by keyboard 'Enter'
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block' && uidInput.value === 'Scan UID Code...' && e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if Enter is pressed
            handleUIDScan(); // Trigger the UID fetch process
        }
    });

    // Helper to toggle other form fields
    function toggleFormFields(enable) {
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


    // Load Students
    async function loadStudents(highlightUID = null) {
        const existingTable = document.querySelector(".student-table");
        if (existingTable) {
            existingTable.remove(); // Remove existing table to show loading or empty state
        }
        studentTable.innerHTML = `<p>Loading students...</p>`;
        try {
            const res = await fetch("https://bravetosmart.onrender.com/api/students");
            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`Failed to load students: ${res.status} - ${errorData}`);
            }
            students = await res.json();
            badge.textContent = `(${students.length})`;

            if (students.length === 0) {
                studentTable.innerHTML = `
                    <div class="icon">👥</div>
                    <h3>No Students Found</h3>
                    <p>Start by adding your first student to the system</p>
                    <button class="add-btn main">➕ Add Student</button>
                `;
                // Re-attach event listener for the new add-btn
                document.querySelector('.add-btn.main').addEventListener("click", async () => {
                    modal.style.display = "block";
                    uidInput.value = 'Scan UID Code...';
                    uidInput.style.backgroundColor = '#fff3cd';
                    uidInput.style.border = '1px dashed #d6a100';
                    uidInput.title = 'Waiting for UID scan';
                    uidInput.readOnly = true;
                    toggleFormFields(false);
                    showNotification('Please scan the UID code to proceed.', 'info');
                });
                return;
            }

            renderPaginatedTable(students, highlightUID);
        } catch (error) {
            console.error("Failed to load students", error);
            studentTable.innerHTML = `<p style="color: red;">Error loading students: ${error.message}</p>`;
        }
    }

    // Render paginated table
    function renderPaginatedTable(data, highlightUID) {
        const totalPages = Math.ceil(data.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageData = data.slice(start, start + perPage);

        const rows = pageData.map(s => {
            const isNew = s.uid === highlightUID;
            return `
                <tr class="${isNew ? 'new-entry' : ''}">
                    <td>${s.uid || 'N/A'}</td>
                    <td>${s.name || 'N/A'}</td>
                    <td>${s.matricNo || 'N/A'}</td>
                    <td>${s.email || 'N/A'}</td>
                    <td>${s.level || 'N/A'}</td>
                    <td>${s.phone || 'N/A'}</td>
                    <td>${s.department || 'N/A'}</td>
                </tr>
            `;
        }).join("");

        let pagination = "";
        if (totalPages > 1) {
            pagination = `<div class="pagination">`;
            for (let i = 1; i <= totalPages; i++) {
                pagination += `<button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            pagination += `</div>`;
        }

        studentTable.innerHTML = `
            <table class="student-table">
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Name</th>
                        <th>Matric No</th>
                        <th>Email</th>
                        <th>Level</th>
                        <th>Phone</th>
                        <th>Department</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${pagination}
        `;

        // Highlight effect
        if (highlightUID) {
            setTimeout(() => {
                const row = document.querySelector("tr.new-entry");
                if (row) row.classList.remove("new-entry");
            }, 2000);
        }

        // Page change handler
        document.querySelectorAll(".page-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                currentPage = parseInt(e.target.dataset.page);
                renderPaginatedTable(students);
            });
        });
    }

    // Submit new student
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validate UID is not the placeholder
        if (uidInput.value === 'Scan UID Code...' || uidInput.value === 'Fetching UID...' || uidInput.value === 'Error/No UID') {
            showNotification('Please scan a valid UID before submitting.', 'error');
            return;
        }

        const studentData = {
            uid: uidInput.value.trim(), // Ensure UID is trimmed
            name: form.name.value.trim(),
            matricNo: form.matric.value.trim(),
            email: form.email.value.trim(),
            level: form.level.value.trim(),
            phone: form.phone.value.trim(),
            department: form.department.value.trim(),
        };

        // Basic validation for other fields
        const requiredFields = ['name', 'matricNo', 'email', 'phone', 'department'];
        const missingFields = requiredFields.filter(field => !studentData[field]);

        if (missingFields.length > 0) {
            showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
            return;
        }

        try {
            const res = await fetch("https://bravetosmart.onrender.com/api/students/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData),
            });

            const result = await res.json();

            if (res.ok) {
                showNotification("Student registered successfully!", 'success');
                form.reset();
                modal.style.display = "none";
                currentPage = 1; // jump to first page
                await loadStudents(studentData.uid); // highlight this UID
            } else {
                showNotification(`Registration failed: ${result.message || res.statusText}`, 'error');
            }
        } catch (error) {
            console.error("Error registering student:", error);
            showNotification("Something went wrong during registration.", 'error');
        } finally {
            toggleFormFields(true); // Ensure fields are re-enabled if submit fails or completes
        }
    });

    // Notification function (re-added for this script version)
    function showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c';
        } else if (type === 'warning' || type === 'info') {
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


    // Initial load
    loadStudents();
});