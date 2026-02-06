import cron from "node-cron";

export function setupBlastWorker(bot) {
  cron.schedule("*/1 * * * *", () => {
    console.log("🟢 Blast worker alive");
  }, { timezone: "Asia/Jakarta" });
}
