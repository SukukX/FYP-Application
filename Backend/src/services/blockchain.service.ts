import { sukukContract, wallet } from "../config/blockchain";
import { ethers } from "ethers";
import { blockchainLogger } from "../utils/logger";

export const createPartition = async (partitionName: string) => {
    blockchainLogger.info(`[Create Partition] Request for: ${partitionName}`);
    try {
        const tx = await sukukContract.createPartition(partitionName);
        blockchainLogger.info(`[Create Partition] Tx Sent: ${tx.hash}`);
        await tx.wait();
        blockchainLogger.info(`[Create Partition] Confirmed: ${partitionName}`);
        return tx.hash;
    } catch (error: any) {
        blockchainLogger.error(`[Create Partition] Failed: ${error.message}`);
        throw error;
    }
};

export const getPartitions = async () => {
    return await sukukContract.getAllPartitions();
};

export const issueTokens = async (
    partitionName: string,
    investorWallet: string,
    amount: string
) => {
    const partitionId = ethers.keccak256(
        ethers.toUtf8Bytes(partitionName)
    );

    blockchainLogger.info(`[Issue Tokens] Partition: ${partitionName}, To: ${investorWallet}, Amount: ${amount}`);

    try {
        const tx = await sukukContract.issueByPartition(
            partitionId,
            investorWallet,
            ethers.parseUnits(amount, 18)
        );
        blockchainLogger.info(`[Issue Tokens] Tx Sent: ${tx.hash}`);

        await tx.wait();
        blockchainLogger.info(`[Issue Tokens] Confirmed.`);
        return tx.hash;
    } catch (error: any) {
        blockchainLogger.error(`[Issue Tokens] Failed: ${error.message}`);
        throw error;
    }
};

export const getBalance = async (
    partitionName: string,
    wallet: string
) => {
    const partitionId = ethers.keccak256(
        ethers.toUtf8Bytes(partitionName)
    );

    const balance = await sukukContract.balanceOfByPartition(
        partitionId,
        wallet
    );

    return ethers.formatUnits(balance, 18);
};

/**
 * Regulator action
 */
export const addToWhitelist = async (walletAddress: string) => {
    blockchainLogger.info(`[Whitelist] Adding: ${walletAddress}`);
    try {
        const tx = await sukukContract.addToWhitelist(walletAddress);
        blockchainLogger.info(`[Whitelist] Tx Sent: ${tx.hash}`);
        await tx.wait();
        blockchainLogger.info(`[Whitelist] Confirmed.`);
        return tx.hash;
    } catch (error: any) {
        blockchainLogger.error(`[Whitelist] Failed: ${error.message}`);
        throw error;
    }
};


export const transferTokens = async (
    partitionName: string,
    fromWallet: string,
    toWallet: string,
    amount: string
) => {
    const partitionId = ethers.keccak256(ethers.toUtf8Bytes(partitionName));

    blockchainLogger.info(`[Transfer] ${amount} from ${fromWallet} to ${toWallet} (Partition: ${partitionName})`);

    try {
        // Uses the "Operator" function we added to the Smart Contract
        const tx = await sukukContract.operatorTransferByPartition(
            partitionId,
            fromWallet,
            toWallet,
            ethers.parseUnits(amount, 18)
        );
        blockchainLogger.info(`[Transfer] Tx Sent: ${tx.hash}`);

        await tx.wait();
        blockchainLogger.info(`[Transfer] Confirmed.`);
        return tx.hash;
    } catch (error: any) {
        blockchainLogger.error(`[Transfer] Failed: ${error.message}`);
        throw error;
    }
};

/**
 * [DEV TOOL] Sync State
 * Re-creates partition and re-issues tokens if blockchain was reset.
 * This is needed because Hardhat local node is ephemeral.
 */
export const syncState = async (
    partitionName: string,
    ownerWallet: string,
    totalAmount: string
) => {
    blockchainLogger.info(`[Sync] Checking partition: ${partitionName}`);
    try {
        // Try to create partition (will fail if exists, which is fine)
        try {
            await createPartition(partitionName);
            blockchainLogger.info(`[Sync] Partition ${partitionName} created.`);
        } catch (e: any) {
            const errorMessage = e?.info?.error?.message || e.message || JSON.stringify(e);
            if (errorMessage.includes("Partition already exists") || errorMessage.includes("revert")) {
                blockchainLogger.info(`[Sync] Partition ${partitionName} already exists.`);
            } else {
                blockchainLogger.info(`[Sync] Create Partition info: ${e.message}`);
            }
        }

        // Check owner balance. If 0, re-issue tokens
        const balance = await getBalance(partitionName, ownerWallet);
        if (parseFloat(balance) === 0) {
            blockchainLogger.info(`[Sync] Owner balance is 0. Re-issuing ${totalAmount} tokens.`);

            // Whitelist owner first
            try {
                await addToWhitelist(ownerWallet);
            } catch (e: any) {
                blockchainLogger.info(`[Sync] Whitelist: ${e.message}`);
            }

            await issueTokens(partitionName, ownerWallet, totalAmount);
        } else {
            blockchainLogger.info(`[Sync] Owner has balance ${balance}. Skipping issuance.`);
        }

        return true;
    } catch (error: any) {
        blockchainLogger.error(`[Sync] Failed: ${error.message}`);
        return false;
    }
};