// server.ts

import app from "./app";
import autoSyncBlockchain from "./scripts/auto-sync-blockchain";
import seedAdmin from "./scripts/seed-admin";
import { chatbotManager } from "./utils/chatbot-manager";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

  // Seed default admin
  await seedAdmin();

  // 1. Chatbot: Ingest knowledge and Start API
  try {
    await chatbotManager.runIngestion();
    chatbotManager.startChatbot();
  } catch (error) {
    console.error("🤖 [Chatbot] Failed to initialize chatbot:", error);
  }

  // 2. Blockchain: Auto-sync state after a short delay
  // This ensures Hardhat node is ready before attempting sync
  setTimeout(async () => {
    try {
      await autoSyncBlockchain();
    } catch (error) {
      console.error("⚠️  Auto-sync failed. You can manually sync using POST /api/blockchain/sync");
    }
  }, 3000); // 3 second delay
});