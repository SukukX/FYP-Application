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