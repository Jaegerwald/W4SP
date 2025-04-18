async function special_wikiRandom() {
    let pages = await getJson("index.json");

    let page = pages[Math.floor(Math.random() * pages.length)];
    window.location.hash = "#/wiki/" + page.page;
}
special_wikiRandom();