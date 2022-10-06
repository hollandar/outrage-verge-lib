import { ready } from "./ready.js";
class ScrollIntoView {
    constructor() {
        this.init = () => {
            this.elements = document.querySelectorAll('.lib-scroll-into-view');
            this.windowHeight = window.innerHeight;
        };
        this.checkPosition = () => {
            var _a;
            for (var i = 0; i < this.elements.length; i++) {
                var element = this.elements[i];
                var positionFromTop = this.elements[i].getBoundingClientRect().top;
                if (positionFromTop - this.windowHeight <= 0) {
                    const animationClass = (_a = element.getAttribute("data-animation")) !== null && _a !== void 0 ? _a : "lib-fade-in-element";
                    element.classList.add(animationClass);
                    element.classList.remove('lib-scroll-into-view');
                }
            }
        };
        window.addEventListener('scroll', this.checkPosition);
        window.addEventListener('resize', this.init);
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
//# sourceMappingURL=scrollIntoView.js.map