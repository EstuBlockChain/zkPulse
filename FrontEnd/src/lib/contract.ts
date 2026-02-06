import { getAccount, writeContract, switchChain } from '@wagmi/core';
import { wagmiAdapter, zkSysPoBDevnet, syscoinTestnet, syscoinMainnet } from './web3';

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

        let contractAddress = CONTRACT_CONFIG[account.chainId];
        let targetChainId = account.chainId;

        // Auto-switch network if not on the supported chain
        if (!contractAddress) {
            try {
                await switchChain(wagmiAdapter.wagmiConfig, { chainId: zkSysPoBDevnet.id });
                contractAddress = CONTRACT_CONFIG[zkSysPoBDevnet.id];
                targetChainId = zkSysPoBDevnet.id;
            } catch (switchError) {
                console.error('Failed to switch network:', switchError);
                throw new Error('Please switch to zkSYS PoB Devnet to publish your score.');
            }
        }

        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
            address: contractAddress as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'publishScore',
            args: [BigInt(score)],
            chainId: targetChainId,
            // gas: 300000n, // Removed hardcoded gas limit to allow auto-estimation on zkSYS
        });

        return hash;
    } catch (error: any) {
        console.error('Error publishing score:', error);
        // Show clearer error to user
        alert(`Error publishing score: ${error.message || error}`);
        throw error;
    }
}
