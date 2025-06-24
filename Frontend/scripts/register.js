document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const neighborhood = document.getElementById("neighborhood").value;
    const city = document.getElementById("city").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const res = await fetch("/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password,
                neighborhood,
                city,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            alert("Account created! Redirecting to login.");
            window.location.href = "/pages/login.html";
        } else {
            alert("Registration failed: " + (data.message || data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Something went wrong: " + err.message);
    }
});
