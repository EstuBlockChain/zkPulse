import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, polygon, optimism, base, bsc, avalanche } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain, http } from 'viem'

// --- CAMBIO 1: PON TU ID REAL AQUÍ ---
// Si no tienes uno ahora, usa este TEMPORAL DE PRUEBA: '1b64f89b9a691e81313e617937307045'
// (Pero cámbialo pronto porque tiene límites)
export const projectId = 'c6433317029634d37e2f5da53e1d7617'

export const zkSysPoBDevnet = defineChain({
    id: 57042,
    name: 'zkSYS PoB Devnet',
    nativeCurrency: { name: 'Syscoin', symbol: 'TSYS', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://zkpulse.onrender.com/api/rpc', 'https://rpc-pob.dev11.top'] }
    },
    blockExplorers: {
        default: { name: 'zkSYS Explorer', url: 'https://explorer-pob.dev11.top/' }
    },
    testnet: true
})

export const syscoinTestnet = defineChain({
    id: 5700,
    name: 'Syscoin Tanenbaum',
    nativeCurrency: { name: 'Syscoin', symbol: 'tSYS', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.tanenbaum.io', 'https://syscoin-tanenbaum-evm.publicnode.com'] }
    },
    blockExplorers: {
        default: { name: 'Syscoin Explorer', url: 'https://tanenbaum.io' }
    },
    testnet: true
})

export const syscoinMainnet = defineChain({
    id: 57,
    name: 'Syscoin Mainnet',
    nativeCurrency: { name: 'Syscoin', symbol: 'SYS', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.syscoin.org'] }
    },
    blockExplorers: {
        default: { name: 'Syscoin Explorer', url: 'https://syscoin.org' }
    },
    testnet: false
})

// @ts-ignore
export const networks = [zkSysPoBDevnet, syscoinMainnet, syscoinTestnet, mainnet, arbitrum, polygon, optimism, base, bsc, avalanche]

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks,
    transports: {
        [zkSysPoBDevnet.id]: http(undefined, {
            timeout: 60_000,
            retryCount: 3,
            retryDelay: 2_000
        }),
        [syscoinTestnet.id]: http(),
        [syscoinMainnet.id]: http()
    }
}) as any

// --- CAMBIO 2: EVITAR ERROR DE SSR ---
// Solo inicializamos el modal si estamos en el navegador (window existe)
export let modal: any;

if (typeof window !== 'undefined') {
    modal = createAppKit({
        adapters: [wagmiAdapter],
        networks: networks as any,
        projectId,
        metadata: {
            name: 'zkPulse',
            description: 'Network Health Monitor',
            url: 'https://zkpulse.onrender.com',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        },
        features: {
            email: false,
            socials: []
        }
    })
}