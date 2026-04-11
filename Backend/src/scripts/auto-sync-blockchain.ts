import prisma from '../config/prisma';

import * as blockchainService from "../services/blockchain.service";


// Helper function to force the script to pause and let Hardhat catch up
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

                let success = false;
                let retries = 3;

                while (retries > 0 && !success) {
                    try {
                        // STEP 1: Create Partition
                        try {
                            await blockchainService.createPartition(partitionName);
                            await delay(1500); // 🟢 Give Hardhat time to clear the mempool
                        } catch (e: any) {
                            if (!e.message.includes("already exists") && !e.message.includes("revert")) throw e;
                        }

                        // STEP 2: Check Balance
                        const balance = await blockchainService.getBalance(partitionName, ownerWallet.wallet_address);
                        
                        if (parseFloat(balance) === 0) {
                            // STEP 3: Whitelist Owner
                            try {
                                await blockchainService.addToWhitelist(ownerWallet.wallet_address);
                                await delay(1500); // 🟢 The crucial breath before issuing tokens!
                            } catch (e: any) {
                                if (!e.message.includes("already whitelisted") && !e.message.includes("revert")) throw e;
                            }

                            // STEP 4: Issue Tokens
                            await blockchainService.issueTokens(partitionName, ownerWallet.wallet_address, sukuk.total_tokens.toString());
                            await delay(1500); // 🟢 Give Hardhat time to settle
                        }
                        
                        console.log(`   ✅ ${partitionName} synced successfully`);
                        success = true;

                    } catch (err: any) {
                        retries--;
                        if (retries > 0) {
                            console.log(`   ⏳ Sync collision detected. Retrying in 3 seconds... (${retries} attempts left)`);
                            await delay(3000);
                        } else {
                            console.log(`   ❌ ${partitionName} sync failed: ${err.message}`);
                        }
                    }
                }
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
                let wRetries = 3;
                let wSuccess = false;

                while (wRetries > 0 && !wSuccess) {
                    try {
                        console.log(`   🔓 Whitelisting: ${kyc.user.name} (${wallet.wallet_address.slice(0, 10)}...)`);
                        await blockchainService.addToWhitelist(wallet.wallet_address);
                        
                        console.log(`   ✅ Whitelisted: ${kyc.user.name}`);
                        wSuccess = true;
                        whitelistedCount++;
                        
                        await delay(1500); // 🟢 1.5-second delay between successful whitelists
                    } catch (error: any) {
                        if (error.message.includes("already whitelisted") || error.message.includes("revert")) {
                            console.log(`   ✓  Already whitelisted: ${kyc.user.name}`);
                            wSuccess = true; 
                            whitelistedCount++;
                        } else {
                            wRetries--;
                            if (wRetries > 0) {
                                console.log(`   ⏳ Whitelist collision. Retrying in 3 seconds...`);
                                await delay(3000);
                            } else {
                                console.log(`   ⚠️  Failed to whitelist ${kyc.user.name}: ${error.message}`);
                            }
                        }
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