import { createAppKit } from '@reown/appkit'
import { mainnet } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'

// --- CAMBIO 1: PON TU ID REAL AQUÍ ---
// Si no tienes uno ahora, usa este TEMPORAL DE PRUEBA: '1b64f89b9a691e81313e617937307045'
// (Pero cámbialo pronto porque tiene límites)
export const projectId = 'c6433317029634d37e2f5da53e1d7617' 

export const syscoinTestnet = defineChain({
    id: 5700,
    name: 'Syscoin Tanenbaum',
    nativeCurrency: { name: 'Syscoin', symbol: 'tSYS', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.tanenbaum.io'] }
    },
    blockExplorers: {
        default: { name: 'Syscoin Explorer', url: 'https://tanenbaum.io' }
    },
    testnet: true
})

// @ts-ignore
export const networks = [syscoinTestnet, mainnet]

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks
}) as any

// --- CAMBIO 2: EVITAR ERROR DE SSR ---
// Solo inicializamos el modal si estamos en el navegador (window existe)
export let modal: any;

if (typeof window !== 'undefined') {
    modal = createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata: {
            name: 'zkPulse',
            description: 'Network Health Monitor',
            url: 'https://zkpulse.app',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
    })
}