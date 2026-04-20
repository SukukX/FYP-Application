// server.ts

import app from "./app";
import autoSyncBlockchain from "./scripts/auto-sync-blockchain";
import seedAdmin from "./scripts/seed-admin";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

  // Seed default admin
  await seedAdmin();

  // Auto-sync blockchain state after a short delay
  // This ensures Hardhat node is ready before attempting sync
  setTimeout(async () => {
    try {
      await autoSyncBlockchain();
    } catch (error) {
      console.error("⚠️  Auto-sync failed. You can manually sync using POST /api/blockchain/sync");
    }
  }, 3000); // 3 second delay
});