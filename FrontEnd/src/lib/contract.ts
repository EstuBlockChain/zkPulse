import { getAccount, writeContract, switchChain, readContract, waitForTransactionReceipt } from '@wagmi/core';
export { waitForTransactionReceipt };
import { wagmiAdapter, zkSysPoBDevnet, syscoinTestnet, syscoinMainnet } from './web3';

// Configuración de contratos por red
export const CONTRACT_CONFIG: Record<number, `0x${string}`> = {
    [zkSysPoBDevnet.id]: '0x9802204171146aF8401447eBe46079f0bD8354Fc',
};

// ABI del contrato Leaderboard v2 (con Reliability)
export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_score",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_signature",
                "type": "bytes"
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
                        "name": "reliability",
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
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "bestScores",
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
    reliability: bigint;
    timestamp: bigint;
};

export async function submitScoreToChain(score: number, signature: string): Promise<string> {
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
            args: [BigInt(score), signature as `0x${string}`],
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

// Utility: Retry logic for read operations
async function retryRead<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryRead(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function fetchLeaderboard(): Promise<PlayerScore[]> {
    try {
        const result = await retryRead(() => readContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_CONFIG[zkSysPoBDevnet.id],
            abi: CONTRACT_ABI,
            functionName: 'getLeaderboard',
            chainId: zkSysPoBDevnet.id
        }));
        return result as unknown as PlayerScore[];
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

export async function fetchTotalGames(): Promise<string> {
    try {
        const result = await retryRead(() => readContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_CONFIG[zkSysPoBDevnet.id],
            abi: CONTRACT_ABI,
            functionName: 'getTotalGames',
            chainId: zkSysPoBDevnet.id
        }));
        return result.toString();
    } catch (error) {
        console.error('Error reading total games:', error);
        return '--';
    }
}

export async function fetchPersonalBest(address: `0x${string}`): Promise<string> {
    try {
        const result = await retryRead(() => readContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_CONFIG[zkSysPoBDevnet.id],
            abi: CONTRACT_ABI,
            functionName: 'bestScores',
            args: [address],
            chainId: zkSysPoBDevnet.id
        }));
        return result.toString();
    } catch (error) {
        console.error('Error reading personal best:', error);
        return '--';
    }
}
