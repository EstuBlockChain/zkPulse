import { getAccount, writeContract } from '@wagmi/core';
import { wagmiAdapter, zkSysPoBDevnet } from './web3';

// Configuración de contratos por red
export const CONTRACT_CONFIG: Record<number, `0x${string}`> = {
    [zkSysPoBDevnet.id]: '0x9CB357A29d2256d2B54889DC2Df936BD197ffA53',
};

// ABI mínima para la función publishScore
export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            }
        ],
        "name": "publishScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export async function publishScoreToChain(score: number): Promise<string> {
    try {
        const account = getAccount(wagmiAdapter.wagmiConfig);

        if (!account.isConnected || !account.chainId) {
            throw new Error('Wallet not connected');
        }

        const contractAddress = CONTRACT_CONFIG[account.chainId];

        if (!contractAddress) {
            throw new Error(`Network not supported. Please switch to Syscoin.`);
        }

        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
            address: contractAddress as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'publishScore',
            args: [BigInt(score)],
            chainId: account.chainId,
            gas: 300000n, // Force higher gas limit for Pali Wallet compatibility
        });

        return hash;
    } catch (error) {
        console.error('Error publishing score:', error);
        throw error;
    }
}
