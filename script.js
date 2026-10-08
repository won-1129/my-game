document.querySelectorAll("button.game-button").forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!selected));
  });
});

const ideaSlides = Array.from(document.querySelectorAll("[data-idea-slide]"));
const previousIdeaButton = document.querySelector("#previous-idea");
const nextIdeaButton = document.querySelector("#next-idea");
const ideaCount = document.querySelector("#idea-count");
let currentIdea = 0;

function showIdea(index) {
  currentIdea = index;
  ideaSlides.forEach((slide, slideIndex) => {
    slide.hidden = slideIndex !== currentIdea;
  });
  ideaCount.textContent = `아이디어 ${currentIdea + 1} / ${ideaSlides.length}`;
  previousIdeaButton.disabled = currentIdea === 0;
  nextIdeaButton.disabled = currentIdea === ideaSlides.length - 1;
}

previousIdeaButton.addEventListener("click", () => {
  if (currentIdea > 0) {
    showIdea(currentIdea - 1);
  }
});

nextIdeaButton.addEventListener("click", () => {
  if (currentIdea < ideaSlides.length - 1) {
    showIdea(currentIdea + 1);
  }
});

showIdea(currentIdea);

const today = new Date();
const dateElement = document.querySelector("#today-date");
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

dateElement.dateTime = localDate;
dateElement.textContent = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
}).format(today);
