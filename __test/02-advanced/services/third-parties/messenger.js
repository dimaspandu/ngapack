export function getAMessage() {
  import("../brokers/subscriber.js").then(({ getAMessage }) => {
    console.log(getAMessage());
  });

  return "[PASS => getAMessage from services/third-parties/messenger.js]: I'm a third party!";
}