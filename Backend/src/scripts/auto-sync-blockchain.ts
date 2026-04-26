import prisma from '../config/prisma';
import * as blockchainService from "../services/blockchain.service";
import { ethers } from "ethers";
import { provider } from "../config/blockchain";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * [HELPER] Faucet: Ensures demo users have ETH for gas
 */
async function fundWalletIfEmpty(address: string, name: string) {
    try {
        const balance = await provider.getBalance(address);
        const ethBalance = ethers.formatEther(balance);

        if (parseFloat(ethBalance) < 1.0) {
            console.log(`   💰 [FAUCET] Funding ${name}: ${ethBalance} ETH -> 5.0 ETH`);
            const signer = await provider.getSigner(0); 
            const tx = await signer.sendTransaction({
                to: address,
                value: ethers.parseEther("5.0")
            });
            await tx.wait();
            console.log(`   ✅ [FAUCET] Sent 5 ETH to ${name}`);
            await delay(1000);
        } else {
            console.log(`   ✓  [FAUCET] ${name} already has ${parseFloat(ethBalance).toFixed(2)} ETH`);
        }
    } catch (err: any) {
        console.error(`   ⚠️  [FAUCET] Could not fund ${name}:`, err.message);
    }
}

async function autoSyncBlockchain() {
    try {
        console.log("\n🔄 [AUTO-SYNC] Starting full state restoration...\n");

        // STEP 1: Sync Properties & Mint to Owners
        // FIX: Using snake_case 'wallets' as per your Prisma generated types
        const sukuks = await prisma.sukuk.findMany({
            include: { 
                property: { 
                    include: { 
                        owner: { 
                            include: { wallets: { where: { is_primary: true } } } 
                        } 
                    } 
                } 
            }
        });

        for (const sukuk of sukuks) {
            const ownerWallet = sukuk.property.owner.wallets[0];
            if (!ownerWallet) continue;

            const partitionName = `Sukuk_Asset_${sukuk.property_id}`;
            console.log(`   🔧 Property: ${sukuk.property.title}`);
            
            try {
                try { await blockchainService.createPartition(partitionName); } catch (e) {}
                try { await blockchainService.addToWhitelist(ownerWallet.wallet_address); } catch (e) {}

                const balance = await blockchainService.getBalance(partitionName, ownerWallet.wallet_address);
                if (parseFloat(balance) === 0) {
                    await blockchainService.issueTokens(partitionName, ownerWallet.wallet_address, sukuk.total_tokens.toString());
                    console.log(`      ✅ Total tokens minted to owner.`);
                }
            } catch (err: any) { 
                console.log(`      ❌ Property sync failed: ${err.message}`); 
            }
        }

        // STEP 2: Restore Gas & Whitelist Investors
        // FIX: Relation name is likely 'kyc_request' in your schema
        const investors = await prisma.user.findMany({
            where: { kyc_request: { status: 'approved' } },
            include: { wallets: { where: { is_primary: true } } }
        });

        for (const inv of investors) {
            const wallet = inv.wallets[0];
            if (wallet) {
                await fundWalletIfEmpty(wallet.wallet_address, inv.name);
                try { await blockchainService.addToWhitelist(wallet.wallet_address); } catch (e) {}
            }
        }

        // STEP 3: Restore Individual Token Holdings
        console.log("\n📈 [AUTO-SYNC] Restoring Token Holdings from Database...\n");

        const allInvestments = await prisma.investment.findMany({
            include: { 
                sukuk: { include: { property: { include: { owner: { include: { wallets: { where: { is_primary: true } } } } } } } },
                investor: { include: { wallets: { where: { is_primary: true } } } }
            }
        });

        for (const inv of allInvestments) {
            const investorWallet = inv.investor.wallets[0]?.wallet_address;
            const ownerWalletObj = inv.sukuk.property.owner.wallets[0];
            
            if (!investorWallet || !ownerWalletObj) continue;

            const propertyId = inv.sukuk.property_id;
            const ownerId = inv.sukuk.property.owner_id;

            if (inv.investor_id === ownerId) continue;

            const partitionName = `Sukuk_Asset_${propertyId}`;
            const onChainBal = await blockchainService.getBalance(partitionName, investorWallet);

            if (parseFloat(onChainBal) === 0 && inv.tokens_owned > 0) {
                console.log(`   🔗 Restoring ${inv.tokens_owned} tokens for ${inv.investor.name}...`);
                
                try {
                    await blockchainService.transferTokens(
                        partitionName,
                        ownerWalletObj.wallet_address, 
                        investorWallet,
                        inv.tokens_owned.toString()
                    );
                    console.log(`      ✅ Restored.`);
                } catch (transferErr: any) {
                    console.log(`      ⚠️  Could not restore tokens for ${inv.investor.name}: ${transferErr.shortMessage || transferErr.message}`);
                }
                
                await delay(2000); // 🟢 Increased delay to 2 seconds to let the local chain breathe
            }
        }

        console.log("\n🎉 [AUTO-SYNC] System is fully synchronized and ready!\n");

    } catch (error: any) {
        console.error("\n❌ [AUTO-SYNC] Sync failed:", error.message);
    }
}

export default autoSyncBlockchain;