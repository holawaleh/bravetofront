const modal = document.getElementById("studentModal");
const openBtns = document.querySelectorAll(".add-btn");
const closeBtn = document.getElementById("closeModal");
const uidInput = document.getElementById("uid");
const studentForm = document.getElementById("studentForm");

// Open modal and fetch latest UID
openBtns.forEach(btn => {
  btn.addEventListener("click", async () => {
    modal.style.display = "flex";
    try {
      const res = await fetch("https://bravetosmart.onrender.com/api/latest-uid");
      const data = await res.json();
      uidInput.value = data.uid || "Not found";
    } catch (err) {
      uidInput.value = "Fetch error";
      console.error("Failed to fetch UID:", err);
    }
  });
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  studentForm.reset();
});

// Submit form
studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentData = {
    uid: uidInput.value,
    name: document.getElementById("name").value,
    matric: document.getElementById("matric").value,
  };

  try {
    const res = await fetch("https://bravetosmart.onrender.com/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });

    if (res.ok) {
      alert("Student registered successfully!");
      modal.style.display = "none";
      studentForm.reset();
    } else {
      const errorData = await res.json();
      alert("Failed: " + (errorData.message || "Unknown error"));
    }
  } catch (err) {
    alert("Error submitting student data.");
    console.error(err);
  }
});
