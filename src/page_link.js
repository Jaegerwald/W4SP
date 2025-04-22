class PageLink extends HTMLElement {
    constructor() {
        super();

        this.addEventListener("click", function() {
            window.location.hash = this.getAttribute("href") || "/wiki/Main_page";
            let tabs = document.getElementsByClassName("tab");
            for (let element of tabs) {
                element.className = "tab";
            }
            document.getElementById("tabRead").className = "tab active";
            let pages = document.getElementsByClassName("page");
            for (let element of pages) {
                element.className = "page";
            }
            document.getElementById("pageRead").className = "page active";
        });
    };
};

customElements.define("page-link", PageLink);