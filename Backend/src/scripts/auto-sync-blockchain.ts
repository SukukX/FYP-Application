import prisma from '../config/prisma';
import * as blockchainService from "../services/blockchain.service";

async function autoSyncBlockchain() {
    try {
        console.log("\n🔄 [AUTO-SYNC] Starting smart state restoration...\n");

        // ==========================================
        // STEP 1: Gather & Deduplicate State
        // ==========================================
        const sukuks = await prisma.sukuk.findMany({
            include: { property: { include: { owner: { include: { wallets: { where: { is_primary: true } } } } } } }
        });

        const investments = await prisma.investment.findMany({
            include: { 
                sukuk: { include: { property: { include: { owner: { include: { wallets: { where: { is_primary: true } } } } } } } },
                investor: { include: { wallets: { where: { is_primary: true } } } }
            }
        });

        // Using Sets to guarantee we never send duplicate transactions
        const uniquePartitions = new Set<string>();
        const uniqueWalletsToWhitelist = new Set<string>();
        const pendingIssuances = new Map<string, { address: string, amount: number }>();

        // Map Owners
        sukuks.forEach(s => {
            const ownerWallet = s.property.owner.wallets[0]?.wallet_address;
            if (!ownerWallet) return;

            const partition = `Sukuk_Asset_${s.property_id}`;
            uniquePartitions.add(partition);
            uniqueWalletsToWhitelist.add(ownerWallet);
            pendingIssuances.set(partition, { address: ownerWallet, amount: s.total_tokens });
        });

        // Map Investors
        investments.forEach(inv => {
            const invWallet = inv.investor.wallets[0]?.wallet_address;
            if (invWallet) uniqueWalletsToWhitelist.add(invWallet);
        });

        // ==========================================
        // STEP 2: Execute Phases Sequentially
        // ==========================================

        // PHASE 1: Whitelist (Done once per unique address)
        console.log(`🛡️  Checking Whitelists (${uniqueWalletsToWhitelist.size} unique identities)...`);
        for (const address of uniqueWalletsToWhitelist) {
            try {
                await blockchainService.addToWhitelist(address);
                console.log(`   ✅ Whitelisted: ${address}`);
                await new Promise(r => setTimeout(r, 500));
            } catch (e: any) {
                const msg: string = e?.info?.error?.message || e.message || '';
                if (msg.toLowerCase().includes('already whitelisted') || msg.includes('revert')) {
                    console.log(`   ℹ️  Already whitelisted: ${address}`);
                } else {
                    console.error(`   ❌ Whitelist failed for ${address}:`, msg);
                }
            }
        }

        // PHASE 2: Partitions
        console.log(`\n📦 Checking Partitions (${uniquePartitions.size} unique assets)...`);
        for (const partition of uniquePartitions) {
            try {
                await blockchainService.createPartition(partition);
                console.log(`   ✅ Created Partition: ${partition}`);
                await new Promise(r => setTimeout(r, 500));
            } catch (e: any) {
                const msg: string = e?.info?.error?.message || e.message || '';
                if (msg.includes('Partition already exists') || msg.includes('revert')) {
                    console.log(`   ℹ️  Partition already exists: ${partition}`);
                } else {
                    console.error(`   ❌ Partition creation failed for ${partition}:`, msg);
                }
            }
        }

        // PHASE 3: Initial Token Issuance
        console.log(`\n💎 Checking Initial Supply...`);
        for (const [partition, data] of pendingIssuances.entries()) {
            const bal = await blockchainService.getBalance(partition, data.address);
            
            // Only issue if the owner has 0 balance to prevent double-minting
            if (parseFloat(bal) === 0) {
                try {
                    await blockchainService.issueTokens(partition, data.address, data.amount.toString());
                    console.log(`   ✅ Issued ${data.amount} tokens for ${partition}`);
                    await new Promise(r => setTimeout(r, 500));
                } catch (e: any) {
                    console.log(`   ❌ Issue failed for ${partition}:`, e.shortMessage || e.message);
                }
            }
        }

        // PHASE 4: Restore Investor Holdings
        console.log(`\n🔗 Reconciling Investor Portfolios...`);
        for (const inv of investments) {
            const investorWallet = inv.investor.wallets[0]?.wallet_address;
            const ownerWallet = inv.sukuk.property.owner.wallets[0]?.wallet_address;
            const ownerId = inv.sukuk.property.owner_id;
            
            // Skip if the investor is the owner (they already got their supply in Phase 3)
            if (!investorWallet || !ownerWallet || inv.investor_id === ownerId) continue;

            const partition = `Sukuk_Asset_${inv.sukuk.property_id}`;
            const onChainBal = await blockchainService.getBalance(partition, investorWallet);

            // Only transfer if they are missing their tokens on-chain
            if (parseFloat(onChainBal) === 0 && inv.tokens_owned > 0) {
                try {
                    await blockchainService.transferTokens(partition, ownerWallet, investorWallet, inv.tokens_owned.toString());
                    console.log(`   ✅ Restored ${inv.tokens_owned} tokens for ${inv.investor.name}`);
                    await new Promise(r => setTimeout(r, 500));
                } catch (e: any) {
                    console.log(`   ⚠️ Failed transfer to ${inv.investor.name}:`, e.shortMessage || e.message);
                }
            }
        }

        console.log("\n🎉 [AUTO-SYNC] System is fully synchronized and ready!\n");

    } catch (error: any) {
        console.error("\n❌ [AUTO-SYNC] Fatal Sync Error:", error.message);
    }
}

export default autoSyncBlockchain;