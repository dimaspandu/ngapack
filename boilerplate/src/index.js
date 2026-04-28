import { greetingMessage } from "./assets/scripts/greetings.js";
import renderGreeting from "./assets/scripts/messenger.js";

const applicationRoot = document.getElementById("app");

if (!applicationRoot) {
  throw new Error('The application root element with id "app" was not found.');
}

renderGreeting(greetingMessage, applicationRoot);
