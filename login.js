document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const username = e.target[0].value;
  const password = e.target[1].value;

  try {
    const response = await fetch('https://bravetosmart.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(`Login failed: ${errorData.message || response.statusText}`);
      return;
    }

    const data = await response.json();

    // Store the JWT token (for future API use)
    localStorage.setItem('accessToken', data.token || data.accessToken || data.jwt);

    alert('Login successful!');
    // Optionally redirect to dashboard
    window.location.href = '/dashboard.html'; // Change to your actual dashboard page
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred. Please try again.');
  }
});
