document.addEventListener("DOMContentLoaded", () => {
    const criteriaSelect = document.getElementById("search-criteria");
    const dynamicFields = document.getElementById("dynamic-fields");
    const searchBtn = document.getElementById("search-btn");
    const dumpstersContainer = document.getElementById("dumpsters-container");

    const token = localStorage.getItem("authToken");

    if (!token) {
        alert("You are not authenticated. Please log in.");
        window.location.href = "/pages/login.html";
        return;
    }

    function renderFields(criteria) {
        dynamicFields.innerHTML = "";

        if (criteria === "id") {
            dynamicFields.innerHTML = `<input type="text" id="id-field" placeholder="Enter ID..." />`;
        } else if (criteria === "address") {
            dynamicFields.innerHTML = `
        <input type="text" id="street" placeholder="Street..." />
        <input type="text" id="neighborhood" placeholder="Neighborhood..." />
        <input type="text" id="city" placeholder="City..." />
        <select id="dumpster-type">
          <option value="">-- Dumpster Type (optional) --</option>
          <option value="household">Household</option>
          <option value="paper">Paper</option>
          <option value="plastic">Plastic</option>
          <option value="glass">Glass</option>
          <option value="metal">Metal</option>
          <option value="electronics">Electronics</option>
          <option value="batteries">Batteries</option>
          <option value="organic">Organic</option>
          <option value="textiles">Textiles</option>
          <option value="construction">Construction</option>
        </select>
      `;
        } else if (criteria === "neighborhood") {
            dynamicFields.innerHTML = `
        <input type="text" id="city" placeholder="City..." />
        <input type="text" id="neighborhood" placeholder="Neighborhood..." />
      `;
        }
    }

    criteriaSelect.addEventListener("change", () => {
        renderFields(criteriaSelect.value);
    });

    renderFields(criteriaSelect.value);

    searchBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        dumpstersContainer.innerHTML = "<p>Loading...</p>";

        const criteria = criteriaSelect.value;
        let url = "";
        let options = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        };

        try {
            if (criteria === "id") {
                const id = document.getElementById("id-field").value.trim();
                if (!id) {
                    showError("Please enter an ID.");
                    return;
                }
                url = `/dumpster/id/${encodeURIComponent(id)}`;
                options.method = "GET";
            } else if (criteria === "address") {
                const street = document.getElementById("street").value.trim();
                const neighborhood = document.getElementById("neighborhood").value.trim();
                const city = document.getElementById("city").value.trim();
                const dumpsterType = document.getElementById("dumpster-type").value;

                if (!street || !neighborhood || !city) {
                    showError("Please fill in Street, Neighborhood and City.");
                    return;
                }
                url = `/dumpster/find`;
                options.method = "POST";
                options.body = JSON.stringify({ street, neighborhood, city, dumpsterType });
            } else if (criteria === "neighborhood") {
                const neighborhood = document.getElementById("neighborhood").value.trim();
                const city = document.getElementById("city").value.trim();
                if (!city || !neighborhood) {
                    showError("Please enter City and Neighborhood.");
                    return;
                }
                url = `/dumpster/city/${encodeURIComponent(city)}/neighborhood/${encodeURIComponent(neighborhood)}`;
                options.method = "GET";
            }

            const res = await fetch(url, options);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 404) {
                    showError("Dumpster does not exist.");
                } else if (res.status === 401 || res.status === 403) {
                    alert("Authentication failed. Please log in again.");
                    window.location.href = "/pages/login.html";
                } else {
                    showError(data.message || "Internal server error.");
                }
                return;
            }

            let dumpsters = Array.isArray(data) ? data :
                data.dumpsters ? data.dumpsters :
                    data.dumpster ? [data.dumpster] : [];

            renderResults(dumpsters);
        } catch (err) {
            showError("Error connecting to server.");
            console.error(err);
        }
    });

    function renderResults(dumpsters) {
        dumpstersContainer.innerHTML = "";

        if (!dumpsters || dumpsters.length === 0) {
            dumpstersContainer.innerHTML = "<p>No dumpsters found.</p>";
            return;
        }

        dumpsters.forEach(d => {
            const div = document.createElement("div");
            div.className = "dumpster-card";
            div.innerHTML = `
        <h3>${d.street || "-"}, ${d.neighborhood || "-"}</h3>
        <p>City: ${d.city || "-"}</p>
        <p>Type: ${d.dumpsterType || "-"}</p>
        <p>Status: ${d.status || "-"}</p>
      `;
            dumpstersContainer.appendChild(div);
        });
    }

    function showError(msg) {
        dumpstersContainer.innerHTML = `<p style="color:red;">${msg}</p>`;
    }
});

// logout function
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
