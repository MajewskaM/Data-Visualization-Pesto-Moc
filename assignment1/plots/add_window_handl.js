const openModalButtons = document.querySelectorAll(".openExplWindow");
const closeButtons = document.querySelectorAll(".close-btn");

openModalButtons.forEach(button => {
    button.onclick = function() {
        const windowId = this.getAttribute("data-modal");
        const window = document.getElementById(windowId);
        window.style.display = "block";
    }
});

closeButtons.forEach(button => {
    button.onclick = function() {
        const window = this.closest(".additional_window");
        window.style.display = "none";
    }
});