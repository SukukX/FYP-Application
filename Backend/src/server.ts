// server.ts

import app from "./app";
import autoSyncBlockchain from "./scripts/auto-sync-blockchain";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

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