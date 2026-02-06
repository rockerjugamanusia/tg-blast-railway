// src/blast.js
export function setupBlastCommands(bot) {
  const ADMIN_ID = Number(process.env.ADMIN_ID || 0);

  function isAdmin(ctx) {
    if (!ADMIN_ID) return true; // kalau ADMIN_ID kosong, semua boleh (opsional)
    return ctx.from?.id === ADMIN_ID;
  }

  // /start
  bot.start(async (ctx) => {
    await ctx.reply(
      "✅ Bot Blast Aktif.\n\nPerintah:\n/blast <chat_id> <pesan>\n/blastall <pesan>\n\nContoh:\n/blast -1001234567890 Halo semua"
    );
  });

  // /blast <chat_id> <pesan>
  bot.command("blast", async (ctx) => {
    try {
      if (!isAdmin(ctx)) return;

      const text = ctx.message?.text || "";
      const parts = text.split(" ");
      const chatId = parts[1];
      const msg = parts.slice(2).join(" ").trim();

      if (!chatId || !msg) {
        return ctx.reply("Format salah.\n/blast <chat_id> <pesan>");
      }

      await bot.telegram.sendMessage(chatId, msg);
      await ctx.reply("✅ Terkirim.");
    } catch (e) {
      await ctx.reply("❌ Gagal: " + (e?.message || String(e)));
    }
  });

  // /blastall <pesan>  (dummy: nanti sambung DB list target)
  bot.command("blastall", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const text = ctx.message?.text || "";
    const msg = text.replace("/blastall", "").trim();
    if (!msg) return ctx.reply("Format salah.\n/blastall <pesan>");

    // TODO: Ambil list chat_id dari DB
    return ctx.reply("⚠️ blastall belum disambung ke database target.\nTapi command sudah hidup.");
  });
}
