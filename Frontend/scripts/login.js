const form = document.getElementById("loginForm");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
        alert("Please fill in both username and password");
        return;
    }

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("loggedUser", JSON.stringify(result.user));
            localStorage.setItem("authToken", result.token);  // Salvezi tokenul corect
            alert("Login successful!");
            window.location.href = "/pages/dashboard.html";
        } else {
            alert(result.message || "Login failed");
        }
    } catch (error) {
        alert("Network error. Please try again.");
        console.error(error);
    }
});
