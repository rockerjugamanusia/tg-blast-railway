import "dotenv/config";
import { createBot } from "./bot.js";
import { createDashboard } from "./dashboard.js";

const bot = createBot();

// polling mode
await bot.launch({
  dropPendingUpdates: true
});

console.log("✅ Bot polling berjalan");

// Railway butuh listen PORT supaya service dianggap hidup
const PORT = Number(process.env.PORT || 3000);
const app = createDashboard(bot);

app.listen(PORT, () => {
  console.log(`✅ Dashboard hidup di port ${PORT}`);
  console.log("Buka: https://<domain-railway>/?key=ADMIN_KEY");
});

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
