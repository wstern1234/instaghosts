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
document.getElementById('zipInput').addEventListener('change', handleZipUpload);

async function handleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return console.log("No file selected.");

    console.log(`File selected: ${file.name}`);

    const zip = new JSZip();
    try {
        const zipData = await zip.loadAsync(file);
        console.log("ZIP file loaded successfully.");

        const filePaths = {
            followers: `connections/followers_and_following/followers_1.html`,
            following: `connections/followers_and_following/following.html`,
            pendingFollowRequests: `connections/followers_and_following/pending_follow_requests.html`,
            recentFollowRequests: `connections/followers_and_following/recent_follow_requests.html`
        };

        const userLists = {};

        for (const [key, path] of Object.entries(filePaths)) {
            if (zipData.files[path]) {
                console.log(`Extracting: ${path}`);
                const fileContent = await zipData.files[path].async("text");
                userLists[key] = extractUsernames(fileContent);
                console.log(`${key} contains ${userLists[key].length} users.`);
            } else {
                console.warn(`File not found: ${path}`);
                userLists[key] = [];  // Initialize as empty array
            }
        }

        // Calculate "Your Ghosts" and "Self Ghosts"
        const yourGhosts = userLists.following.filter(user => !userLists.followers.includes(user));
        const selfGhosts = userLists.followers.filter(user => !userLists.following.includes(user));

        // Generate tables
        generateTables({
            "Your Ghosts": yourGhosts,
            "Self Ghosts": selfGhosts,
            "Pending Follow Requests": userLists.pendingFollowRequests,
            "Recent Follow Requests": userLists.recentFollowRequests
        });

    } catch (error) {
        console.error("Error processing ZIP file:", error);
    }
}

// Extract usernames using querySelectorAll for better accuracy
function extractUsernames(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    return Array.from(doc.querySelectorAll('a[target="_blank"]'))
        .map(a => a.href.replace('https://www.instagram.com/', '').replace('/', ''))
        .filter(username => username.length > 0);
}

// Generate the tables for displaying the user data
function generateTables(userLists) {
    const tablesContainer = document.getElementById('tables');
    tablesContainer.innerHTML = "";

    Object.entries(userLists).forEach(([title, data], index) => {
        const tableId = `table-${index}`;
        const sectionHTML = `
        <div class="container">
            <div class="section-header" onclick="toggleTable('${tableId}', this)">
                <span class="arrow">▶</span> ${title}
            </div>
            <div id="${tableId}" class="collapsed">
                ${data.length > 0
                    ? `<table><tbody>${data.map(user => `<tr><td><a href="https://www.instagram.com/${user}" target="_blank" rel="noopener noreferrer" title="${user}">${user}</a></td></tr>`).join('')}</tbody></table>`
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
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', toggleDarkMode);

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light' : 'Dark';
}

// Set initial button text
darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light' : 'Dark';
