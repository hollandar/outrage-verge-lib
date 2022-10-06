import { ready } from "./ready.js"

class ScrollIntoView {
    elements: NodeListOf<Element>;
    windowHeight: number;

    constructor() {
        window.addEventListener('scroll', this.checkPosition);
        window.addEventListener('resize', this.init);
    }

    init = () => {
        this.elements = document.querySelectorAll('.lib-scroll-into-view');
        this.windowHeight = window.innerHeight;
    }

    checkPosition = () => {
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            var positionFromTop = this.elements[i].getBoundingClientRect().top;

            if (positionFromTop - this.windowHeight <= 0) {
                const animationClass = element.getAttribute("data-animation") ?? "lib-fade-in-element";
                element.classList.add(animationClass);
                element.classList.remove('lib-scroll-into-view');
            }
        }
    }

    static apply() {
        const scrollIntoView = new ScrollIntoView();
        scrollIntoView.init();
        scrollIntoView.checkPosition();
    }
}

ready(() => {
    ScrollIntoView.apply();
});