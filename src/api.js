async function getJson(url) {
    let result = {};
    await fetch(url)
        .then((response) => response.json())
        .then((data) => {
            result = data;
        });
    return result;
}

function getConfig() {
    let config = {};

    try {
        const request = new XMLHttpRequest();
        request.open("GET", "wiki.config.json", false);
        request.send();

        if (request.status === 200) {
            config = JSON.parse(request.responseText);
        } else {
            console.warn(
                "Config file not found or could not be loaded. Using fallback values..."
            );
            config = {
                repo: "JaegerwaldDev/W4SP",
                branch: "main",
                theme: "src/themes/wasp-yellow.css",
                logo: "img/wasp.png",
                logo_text: "img/wasp_text.png",
            };
        }
    } catch (error) {
        console.error("Error fetching config:", error);
        console.warn("Using fallback values...");
        config = {
            repo: "JaegerwaldDev/W4SP",
            branch: "main",
            theme: "src/themes/wasp-yellow.css",
            logo: "img/wasp.png",
            logo_text: "img/wasp_text.png",
        };
    }

    return config;
}

async function getMarkdown(url) {
    let result = {};
    await fetch(url)
        .then((response) => response.text())
        .then((data) => {
            result.raw = data;

            if (data.startsWith("---")) {
                const fmRegex = /^\s*---\s*([\s\S]*?)\s*---/;
                const match = data.match(fmRegex);
                let meta = {};
                if (match) {
                    const frontmatter = match[1];
                    frontmatter.split(/\r?\n/).forEach((line) => {
                        const kv = line.match(/^\s*(\w+)\s*:\s*(.+)\s*$/);
                        if (kv) {
                            const key = kv[1].toLowerCase();
                            if (["title", "type"].includes(key)) {
                                meta[key] = kv[2].trim();
                            }
                        }
                    });
                }
                if (!meta.title) {
                    const titleMatchPipe = data.match(/\|\s*title\s*\|\s*(.*?)\s*\|/i);
                    if (titleMatchPipe) {
                        meta.title = titleMatchPipe[1].trim();
                    } else {
                        const headerMatch = data.match(/^#\s*(.+)/m);
                        meta.title = headerMatch ? headerMatch[1].trim() : "Unknown Page (No Title)";
                    }
                }
                if (!meta.type) {
                    meta.type = "default";
                }
                const content = data.replace(fmRegex, "").trim();
                result.meta = meta;
                result.html = marked.parse(content);
            } else {
                result.meta = { title: "Unknown Page (No Title)", type: "default" };
                result.html = marked.parse(data);
            }
        });
    return result;
}

function iterrHtml(htmlCollection, iterrateFunc) {
    for (let i = 0; i < htmlCollection.length; i++) {
        iterrateFunc(htmlCollection[i]);
    }
}

function toObject(string) {
    result = {};
    string = string.replace(/\r/g, "");
    string.split("\n").forEach((line) => {
        line = line.split(": ");

        result[line[0]] = line[1];
    });
    return result;
}

function setGetCommits(page) {
    localStorage.setItem("lg|" + page, Date.now());
}
function canRefetchCommits(page) {
    let lastRefetched = localStorage.getItem("lg|" + page);
    if (lastRefetched == null) {
        localStorage.setItem("lg|" + page, 0);
        lastRefetched = localStorage.getItem("lg|" + page);
    }

    const currentTime = Date.now();
    return currentTime - lastRefetched >= 900000;
}
