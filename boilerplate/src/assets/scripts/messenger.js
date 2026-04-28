/**
 * Render a greeting message into the provided container element.
 *
 * @param {string} messageText - Text content displayed to the user.
 * @param {HTMLElement} containerElement - Target element that receives the heading.
 */
export default function renderGreeting(messageText, containerElement) {
  const headingElement = document.createElement("h1");

  headingElement.textContent = messageText;
  containerElement.appendChild(headingElement);
}
