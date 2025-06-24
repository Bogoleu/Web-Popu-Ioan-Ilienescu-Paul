document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    // Redirect dacă nu ești autentificat
    if (!token) {
        window.location.href = "../pages/login.html";
        return;
    }

    const reportTableBody = document.getElementById("reports-list");
    const noReportsMsg = document.getElementById("no-reports-msg");

    try {
        const response = await fetch("http://localhost:3000/report", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load reports");
        }

        const reports = data.report;

        // Nu avem rapoarte
        if (!reports || reports.length === 0) {
            noReportsMsg.style.display = "block";
            return;
        }

        // Afișăm fiecare raport în tabel
        reports.forEach((report) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${report._id}</td>
                <td>${report.category || "N/A"}</td>
                <td>${report.issue || "N/A"}</td>
                <td>${report.status || "N/A"}</td>
                <td>${new Date(report.createdAt).toLocaleString()}</td>
            `;

            reportTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading reports:", error.message);
        noReportsMsg.style.display = "block";
        noReportsMsg.textContent = "Failed to load your reports. Please try again later.";
    }

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        if (confirm("Esti sigur ca vrei sa te deconectezi?")) {
            // get token before clearing storage
            const token = localStorage.getItem("authToken");
            
            // clear all auth data
            localStorage.removeItem("authToken");
            localStorage.removeItem("loggedUser");
            
            // call logout endpoint to invalidate token on server
            if (token) {
                fetch("/auth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }).catch(err => console.log("Logout request failed:", err));
            }
            
            // redirect to login page
            window.location.href = "../pages/login.html";
        }
    });
});
