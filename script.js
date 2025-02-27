// Handle the disclaimer toggle
document.getElementById('toggleDisclaimer').addEventListener('click', function () {
    const disclaimer = document.getElementById('disclaimerContainer');
    disclaimer.style.display = disclaimer.style.display === 'none' || disclaimer.style.display === '' ? 'block' : 'none';
    this.textContent = disclaimer.style.display === 'block' ? 'Hide explanation' : 'Why is it so safe?';
});

// Hide the disclaimer by default
document.getElementById('disclaimerContainer').style.display = 'none';

// Handle the steps toggle
const stepsContainer = document.getElementById('stepsContainer');
const toggleStepsBtn = document.getElementById('toggleSteps');
stepsContainer.style.display = 'block';

toggleStepsBtn.addEventListener('click', function () {
    stepsContainer.style.display = stepsContainer.style.display === 'block' ? 'none' : 'block';
    this.textContent = stepsContainer.style.display === 'block' ? 'Hide steps' : 'Show steps';
});

// Handle ZIP file upload
document.getElementById("zipInput").addEventListener("change", handleZipUpload);

async function handleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("No file selected.");
        return;
    }

    console.log(`File selected: ${file.name}`);

    const zip = new JSZip();
    try {
        const zipData = await zip.loadAsync(file);
        console.log("ZIP file loaded successfully.");

        const allFiles = Object.keys(zipData.files);
        console.log("Files in ZIP:", allFiles);

        // Detect if the data is JSON or HTML based on folder structure
        const isJSON = allFiles.some(path => path.startsWith("connections/followers_and_following/") && path.endsWith(".json"));
        console.log(`Detected format: ${isJSON ? "JSON" : "HTML"}`);

        // Define file paths based on detected format
        const filePaths = {
            following: `connections/followers_and_following/following.${isJSON ? "json" : "html"}`,
            followers: `connections/followers_and_following/followers_1.${isJSON ? "json" : "html"}`,
            pendingFollowRequests: `connections/followers_and_following/pending_follow_requests.${isJSON ? "json" : "html"}`,
            recentFollowRequests: `connections/followers_and_following/recent_follow_requests.${isJSON ? "json" : "html"}`
        };

        const userLists = {};

        for (const [key, path] of Object.entries(filePaths)) {
            if (zipData.files[path]) {
                console.log(`Extracting: ${path}`);
                const fileContent = await zipData.files[path].async("text");

                // Process JSON or HTML while keeping existing logic unchanged
                userLists[key] = isJSON ? extractUsernamesFromJSON(fileContent) : extractUsernamesFromHTML(fileContent);

                console.log(`${key} contains ${userLists[key].size} users.`);
            } else {
                console.warn(`File not found: ${path}`);
                userLists[key] = new Set();
            }
        }

        // Now calculate "Your Ghosts" and "Self Ghosts" by set differences
        const yourGhosts = [...userLists.following].filter(user => !userLists.followers.has(user));
        const selfGhosts = [...userLists.followers].filter(user => !userLists.following.has(user));

        userLists.yourGhosts = new Set(yourGhosts);
        userLists.selfGhosts = new Set(selfGhosts);

        generateTables(userLists);
    } catch (error) {
        console.error("Error processing ZIP file:", error);
    }
}

// Extract usernames from JSON content
function extractUsernamesFromJSON(jsonContent) {
    try {
        const jsonData = JSON.parse(jsonContent);
        const usernames = new Set();

        if (jsonData.relationships_following) {
            jsonData.relationships_following.forEach(entry => usernames.add(entry.string_list_data[0].value));
        } else if (jsonData.relationships_follow_requests_sent) {
            jsonData.relationships_follow_requests_sent.forEach(entry => usernames.add(entry.string_list_data[0].value));
        } else if (jsonData.relationships_permanent_follow_requests) {
            jsonData.relationships_permanent_follow_requests.forEach(entry => usernames.add(entry.string_list_data[0].value));
        } else {
            jsonData.forEach(entry => usernames.add(entry.string_list_data[0].value));
        }

        return usernames;
    } catch (error) {
        console.error("Error parsing JSON data:", error);
        return new Set();
    }
}

// Extract usernames from HTML content
function extractUsernamesFromHTML(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const users = new Set();

    doc.querySelectorAll('a[target="_blank"]').forEach(a => {
        const username = a.href.replace("https://www.instagram.com/", "").replace("/", "");
        if (username) users.add(username);
    });

    return users;
}

// Generate the tables for displaying the user data
function generateTables(userLists) {
    const tablesContainer = document.getElementById("tables");
    tablesContainer.innerHTML = "";

    const dataCategories = [
        { title: "Your Ghosts", data: [...userLists.yourGhosts] },
        { title: "Self Ghosts", data: [...userLists.selfGhosts] },
        { title: "Pending Follow Requests", data: [...userLists.pendingFollowRequests] },
        { title: "Recent Follow Requests", data: [...userLists.recentFollowRequests] }
    ];

    dataCategories.forEach((category, index) => {
        const tableId = `table-${index}`;
        const title = category.title;
        const data = category.data;

        const sectionHTML = `
        <div class="container">
            <div class="section-header" onclick="toggleTable('${tableId}', this)">
                <span class="arrow">▶</span> ${title}
            </div>
            <div id="${tableId}" class="collapsed">
                ${data.length > 0
                    ? `<table><tbody>${data.map(user => `<tr><td><a href="https://www.instagram.com/${user}" target="_blank" rel="noopener noreferrer" title="${user}">${user}</a></td></tr>`).join("")}</tbody></table>`
                    : `<table><tbody><tr><td colspan="1">Nothing to show here</td></tr></tbody></table>`}
            </div>
        </div>
    `;

        tablesContainer.innerHTML += sectionHTML;
    });
}

// Toggle table visibility
function toggleTable(tableId, header) {
    const table = document.getElementById(tableId);
    const arrow = header.querySelector(".arrow");

    if (table.classList.contains("collapsed")) {
        table.classList.remove("collapsed");
        arrow.innerHTML = "▼";
    } else {
        table.classList.add("collapsed");
        arrow.innerHTML = "▶";
    }
}

// Dark mode toggle functionality
const darkModeToggle = document.getElementById("darkModeToggle");
darkModeToggle.addEventListener("click", toggleDarkMode);

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    darkModeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light" : "Dark";
}

// Set initial button text
darkModeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light" : "Dark";
