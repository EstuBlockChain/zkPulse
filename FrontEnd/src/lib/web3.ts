import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'

// --- CAMBIO 1: PON TU ID REAL AQUÍ ---
// Si no tienes uno ahora, usa este TEMPORAL DE PRUEBA: '1b64f89b9a691e81313e617937307045'
// (Pero cámbialo pronto porque tiene límites)
export const projectId = 'c6433317029634d37e2f5da53e1d7617'

export const zkSysPoBDevnet = defineChain({
    id: 57042,
    name: 'zkSYS PoB Devnet',
    nativeCurrency: { name: 'Syscoin', symbol: 'TSYS', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc-pob.dev11.top'] }
    },
    blockExplorers: {
        default: { name: 'zkSYS Explorer', url: 'https://explorer-pob.dev11.top/' }
    },
    testnet: true
})

// @ts-ignore
export const networks = [zkSysPoBDevnet]

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