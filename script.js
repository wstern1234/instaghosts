// script.js
document.getElementById('toggleDisclaimer').addEventListener('click', function () {
    const disclaimer = document.getElementById('disclaimerContainer');
    if (disclaimer.style.display === 'none' || disclaimer.style.display === '') {
        disclaimer.style.display = 'block';
        this.textContent = 'Hide explanation';
    } else {
        disclaimer.style.display = 'none';
        this.textContent = 'Why so many steps?';
    }
});

// Hide the disclaimer by default
document.getElementById('disclaimerContainer').style.display = 'none';

const stepsContainer = document.getElementById('stepsContainer');
const toggleStepsBtn = document.getElementById('toggleSteps');

// Ensure steps are visible by default
stepsContainer.style.display = 'block';

// Toggle steps visibility
toggleStepsBtn.addEventListener('click', function () {
    if (stepsContainer.style.display === 'block') {
        stepsContainer.style.display = 'none';
        this.textContent = 'Show steps';
    } else {
        stepsContainer.style.display = 'block';
        this.textContent = 'Hide steps';
    }
});

document.getElementById('zipInput').addEventListener('change', handleZipUpload);

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

        const allFiles = Object.keys(zipData.files); //For debugging
        console.log("Files in ZIP:", allFiles); //For debugging

        const filePaths = {
            following: `connections/followers_and_following/following.html`,
            followers: `connections/followers_and_following/followers_1.html`,
            pendingRequests: `connections/followers_and_following/pending_follow_requests.html`,
            recentlyUnfollowed: `connections/followers_and_following/recently_unfollowed_profiles.html`,
            recentFollowRequests: `connections/followers_and_following/recent_follow_requests.html`
        };

        const userLists = {};

        for (const [key, path] of Object.entries(filePaths)) {
            if (zipData.files[path]) {
                console.log(`Extracting: ${path}`);
                const fileContent = await zipData.files[path].async("text");
                userLists[key] = extractUsernames(fileContent);
                console.log(`${key} contains ${userLists[key].size} users.`);
            } else {
                console.warn(`File not found: ${path}`);
                userLists[key] = new Set();
            }
        }

        generateTables(userLists);
    } catch (error) {
        console.error("Error processing ZIP file:", error);
    }
}

function extractUsernames(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const users = new Set();
    doc.querySelectorAll("a").forEach(link => {
        users.add(link.textContent.trim());
    });
    console.log(`Extracted ${users.size} usernames from HTML.`);
    return users;
}

function generateTables(userLists) {
    const tablesContainer = document.getElementById('tables');
    tablesContainer.innerHTML = "";

    const dataCategories = [
        { title: "Your Ghosts", data: [...userLists.following].filter(user => !userLists.followers.has(user)) },
        { title: "Self Ghosts", data: [...userLists.followers].filter(user => !userLists.following.has(user)) },
        { title: "Pending Follow Requests", data: [...userLists.pendingRequests] },
        { title: "You Recently Unfollowed", data: [...userLists.recentlyUnfollowed] },
        { title: "Pending or Denied Your Follow", data: [...userLists.recentFollowRequests].filter(user => !userLists.following.has(user)) } // Renamed
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
                    ? `<table><tbody>${data.map(user => `<tr><td><a href="https://www.instagram.com/${user}" target="_blank" rel="noopener noreferrer" title="${user}">${user}</a></td></tr>`).join('')}</tbody></table>`
                    : `<table><tbody><tr><td colspan="1">Nothing to show here</td></tr></tbody></table>`}
            </div>
        </div>
    `;

        tablesContainer.innerHTML += sectionHTML;
    });
}

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

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', toggleDarkMode);

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        darkModeToggle.textContent = 'Light';
    } else {
        darkModeToggle.textContent = 'Dark';
    }
}

// Set initial button text
if (document.body.classList.contains('dark-mode')) {
    darkModeToggle.textContent = 'Light';
} else {
    darkModeToggle.textContent = 'Dark';
}