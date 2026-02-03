import { getAccount, readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiAdapter } from './web3';
import { syscoinTestnet } from './web3';

// TODO: Reemplazar con la dirección real del contrato desplegado
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

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

        if (!account.isConnected) {
            throw new Error('Wallet not connected');
        }

        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'publishScore',
            args: [BigInt(score)],
            chainId: syscoinTestnet.id
        });

        return hash;
    } catch (error) {
        console.error('Error publishing score:', error);
        throw error;
    }
}
