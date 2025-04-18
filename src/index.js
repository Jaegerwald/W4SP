console.log(
    "%cthere is no wasp emoji 😢 🐝",
    "color: #fd0; font-size: 32pt; font-weight: 800; font-family: monospace;"
);

let tabs = document.getElementsByClassName("tab");
let page = document.getElementById("page");
let pages = document.getElementsByClassName("page");
let title = document.getElementById("title");
let sidebar = document.getElementById("sidebar");

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

setTheme(config.theme);

let logo = document.getElementById("logo")
logo.src = config.logo
let logoTexts = document.querySelectorAll("img.logoText");
logoTexts.forEach(img => {
    img.src = config.logo_text
})

// #region Sidebar Loading

if ("sections" in config.sidebar) {
    config.sidebar.sections.forEach((section) => {
        let sectionDivider = document.createElement("hr");
        let sectionContainer = document.createElement("p");

        let sectionTitle = document.createElement("b");
        sectionTitle.innerText = section.title;
        sectionContainer.appendChild(sectionTitle);

        let sectionList = document.createElement("ul");

        section.links.forEach((link) => {
            let sectionListItem = document.createElement("li");
            if ("page" in link && link.page) {
                let linkElement = `<page-link href="${link.link}">${link.name}</page-link>`
                sectionListItem.innerHTML = linkElement;
                sectionList.appendChild(sectionListItem);
            } else {
                let linkElement = document.createElement("a");
                linkElement.href = link.link;
                sectionListItem.appendChild(linkElement);
                sectionList.appendChild(sectionListItem);
            }
        });

        sectionContainer.appendChild(sectionList);
        sidebar.appendChild(sectionDivider);
        sidebar.appendChild(sectionContainer);
    });
}

if ("links" in config.sidebar) {
    let linksDivider = document.createElement("hr");
    let linksContainer = document.createElement("p");
    let links = [];

    config.sidebar.links.forEach((link) => {
        let linkElement = `<a href="${link.link}">${link.name}</a>`;
        links.push(linkElement);
    });

    linksContainer.innerHTML = links.join(" • ");

    sidebar.appendChild(linksDivider);
    sidebar.appendChild(linksContainer);
}

if ("footer" in config.sidebar) {
    let footerDivider = document.createElement("hr");
    let footer = document.createElement("p");
    footer.innerHTML = config.sidebar.footer;

    sidebar.appendChild(footerDivider);
    sidebar.appendChild(footer);
}

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
    if (query == "") {
        setSpecialPage("Contents");
        return;
    }

    let pages = await getJson("index.json");
    let searchStrings = createSearchStrings(pages);

    await setPage("/src/search.md");

    const data = searchStrings.map(([name, value]) => ({
        name,
        value
    }));
    
    const fuse = new Fuse(data, {
        keys: ["name"],
        includeScore: false,
        threshold: 0.4
    });
    
    const results = fuse.search(query);
    const matches = results.map(result => result.item.value);

    let resultContainer = document.querySelector("#wiki-searchResults ul");
    let resultInfo = document.querySelector("#wiki-searchResults #info");

    document.title = `Search results for "${query}"`;

    if (matches.length > 0 && matches.length < 2) {
        resultInfo.innerText = `1 result for "${query}"`;
    } else if (matches.length > 1) {
        resultInfo.innerText = `${matches.length} results for "${query}"`;
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
    window.location.hash = "#/search/" + searchInput.value;
});

// Adding keyup event listener to the password input
searchInput.addEventListener("keyup", function (event) {
    if (event.key == "Enter") {
        searchButton.click();
    }
});

// #region Special Pages

async function setSpecialPage(special) {
    await setPage(`/src/special/${special}.md`);

    let allScripts = document.getElementsByTagName("script");
    iterrHtml(allScripts, function (element) {
        if (element.src.includes(`src/special/${special}.js`)) {
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
        setSpecialPage(window.location.hash.split("#/wiki/Special:",2)[1]);
        return;
    }
    if (window.location.hash.startsWith("#/search/")) {
        search(decodeURIComponent(window.location.hash.split("#/search/", 2)[1]));
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
        case "#/search":
            window.location.hash = "/wiki/Main_Page";
            return;
    }
}

window.onhashchange = loadPageFromHash;
window.onload = loadPageFromHash;