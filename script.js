document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("studentModal");
  const addBtns = document.querySelectorAll(".add-btn");
  const closeBtn = document.getElementById("closeModal");
  const uidInput = document.getElementById("uid");
  const form = document.getElementById("studentForm");

  // Show Modal and Fetch UID
  addBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      modal.style.display = "block";
      await fetchLatestUID();
    });
  });

  // Hide Modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fetch latest UID from backend and pre-fill
  async function fetchLatestUID() {
    try {
      const res = await fetch("https://bravetosmart.onrender.com/api/students/get-latest-uid");
      if (!res.ok) throw new Error("Failed to fetch UID");
      const data = await res.json();
      uidInput.value = data.uid || "UID not available";
    } catch (error) {
      console.error("Error fetching UID:", error);
      uidInput.value = "Error fetching UID";
    }
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentData = {
      uid: form.uid.value,
      name: form.name.value,
      matricNo: form.matric.value,
      email: form.email.value,
      level: form.level.value,
      phone: form.phone.value,
      department: form.department.value,
    };

    try {
      const res = await fetch("https://bravetosmart.onrender.com/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Student registered successfully!");
        form.reset();
        modal.style.display = "none";
      } else {
        alert("Registration failed: " + result.message);
      }
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Something went wrong.");
    }
  });
});
