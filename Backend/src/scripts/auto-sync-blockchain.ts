import { PrismaClient } from "@prisma/client";
import * as blockchainService from "../services/blockchain.service";

const prisma = new PrismaClient();

/**
 * Auto-Sync Script
 * Runs automatically when backend starts to sync blockchain state
 */
async function autoSyncBlockchain() {
    try {
        console.log("\n🔄 [AUTO-SYNC] Starting blockchain state synchronization...\n");

        const sukuks = await prisma.sukuk.findMany({
            where: { status: 'active' },
            include: { property: true }
        });

        if (sukuks.length === 0) {
            console.log("✅ [AUTO-SYNC] No active sukuks found. Nothing to sync.\n");
            return;
        }

        console.log(`📋 [AUTO-SYNC] Found ${sukuks.length} active sukuk(s) to sync.\n`);

        for (const sukuk of sukuks) {
            const ownerWallet = await prisma.wallet.findFirst({
                where: { user_id: sukuk.property.owner_id, is_primary: true }
            });

            if (ownerWallet) {
                const partitionName = `Sukuk_Asset_${sukuk.property_id}`;
                console.log(`   🔧 Syncing: ${partitionName} (${sukuk.property.title})`);

                const success = await blockchainService.syncState(
                    partitionName,
                    ownerWallet.wallet_address,
                    sukuk.total_tokens.toString()
                );

                if (success) {
                    console.log(`   ✅ ${partitionName} synced successfully`);
                } else {
                    console.log(`   ❌ ${partitionName} sync failed`);
                }

                // Small delay to prevent nonce conflicts
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log(`   ⚠️  Sukuk_Asset_${sukuk.property_id}: No owner wallet found`);
            }
        }

        console.log("\n✅ [AUTO-SYNC] Blockchain synchronization complete!\n");

        // ============================================
        // STEP 2: Re-whitelist all approved investors
        // ============================================
        console.log("🔐 [AUTO-SYNC] Re-whitelisting approved investors...\n");

        const approvedUsers = await prisma.kYCRequest.findMany({
            where: { status: 'approved' },
            include: {
                user: {
                    include: {
                        wallets: { where: { is_primary: true } }
                    }
                }
            }
        });

        let whitelistedCount = 0;
        let skippedCount = 0;

        for (const kyc of approvedUsers) {
            const wallet = kyc.user.wallets[0];

            if (wallet) {
                try {
                    console.log(`   🔓 Whitelisting: ${kyc.user.name} (${wallet.wallet_address.slice(0, 10)}...)`);
                    await blockchainService.addToWhitelist(wallet.wallet_address);
                    whitelistedCount++;

                    // Small delay to prevent nonce conflicts
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error: any) {
                    // Ignore if already whitelisted
                    if (error.message.includes("already whitelisted")) {
                        console.log(`   ✓  Already whitelisted: ${kyc.user.name}`);
                        whitelistedCount++;
                    } else {
                        console.log(`   ⚠️  Failed to whitelist ${kyc.user.name}: ${error.message}`);
                    }
                }
            } else {
                console.log(`   ⏭️  Skipped ${kyc.user.name}: No wallet connected`);
                skippedCount++;
            }
        }

        console.log(`\n✅ [AUTO-SYNC] Whitelisted ${whitelistedCount} investor(s), skipped ${skippedCount}\n`);
        console.log("🎉 [AUTO-SYNC] Full blockchain state restoration complete!\n");

    } catch (error: any) {
        console.error("\n❌ [AUTO-SYNC] Sync failed:", error.message);
        console.error("   You can manually sync later using POST /api/blockchain/sync\n");
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    autoSyncBlockchain();
}

export default autoSyncBlockchain;
