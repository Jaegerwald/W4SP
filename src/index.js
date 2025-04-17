console.log(
    "%cthere is no wasp emoji 😢 🐝",
    "color: #fd0; font-size: 32pt; font-weight: 800; font-family: monospace;"
);

let tabs = document.getElementsByClassName("tab");
let page = document.getElementById("page");
let pages = document.getElementsByClassName("page");
let title = document.getElementById("title");

let markdownRaw = document.getElementById("markdownRaw");
let config = getConfig();
let currentPage = "wiki/Main_Page.md";

let viewFileLink = document.getElementById("viewFile");
let editFileLink = document.getElementById("editFile");
let viewRepositoryLink = document.getElementById("viewRepository");

viewRepositoryLink.href = `https://github.com/${config.repo}/tree/${config.branch}`

function hidePages() {
    iterrHtml(pages, function (element) {
        element.className = "page";
    });
}
iterrHtml(tabs, function (element) {
    element.addEventListener("click", function () {
        iterrHtml(tabs, function (element) {
            element.className = "tab";
        });
        element.className = "tab active";
    });
});

// #region Theme Loading
let theme = document.getElementById("theme");

function setTheme(url) {
    theme.href = url;
}

let logo = document.getElementById("logo")
logo.src = config.logo
let logoTexts = document.querySelectorAll("img.logoText");
logoTexts.forEach(img => {
    img.src = config.logo_text
})

// #region Tab Logic

let readTab = document.getElementById("tabRead");
let sourceTab = document.getElementById("tabSource");
let historyTab = document.getElementById("tabHistory");

let readPage = document.getElementById("pageRead");
let sourcePage = document.getElementById("pageSource");
let historyPage = document.getElementById("pageHistory");

readTab.addEventListener("click", function () {
    hidePages();
    readPage.className = "page active";
});
sourceTab.addEventListener("click", function () {
    hidePages();
    sourcePage.className = "page active";
});
historyTab.addEventListener("click", async function () {
    hidePages();
    historyPage.className = "page active";

    try {
        let commits = await getCommits(currentPage);

        historyPage.innerHTML = "";

        if (commits.length == 0) {
            historyPage.innerHTML =
                `<blockquote class="warning"><p>GitHub returned no commits, probably because this page hasn't been pushed to the repository yet. If it has been pushed, please create an issue to report this! Also make sure that it's been more than 15 minutes since you've last checked this tab.</p></blockquote>`;
        }

        commits.forEach((commit) => {
            let element = document.createElement("p");
            element.class = "commit";
            element.innerHTML = `${new Date(commit.date).toLocaleString(undefined, {
                timeZoneName: "short",
            })} | <a href="https://github.com/${config.repo}/commit/${
                commit.sha
            }">${commit.message}</a> - ${commit.author}`;

            historyPage.appendChild(element);
        });
    } catch {
        historyPage.innerHTML = `<blockquote class="error">
    <p>Failed to load commits from GitHub. This might be due to multiple reasons:</p>
    <ul>
        <li>Rate limit of 60 requests per hour reached - please wait about 15 minutes to an hour before clicking on the history tab again</li>
        <li>Misconfigured repository</li>
        <li>Misconfigured branch</li>
    </ul>
    <p>Please read the documentation before reporting this as an issue!</p>
</blockquote>`;
    }
});

// #region Search

function createSearchStrings(pages) {
    let result = [];

    pages.forEach(page => {
        let searchString = `${page.page} ${page.title} `;
        if ("blurb" in page) {
            searchString += page.blurb;
        }
        result.push([searchString.toLowerCase(), page]);
    });

    return result
}

async function search(query) {
    let pages = await getJson("index.json");
    let searchStrings = createSearchStrings(pages);
    let matches = [];

    await setPage("src/search.md");

    searchStrings.forEach(searchString => {
        if (searchString[0].toLowerCase().includes(query.toLowerCase())) {
            matches.push(searchString[1]);
        }
    });

    let resultContainer = document.querySelector("#wiki-searchResults ul");

    if (matches.length > 0) {
        resultContainer.innerHTML = "";
    }

    matches.forEach(page => {
        let pageItem = document.createElement("li");
        pageItem.innerHTML = `<h2><page-link href="/wiki/${page.page}">${page.title}</page-link></h2>`; 

        if ("blurb" in page) {
            let pageDescription = document.createElement("span");
            pageDescription.innerText = page.blurb;
            pageItem.appendChild(pageDescription);
        }
       
        resultContainer.appendChild(pageItem);
    });
}

let searchInput = document.querySelector("#search > input");
let searchButton = document.querySelector("#search > button");

searchButton.addEventListener("click", function () {
    search(searchInput.value);
});

// Adding keyup event listener to the password input
searchInput.addEventListener("keyup", function (event) {
    if (event.key == "Enter") {
        searchButton.click();
    }
});

// #region Special Pages

function specialPages() {
    let special = window.location.hash.split("#/wiki/Special:",2)[1]
    setSpecialPage(special)
}

async function setSpecialPage(special) {
    await setPage(`src/special/${special}.md`);

    let allScripts = document.getElementsByTagName("script");
    iterrHtml(allScripts, function (element) {
        if (element.src == `src/special/${special}.js`) {
            element.remove();
        }
    });

    let script = document.createElement("script");
    script.src = `src/special/${special}.js`;

    document.body.appendChild(script);
}

// #region Page Navigation

async function setPage(file) {
    let markdown;
    
    if (!config.LOCAL) {
        markdown = await getMarkdown(
            `https://raw.githubusercontent.com/${config.repo}/refs/heads/${config.branch}${file}`
        );
    } else {
        markdown = await getMarkdown(file);
    }

    readPage.innerHTML = markdown.html;
    markdownRaw.innerText = markdown.raw;

    currentPage = file;

    let metadata = markdown.meta;

    document.title = metadata.title;
    title.innerText = metadata.title;

    viewFileLink.href = `https://github.com/${config.repo}/tree/${config.branch}${currentPage}`;
    editFileLink.href = `https://github.com/${config.repo}/edit/${config.branch}${currentPage}`;

    switch (metadata.type) {
        case "no-title":
            document.body.className = "no-title";
            break;
        case "no-tabs":
            document.body.className = "no-tabs";
            break;
        default:
            document.body.removeAttribute("class");
            break;
    }
}

function loadPageFromHash() {
    fallbackHash();

    if (window.location.hash.startsWith("#/wiki/Special:")) {
        specialPages();
        return;
    }

    currentPage = window.location.hash.replace("#", "") + ".md";
    setPage(currentPage);
}

function fallbackHash() {
    switch (window.location.hash) {
        case "":
        case "#":
        case "#/":
        case "#/wiki":
        case "#/wiki/":
        case "#/wiki/Special":
        case "#/wiki/Special:":
            window.location.hash = "/wiki/Main_Page";
            return;
    }
}

window.onhashchange = loadPageFromHash;
window.onload = loadPageFromHash;

setTheme(config.theme)