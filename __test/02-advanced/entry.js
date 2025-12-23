import { greetings } from "./message.js";

console.log(`[PASS => import { greetings } from "./message.js";]:`, greetings);

import("./services/rpc.js").then(({ getUser, updateUser }) => {
  const user = getUser("vegeta");

  updateUser(user, "power", 120000000000);
});

(async function() {
  const { getAMessage } = await import("./services/third-parties/messenger.js");
  console.log(getAMessage());

  const globalsSheet = await import("./styles/globals.css", {
    with: { type: "css" }
  });
  console.log(`[PASS => import globalsSheet from "./styles/globals.css" with { type: "css" };]:`, globalsSheet);

  const localGlobalsSheet = await import("https://www.mock.com/styles/globals.css", { with: { type: "css" } }).namespace("MainFrontend");
  console.log(`[PASS => import localGlobalsSheet from "https://www.mock.com/styles/globals.js" with { namespace: "MainFrontend" };]:]`, localGlobalsSheet);

  const somewhereMessage = await import("https://www.microfrontends.com/resources/somewhere.js").namespace("MicroFrontend");
  console.log(`[PASS => import somewhereMessage from "https://www.microfrontends.com/resources/somewhere.js" with { namespace: "MicroFrontend" };]:]`, somewhereMessage);
})();