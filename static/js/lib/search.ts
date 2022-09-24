import { ready } from "./ready.js";

class DocumentsDocument {
    documents: DocumentsIndex[];
}

class DocumentsIndex {
    i: number; // documentIndex
    u: string; // uri
    t: string; // title
    d: string; // description
}

class IndexDocument {
    words: WordOccurrences[]; // words 
}

class WordOccurrences {
    w: string; // word
    oc: DocumentOccurrence[]; // occurrences
}

class DocumentOccurrence {
    d: number; // documentIndex
    o: number; // occurrences
}

class SearchResultComponent extends HTMLElement {

    templateId: string = "ou_search_template";

    template: HTMLTemplateElement;
    static get observedAttributes() {
        return ["title", "description", "href"];
    }

    constructor() {
        super();
        this.template = document.getElementById(this.templateId) as HTMLTemplateElement;
    }

    connectedCallback() {
        this.stateHasChanged();
    }

    stateHasChanged() {
        if (this.isConnected) {
            while (this.firstChild) this.removeChild(this.lastChild);
            let templateContent = this.template.content.cloneNode(true);
            let variables: Map<string, string> = new Map<string, string>([
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

    get href(): string { return this.getAttribute("href").valueOf(); }
    set href(v: string) { this.setAttribute("href", v); }
    get title(): string { return this.getAttribute("title").valueOf(); }
    set title(v: string) { this.setAttribute("title", v); }
    get description(): string { return this.getAttribute("description").valueOf(); }
    set description(v: string) { this.setAttribute("description", v); }

    attributeChangedCallback = (name, oldValue, newValue) => {
        switch (name) {
            case "href": this.href = newValue; break;
            case "title": this.title = newValue; break;
            case "description": this.description = newValue; break;
        }
        this.stateHasChanged();
    }

    imprintVariables(node: Node, variables: Map<string, string>) {
        for (let i = 0; i < node.childNodes.length; i++) {
            let child: Node = node.childNodes[i];
            this.imprintVariables(child, variables);
            if (child instanceof HTMLElement) {
                let element: HTMLElement = child as HTMLElement;
                for (let j = 0; j < element.attributes.length; j++) {
                    let attribute: Attr = element.attributes[j];
                    attribute.value = this.replaceVariables(attribute.value, variables);
                }

            }
            if (child.nodeType == Node.TEXT_NODE) {
                child.textContent = this.replaceVariables(child.textContent, variables);
            }
        }
    }

    replaceVariables(input: string, variables: Map<string, string>): string {
        let output = input;
        for (let [key, value] of variables.entries()) {
            const variable = `$(${key})`;
            while (output.indexOf(variable) > -1) output = output.replace(variable, value);
        }

        return output;
    }
}

class SearchHandler {

    searchFormId: string = "search_form";
    searchResultsId: string = "search_results";
    searchTermsInputSelector: string = "[name=search_terms]";

    documents: DocumentsDocument;
    documentsElement: HTMLDivElement;
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
        this.documentsElement = document.getElementById(this.searchResultsId) as HTMLDivElement;
        let documentsResponse = await fetch("/static/index/documents.json");

        this.documents = await documentsResponse.json();
    }

    search = async (args: SubmitEvent) => {
        let form = args.target as HTMLFormElement;
        let searchField = form.querySelector(this.searchTermsInputSelector) as HTMLInputElement;
        let searchValue = searchField.value;

        if (searchValue) {
            let terms = searchValue.toLowerCase().split(" ");

            let indexFiles: string[] = []
            terms.forEach(term => {
                let filename = `/static/index/${term[0]}.json`;
                if (indexFiles.indexOf(filename) == -1) {
                    indexFiles.push(filename);
                }
            });

            let searchResult: Map<number, number> = new Map<number, number>();
            for (const filename of indexFiles) {
                let indexRequest = await fetch(filename);
                if (indexRequest.ok) {
                    let index: IndexDocument = await indexRequest.json();
                    index.words.forEach(word => {
                        terms.forEach(term => {
                            const comparison = this.compare(word.w, term);
                            if (comparison > 0) {
                                word.oc.forEach(oc => {
                                    const weight = (oc.o * 100) + comparison;
                                    if (searchResult.has(oc.d)) {
                                        searchResult.set(oc.d, searchResult.get(oc.d) + weight);
                                    } else {
                                        searchResult.set(oc.d, weight);
                                    }
                                });
                            }
                        });
                    });
                }
            }

            var sortedArray = Array.from(searchResult.entries()).sort((a, b) => a[1] <= b[1] ? 1 : -1);
            searchResult = new Map<number, number>(sortedArray);

            while (this.documentsElement.firstChild) this.documentsElement.removeChild(this.documentsElement.lastChild);
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
            } else {
                var template = document.getElementById("ou_empty_results") as HTMLTemplateElement;
                this.documentsElement.append(template.content.cloneNode(true));
            }
        }
    }

    compare = (value: string, withValue: string): number => {
        if (value === withValue) return 8;
        if (value.startsWith(withValue)) return 5;
        if (value.indexOf(withValue) != -1) return 3;
        return 0;
    }
}

ready(SearchHandler.setup);