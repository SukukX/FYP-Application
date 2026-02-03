import { sukukContract, wallet } from "../config/blockchain";
import { ethers } from "ethers";



export const createPartition = async (partitionName: string) => {
    const tx = await sukukContract.createPartition(partitionName);
    await tx.wait();
    return tx.hash;
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

    const tx = await sukukContract.issueByPartition(
        partitionId,
        investorWallet,
        ethers.parseUnits(amount, 18)
    );

    await tx.wait();
    return tx.hash;
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
    const tx = await sukukContract.addToWhitelist(walletAddress);
    await tx.wait();
    return tx.hash;
};


export const transferTokens = async (
    partitionName: string,
    fromWallet: string,
    toWallet: string,
    amount: string
) => {
    const partitionId = ethers.keccak256(ethers.toUtf8Bytes(partitionName));

    // Uses the "Operator" function we added to the Smart Contract
    const tx = await sukukContract.operatorTransferByPartition(
        partitionId,
        fromWallet,
        toWallet,
        ethers.parseUnits(amount, 18)
    );

    await tx.wait();
    return tx.hash;
};