document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Verificare autentificare și rol ---
    const token = localStorage.getItem("authToken");
    const loggedUserRaw = localStorage.getItem("loggedUser");
    if (!token || !loggedUserRaw) {
        alert("Token invalid sau fără rol! Te rugăm să te autentifici.");
        window.location.href = "/pages/login.html";
        return;
    }

    const loggedUser = JSON.parse(loggedUserRaw);
    const role = loggedUser.role;

    // --- 2. Elemente UI ---
    const createReportForm = document.getElementById("create-report-form");
    const searchReportsSection = document.getElementById("search-reports-section");
    const updateReportSection = document.getElementById("update-report-section");

    // Ascundem tot inițial
    createReportForm.classList.add("hidden");
    searchReportsSection.classList.add("hidden");
    updateReportSection.classList.add("hidden");

    // --- 3. Afișare secțiuni în funcție de rol ---
    switch (role) {
        case "citizen":
            createReportForm.classList.remove("hidden");
            break;
        case "authorized_personnel":
            createReportForm.classList.remove("hidden");
            searchReportsSection.classList.remove("hidden");
            updateReportSection.classList.remove("hidden");
            break;
        case "decision_maker":
            createReportForm.classList.remove("hidden");
            searchReportsSection.classList.remove("hidden");
            updateReportSection.classList.remove("hidden");
            break;
        case "admin":
            createReportForm.classList.remove("hidden");
            searchReportsSection.classList.remove("hidden");
            updateReportSection.classList.remove("hidden");
            break;
        default:
            alert("Rol necunoscut! Acces interzis.");
            window.location.href = "/pages/login.html";
            return;
    }

    // --- 4. Funcții utile ---
    function showError(message) {
        alert(message);
    }

    function handleAuthError() {
        alert("Autentificare eșuată. Te rugăm să te autentifici din nou.");
        logout();
    }

    function renderReportsTable(reports) {
        const tbody = document.querySelector("#reports-table tbody");
        tbody.innerHTML = "";

        if (!reports || reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">Nu s-au găsit rapoarte.</td></tr>`;
            return;
        }

        reports.forEach(report => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${report._id || report.id || "-"}</td>
                <td>${report.street || "-"}</td>
                <td>${report.neighborhood || "-"}</td>
                <td>${report.city || "-"}</td>
                <td>${report.category || "-"}</td>
                <td>${report.issue || report.issueType || "-"}</td>
                <td>${report.status || "-"}</td>
                <td>
                  <button class="btn-view-details" data-id="${report._id || report.id}">Vezi detalii</button>
                  ${role === 'authorized_personnel' || role === 'decision_maker' ? 
                    `<button class="btn-join-report" data-id="${report._id || report.id}">Preia</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Atașăm event listener pentru butoanele de detalii
        document.querySelectorAll(".btn-view-details").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                await fetchAndShowReportDetails(id);
            });
        });

        // Atașăm event listener pentru butoanele de join
        document.querySelectorAll(".btn-join-report").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                await joinReport(id);
            });
        });
    }

    async function fetchAndShowReportDetails(id) {
        try {
            const res = await fetch(`/report/id/${encodeURIComponent(id)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                if (res.status === 404) {
                    showError("Raportul nu a fost găsit.");
                } else if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                } else {
                    showError("Eroare server: " + res.status);
                }
                return;
            }

            const report = await res.json();

            const detailsDiv = document.getElementById("report-details");
            detailsDiv.innerHTML = `
                <h3>Detalii raport ID: ${report._id || report.id}</h3>
                <p><strong>Stradă:</strong> ${report.street || "-"}</p>
                <p><strong>Cartier:</strong> ${report.neighborhood || "-"}</p>
                <p><strong>Oraș:</strong> ${report.city || "-"}</p>
                <p><strong>Categorie:</strong> ${report.category || "-"}</p>
                <p><strong>Tip problemă:</strong> ${report.issue || report.issueType || "-"}</p>
                <p><strong>Descriere:</strong> ${report.description || "-"}</p>
                <p><strong>Status:</strong> ${report.status || "-"}</p>
                <p><strong>Rezolvare:</strong> ${report.resolutionDetails || "-"}</p>
                <p><strong>Raportat de:</strong> ${report.reporterId?.email || "-"}</p>
                <p><strong>Rezolvat de:</strong> ${report.resolvedBy?.email || "-"}</p>
            `;

            // Dacă e decident, completează câmpul de update cu ID-ul raportului
            if (role === "decision_maker" || role === "authorized_personnel") {
                const updateIdInput = document.getElementById("update-report-id");
                updateIdInput.value = report._id || report.id || "";
            }

        } catch (error) {
            console.error(error);
            showError("Eroare la conectarea cu serverul.");
        }
    }

    async function joinReport(id) {
        try {
            const res = await fetch(`/report/join/id/${encodeURIComponent(id)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("Ai preluat cu succes raportul!");
                // refresh current search results
                const searchBtn = document.getElementById("btn-search-reports");
                if (searchBtn) {
                    searchBtn.click();
                }
            } else {
                const errData = await res.json();
                showError(errData.message || "Eroare la preluarea raportului.");
            }
        } catch (err) {
            console.error(err);
            showError("Eroare la conectarea cu serverul.");
        }
    }

    // --- 5. Creare raport ---
    createReportForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const street = document.getElementById("report-street").value.trim();
        const neighborhood = document.getElementById("report-neighborhood").value.trim();
        const city = document.getElementById("report-city").value.trim();
        const category = document.getElementById("report-category").value;
        const issueType = document.getElementById("report-issue").value;
        const description = document.getElementById("report-description").value.trim();

        if (!street || !neighborhood || !city || !category || !issueType) {
            showError("Te rugăm să completezi toate câmpurile obligatorii.");
            return;
        }

        try {
            const res = await fetch("/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    street,
                    neighborhood,
                    city,
                    category,
                    issueType,
                    description
                })
            });

            if (res.ok) {
                alert("Raport creat cu succes!");
                createReportForm.reset();
            } else {
                const errData = await res.json();
                showError(errData.message || "Eroare la crearea raportului.");
            }
        } catch (err) {
            console.error(err);
            showError("Eroare la conectarea cu serverul.");
        }
    });

    // --- 6. Căutare rapoarte ---
    document.getElementById("btn-search-reports").addEventListener("click", async () => {
        const city = document.getElementById("search-city").value.trim();
        const neighborhood = document.getElementById("search-neighborhood").value.trim();

        if (!city || !neighborhood) {
            showError("Te rugăm să completezi câmpurile Oraș și Cartier.");
            return;
        }

        try {
            console.log(`Searching for reports in ${neighborhood}, ${city}`);
            const res = await fetch(`/report/by/city/${encodeURIComponent(city)}/neighborhood/${encodeURIComponent(neighborhood)}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("Search response status:", res.status);
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Search error response:", errorText);
                
                if (res.status === 404) {
                    showError("Nu s-au găsit rapoarte pentru această zonă.");
                } else if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                } else {
                    showError(`Eroare server: ${res.status} - ${errorText}`);
                }
                return;
            }

            const data = await res.json();
            console.log("Search response data:", data);
            
            const reports = data.report || data.reports || [];
            renderReportsTable(reports);
            document.getElementById("report-details").innerHTML = "";
        } catch (error) {
            console.error("Search error:", error);
            showError("Eroare la conectarea cu serverul: " + error.message);
        }
    });

    document.getElementById("btn-search-report-id").addEventListener("click", async () => {
        const id = document.getElementById("search-report-id").value.trim();

        if (!id) {
            showError("Te rugăm să introduci un ID valid.");
            return;
        }

        await fetchAndShowReportDetails(id);
    });

    // --- 7. Actualizare raport ---
    const updateForm = document.getElementById("update-report-form");
    updateForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const reportId = document.getElementById("update-report-id").value.trim();
        const status = document.getElementById("update-report-status").value;
        const resolutionDetails = document.getElementById("update-report-resolution").value.trim();

        if (!reportId || !status || !resolutionDetails) {
            showError("Te rugăm să completezi toate câmpurile pentru actualizare.");
            return;
        }

        console.log("Updating report:", { reportId, status, resolutionDetails });
        console.log("User role:", role);
        console.log("Token exists:", !!token);

        try {
            const res = await fetch(`/report/id/${encodeURIComponent(reportId)}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    resolutionDetails
                })
            });

            console.log("Update response status:", res.status);

            const updateResult = document.getElementById("update-result");

            if (res.ok) {
                const successData = await res.json();
                console.log("Update success:", successData);
                updateResult.textContent = "Raport actualizat cu succes!";
                updateResult.style.color = "green";
                updateForm.reset();
                document.getElementById("update-report-id").value = ""; // resetăm id-ul
            } else {
                const errorText = await res.text();
                console.error("Update error response:", errorText);
                
                if (res.status === 401 || res.status === 403) {
                    updateResult.textContent = `Acces interzis. Doar personalul autorizat și administratorii pot actualiza rapoarte. Rolul tău: ${role}`;
                    updateResult.style.color = "red";
                } else {
                    let errorMessage;
                    try {
                        const errData = JSON.parse(errorText);
                        errorMessage = errData.message || "Eroare la actualizarea raportului.";
                    } catch {
                        errorMessage = errorText || "Eroare la actualizarea raportului.";
                    }
                    updateResult.textContent = errorMessage;
                    updateResult.style.color = "red";
                }
            }
        } catch (err) {
            console.error("Update request error:", err);
            const updateResult = document.getElementById("update-result");
            updateResult.textContent = "Eroare la conectarea cu serverul: " + err.message;
            updateResult.style.color = "red";
        }
    });

    // Add download functionality
    function addDownloadButtons() {
        const searchSection = document.getElementById("search-reports-section");
        if (!searchSection) return;

        const downloadDiv = document.createElement("div");
        downloadDiv.innerHTML = `
            <h3>Descarcă Rapoarte</h3>
            <div style="margin: 10px 0;">
                <button id="download-csv" class="btn">Descarcă CSV</button>
                <button id="download-html" class="btn">Descarcă HTML</button>
                <button id="download-pdf" class="btn">Descarcă PDF</button>
            </div>
        `;
        searchSection.appendChild(downloadDiv);

        // Add event listeners for download buttons
        document.getElementById("download-csv").addEventListener("click", () => downloadReports('csv'));
        document.getElementById("download-html").addEventListener("click", () => downloadReports('html'));
        document.getElementById("download-pdf").addEventListener("click", () => downloadReports('pdf'));
    }

    async function downloadReports(format) {
        try {
            const city = document.getElementById("search-city").value.trim();
            const neighborhood = document.getElementById("search-neighborhood").value.trim();
            
            let requestUrl = `/report/download?format=${format}`;
            if (city && neighborhood) {
                requestUrl += `&city=${encodeURIComponent(city)}&neighborhood=${encodeURIComponent(neighborhood)}`;
            }

            console.log(`Downloading reports with URL: ${requestUrl}`);

            const res = await fetch(requestUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("Download response status:", res.status);
            console.log("Download response headers:", res.headers);

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Download error response:", errorText);
                showError(`Eroare la descărcarea raportului: ${res.status} - ${errorText}`);
                return;
            }

            // get filename from response headers or create default
            const contentDisposition = res.headers.get('content-disposition');
            let filename = `reports-${new Date().toISOString().split('T')[0]}.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            console.log(`Downloading file: ${filename}`);

            // download file
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            console.log("Download completed successfully");

        } catch (error) {
            console.error("Download error:", error);
            showError("Eroare la conectarea cu serverul: " + error.message);
        }
    }

    // Add download buttons if user has appropriate role
    if (role === 'authorized_personnel' || role === 'decision_maker' || role === 'admin') {
        addDownloadButtons();
    }
});

// --- Logout ---
function logout() {
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
}
