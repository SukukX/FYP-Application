import { ethers } from "ethers";
import SmartSukukArtifact from "../blockchain-artifacts/SmartSukukToken.json";

export const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

export const wallet = new ethers.Wallet(
    process.env.BLOCKCHAIN_PRIVATE_KEY!,
    provider
);

export const sukukContract = new ethers.Contract(
    process.env.SMART_SUKUK_TOKEN_ADDRESS!,
    SmartSukukArtifact.abi,
    wallet
);
