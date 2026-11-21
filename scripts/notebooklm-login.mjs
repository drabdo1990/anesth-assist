import { AuthManager } from "file:///C:/Users/moham/AppData/Roaming/npm/node_modules/notebooklm-mcp/dist/auth/auth-manager.js";

console.log("\n========================================================");
console.log("  Launching Google NotebookLM Login in Chrome...");
console.log("  Log in to your Google account in the Chrome window.");
console.log("  Once you reach NotebookLM, it will save and close.");
console.log("========================================================\n");

const auth = new AuthManager();
const success = await auth.performSetup(
  (msg, step, total) => console.log(`[Step ${step}/${total}] ${msg}`),
  true // visible browser window
);

if (success) {
  console.log("\n Authentication succeeded and saved to profile!");
} else {
  console.log("\n Authentication failed or timed out.");
}
