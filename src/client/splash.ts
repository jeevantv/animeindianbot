import { context, navigateTo } from "@devvit/web/client";

const startButton = document.getElementById("start-button") as HTMLButtonElement;
const docsLink = document.getElementById("docs-link") as HTMLAnchorElement;
const playtestLink = document.getElementById("playtest-link") as HTMLAnchorElement;
const discordLink = document.getElementById("discord-link") as HTMLAnchorElement;

startButton.addEventListener("click", () => {
  alert("Ready to explore the Anime Indian Bot!");
});

docsLink.addEventListener("click", () => {
  navigateTo("https://developers.reddit.com/docs");
});

playtestLink.addEventListener("click", () => {
  navigateTo("https://www.reddit.com/r/Devvit");
});

discordLink.addEventListener("click", () => {
  navigateTo("https://discord.com/invite/R7yu2wh9Qz");
});

const titleElement = document.getElementById("title") as HTMLHeadingElement;

function init() {
  titleElement.textContent = `Hey ${context.username ?? "user"} 👋`;
}

init();
