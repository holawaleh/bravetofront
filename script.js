const apiBase = "https://bravetosmart.onrender.com/api/students";

document.addEventListener("DOMContentLoaded", () => {
  const studentList = document.getElementById("studentList");
  const form = document.getElementById("registerForm");
  const uidInput = document.getElementById("uid");
  const errorBox = document.getElementById("errorBox");
  const successBox = document.getElementById("successBox");

  async function loadStudents() {
    try {
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error("Network error while loading students");
      const students = await res.json();

      studentList.innerHTML = "";

      if (students.length === 0) {
        studentList.innerHTML = "<p>No students registered yet.</p>";
        return;
      }

      students.forEach(student => {
        const div = document.createElement("div");
        div.classList.add("student-card");
        div.innerHTML = `
          <strong>${student.name}</strong><br>
          UID: ${student.uid}<br>
          Matric: ${student.matricNo}<br>
          Email: ${student.email}<br>
          Dept: ${student.department}<br>
          Phone: ${student.phone}<br>
          Level: ${student.level}
        `;
        studentList.appendChild(div);
      });
    } catch (err) {
      console.error("Failed to load students:", err);
      studentList.innerHTML = "<p style='color:red;'>Error loading students.</p>";
    }
  }

  async function getLatestUID() {
    try {
      const res = await fetch(`${apiBase}/get-latest-uid`);
      if (!res.ok) throw new Error("No UID scanned");
      const data = await res.json();
      uidInput.value = data.uid;
    } catch (err) {
      uidInput.value = "";
      console.warn("UID not yet scanned");
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const student = {
      name: form.name.value,
      matricNo: form.matricNo.value,
      email: form.email.value,
      level: form.level.value,
      phone: form.phone.value,
      department: form.department.value
    };

    try {
      const res = await fetch(`${apiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to register student");

      successBox.textContent = data.message;
      errorBox.textContent = "";
      form.reset();
      uidInput.value = "";
      loadStudents(); // refresh student list
    } catch (err) {
      errorBox.textContent = err.message;
      successBox.textContent = "";
    }
  });

  // Initial load
  loadStudents();
  getLatestUID();

  // Poll for UID every 3 seconds
  setInterval(getLatestUID, 3000);
});
