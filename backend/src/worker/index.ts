import { env, hasLuluCredentials } from "../env.js";
import { workerTick } from "./process-print-job.js";

env();

const POLL_MS = 2_000;

console.log(
  hasLuluCredentials()
    ? "mintmark worker started"
    : "mintmark worker started (Lulu not configured; print jobs idle)",
)

let running = false;

async function loop() {
  if (running) return;
  running = true;
  try {
    await workerTick();
  } catch (err) {
    console.error("worker tick failed", err);
  } finally {
    running = false;
  }
}

await loop();
const timer = setInterval(() => {
  void loop();
}, POLL_MS);

function shutdown() {
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
