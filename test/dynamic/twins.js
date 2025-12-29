export default function twins(user) {
  if (user) {
    return `I'm used by ${user}!`;
  }
  return "I'm used by A and B!";
}