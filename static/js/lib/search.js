import { ready } from "./ready.js";
class DocumentsDocument {
}
class DocumentsIndex {
}
class IndexDocument {
}
class WordOccurrences {
}
class DocumentOccurrence {
}
class SearchResultComponent extends HTMLElement {
    constructor() {
        super();
        this.templateId = "ou_search_template";
        this.attributeChangedCallback = (name, oldValue, newValue) => {
            switch (name) {
                case "href":
                    this.href = newValue;
                    break;
                case "title":
                    this.title = newValue;
                    break;
                case "description":
                    this.description = newValue;
                    break;
            }
            this.stateHasChanged();
        };
        this.template = document.getElementById(this.templateId);
    }
    static get observedAttributes() {
        return ["title", "description", "href"];
    }
    connectedCallback() {
        this.stateHasChanged();
    }
    stateHasChanged() {
        if (this.isConnected) {
            while (this.firstChild)
                this.removeChild(this.lastChild);
            let templateContent = this.template.content.cloneNode(true);
            let variables = new Map([
                ["href", this.href],
                ["title", this.title],
                ["description", this.description]
            ]);
            this.imprintVariables(templateContent, variables);
            this.append(templateContent);
        }
    }
    adaptedCallback() {
    }
    disconnectedCallback() {
    }
    get href() { return this.getAttribute("href").valueOf(); }
    set href(v) { this.setAttribute("href", v); }
    get title() { return this.getAttribute("title").valueOf(); }
    set title(v) { this.setAttribute("title", v); }
    get description() { return this.getAttribute("description").valueOf(); }
    set description(v) { this.setAttribute("description", v); }
    imprintVariables(node, variables) {
        for (let i = 0; i < node.childNodes.length; i++) {
            let child = node.childNodes[i];
            this.imprintVariables(child, variables);
            if (child instanceof HTMLElement) {
                let element = child;
                for (let j = 0; j < element.attributes.length; j++) {
                    let attribute = element.attributes[j];
                    attribute.value = this.replaceVariables(attribute.value, variables);
                }
            }
            if (child.nodeType == Node.TEXT_NODE) {
                child.textContent = this.replaceVariables(child.textContent, variables);
            }
        }
    }
    replaceVariables(input, variables) {
        let output = input;
        for (let [key, value] of variables.entries()) {
            const variable = `$(${key})`;
            while (output.indexOf(variable) > -1)
                output = output.replace(variable, value);
        }
        return output;
    }
}
class SearchHandler {
    constructor() {
        this.searchFormId = "search_form";
        this.searchResultsId = "search_results";
        this.searchTermsInputSelector = "[name=search_terms]";
        this.search = async (args) => {
            let form = args.target;
            let searchField = form.querySelector(this.searchTermsInputSelector);
            let searchValue = searchField.value;
            if (searchValue) {
                let terms = searchValue.toLowerCase().split(" ");
                let indexFiles = [];
                terms.forEach(term => {
                    let filename = `/static/index/${term[0]}.json`;
                    if (indexFiles.indexOf(filename) == -1) {
                        indexFiles.push(filename);
                    }
                });
                let searchResult = new Map();
                for (const filename of indexFiles) {
                    let indexRequest = await fetch(filename);
                    if (indexRequest.ok) {
                        let index = await indexRequest.json();
                        index.words.forEach(word => {
                            terms.forEach(term => {
                                const comparison = this.compare(word.w, term);
                                if (comparison > 0) {
                                    word.oc.forEach(oc => {
                                        const weight = (oc.o * 100) + comparison;
                                        if (searchResult.has(oc.d)) {
                                            searchResult.set(oc.d, searchResult.get(oc.d) + weight);
                                        }
                                        else {
                                            searchResult.set(oc.d, weight);
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
                var sortedArray = Array.from(searchResult.entries()).sort((a, b) => a[1] <= b[1] ? 1 : -1);
                searchResult = new Map(sortedArray);
                while (this.documentsElement.firstChild)
                    this.documentsElement.removeChild(this.documentsElement.lastChild);
                if (searchResult.size > 0) {
                    searchResult.forEach((value, key) => {
                        this.documents.documents.forEach(document => {
                            if (document.i == key) {
                                var searchResult = window.document.createElement("ou-search-result");
                                searchResult.setAttribute("title", document.t);
                                searchResult.setAttribute("description", document.d);
                                searchResult.setAttribute("href", document.u);
                                this.documentsElement.append(searchResult);
                            }
                        });
                    });
                }
                else {
                    var template = document.getElementById("ou_empty_results");
                    this.documentsElement.append(template.content.cloneNode(true));
                }
            }
        };
        this.compare = (value, withValue) => {
            if (value === withValue)
                return 8;
            if (value.startsWith(withValue))
                return 5;
            if (value.indexOf(withValue) != -1)
                return 3;
            return 0;
        };
    }
    static setup() {
        window.customElements.define("ou-search-result", SearchResultComponent);
        let handler = new SearchHandler();
        handler.attach();
    }
    async attach() {
        let searchForm = document.getElementById(this.searchFormId);
        searchForm.addEventListener("submit", (args) => {
            args.preventDefault();
            this.search(args);
        });
        this.documentsElement = document.getElementById(this.searchResultsId);
        let documentsResponse = await fetch("/static/index/documents.json");
        this.documents = await documentsResponse.json();
    }
}
ready(SearchHandler.setup);
//# sourceMappingURL=search.js.map