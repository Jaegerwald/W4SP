async function special_wikiContents() {
    let list = document.querySelector("#wiki-contents ul");
    let pages = await getJson("index.json");

    for (let page of pages) {
        let pageItem = document.createElement("li");
        pageItem.innerHTML = `<h2><page-link href="/wiki/${page.page}">${page.title}</page-link></h2>`; 

        if ("blurb" in page) {
            let pageDescription = document.createElement("span");
            pageDescription.innerText = page.blurb;
            pageItem.appendChild(pageDescription);
        }
       
        list.appendChild(pageItem);
    }
}
special_wikiContents();