import { enableTooltips } from "/assets/js/jquery.style-my-tooltips.js";

document.addEventListener("DOMContentLoaded", () => {
  enableTooltips({
    tipFollowsCursor: true,
    tipDelay: 0,
    tipFadeSpeed: 0,
    attribute: "title",
  });
});
