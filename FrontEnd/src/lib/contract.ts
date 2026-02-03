import { getAccount, writeContract } from '@wagmi/core';
import { wagmiAdapter, syscoinTestnet, syscoinMainnet } from './web3';

// Configuración de contratos por red
export const CONTRACT_CONFIG: Record<number, `0x${string}`> = {
    [syscoinTestnet.id]: '0x73cb147bF953c55139d21D4121Db0Acce2adf4e2', // TODO: Address Testnet
    [syscoinMainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: Address Mainnet
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
