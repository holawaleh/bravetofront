// Select DOM elements
const modal = document.getElementById("studentModal");
const openBtns = document.querySelectorAll(".add-btn");
const closeBtn = document.getElementById("closeModal");
const uidInput = document.getElementById("uid");
const form = document.getElementById("studentForm");

// Open modal and fetch latest UID
openBtns.forEach(btn => {
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch("https://bravetosmart.onrender.com/api/students/latest-uid");
      const data = await res.json();

      // Pre-fill the UID field
      uidInput.value = data.uid || "No UID captured yet";
    } catch (error) {
      uidInput.value = "Error fetching UID";
      console.error("Failed to fetch UID:", error);
    }

    modal.style.display = "flex";
  });
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  form.reset();
});

// Close modal when clicking outside modal content
window.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
    form.reset();
  }
});

// Submit form to backend (optional, adjust URL)
form.addEventListener("submit", async e => {
  e.preventDefault();

  const student = {
    uid: uidInput.value,
    name: document.getElementById("name").value,
    matric: document.getElementById("matric").value,
  };

  try {
    const res = await fetch("https://bravetosmart.onrender.com/api/students/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(student)
    });

    if (!res.ok) throw new Error("Failed to register");

    alert("Student registered successfully!");
    modal.style.display = "none";
    form.reset();
    // TODO: Refresh student list
  } catch (err) {
    console.error(err);
    alert("Error registering student.");
  }
});
