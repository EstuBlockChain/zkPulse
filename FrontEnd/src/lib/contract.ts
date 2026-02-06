import { getAccount, writeContract, switchChain, readContract } from '@wagmi/core';
import { wagmiAdapter, zkSysPoBDevnet, syscoinTestnet, syscoinMainnet } from './web3';

// Configuración de contratos por red
export const CONTRACT_CONFIG: Record<number, `0x${string}`> = {
    [zkSysPoBDevnet.id]: '0x1d102B1e3aA534b4799285A6a5Aa50f942B97A87',
};

// ABI del contrato Leaderboard
export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_score",
                "type": "uint256"
            }
        ],
        "name": "submitScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLeaderboard",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "player",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "score",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct Leaderboard.PlayerScore[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalGames",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export type PlayerScore = {
    player: `0x${string}`;
    score: bigint;
    timestamp: bigint;
};

export async function submitScoreToChain(score: number): Promise<string> {
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
            functionName: 'submitScore',
            args: [BigInt(score)],
            chainId: targetChainId,
        });

        return hash;
    } catch (error: any) {
        // Ignore user rejection (cancelling the transaction is not an error)
        if (error.message?.includes('User rejected') || error.code === 4001) {
            console.log('Transaction cancelled by user');
            return ''; // Return empty string or handle gracefully
        }

        console.error('Error publishing score:', error);

        // Show a cleaner error message to the user (stripping technical details)
        const cleanMessage = error.details || error.shortMessage || error.message || 'Unknown error';
        alert(`Error: ${cleanMessage}`);
        throw error;
    }
}

export async function fetchLeaderboard(): Promise<PlayerScore[]> {
    try {
        const result = await readContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_CONFIG[zkSysPoBDevnet.id],
            abi: CONTRACT_ABI,
            functionName: 'getLeaderboard',
            chainId: zkSysPoBDevnet.id
        });
        // result is strictly typed as readonly tuple array based on const ABI, cast or map if needed
        return result as unknown as PlayerScore[];
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

export async function fetchTotalGames(): Promise<string> {
    try {
        const result = await readContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_CONFIG[zkSysPoBDevnet.id],
            abi: CONTRACT_ABI,
            functionName: 'getTotalGames',
            chainId: zkSysPoBDevnet.id
        });
        return result.toString();
    } catch (error) {
        console.error('Error reading total games:', error);
        return '--';
    }
}
