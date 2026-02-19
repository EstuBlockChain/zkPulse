# zkPulse ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **A gamified network health monitor for the Syscoin ecosystem**

**zkPulse** transforms blockchain reliability metrics into an interactive gaming experience where users process packets in real-time, compete on leaderboards, and publish achievements on-chain.

---

## 🎮 Features

- **Gamified Monitoring:** Visualize network packet processing in real-time
- **Dual Leaderboard:** Compete for **Top Scores** and **Highest Reliability**
- **Multi-Network Support:** Switch between Syscoin Testnet (Tanenbaum) and Mainnet
- **On-Chain Publishing:** Save your high scores directly to the blockchain
- **Social Sharing:** Share your reliability rating on X (Twitter)

## 🛠️ Technology Stack

- **Framework:** SvelteKit
- **Styling:** TailwindCSS
- **Blockchain:** Wagmi / Viem
- **Wallet:** Reown AppKit
- **Network:** Syscoin NEVM (Testnet: 5700 | Mainnet: 57)

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/EstuBlockChain/zkPulse.git

# Install dependencies
cd FrontEnd
npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Usage

1. **Connect Wallet** - Connect your Syscoin-compatible wallet
2. **Select Network** - Choose Testnet or Mainnet
3. **Start Processing** - Begin processing packets
4. **Compete** - Check leaderboards and track your ranking
5. **Publish** - Save your best scores on-chain
6. **Share** - Post your achievements on social media

## 🤝 Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a Pull Request.

## 📜 License

MIT License - Copyright (c) 2026 zkPulse Team

---

<div align="center">

**⚡ Built for the Syscoin ecosystem ⚡**

[⭐ Star this repo](https://github.com/EstuBlockChain/zkPulse) • [Report Issues](https://github.com/EstuBlockChain/zkPulse/issues)

</div>



---

# 🎮 Lógica del Juego e Interfaces - zkPulse

## 📂 Estructura de Archivos

```
zkPulseeee/
├── circuits/
│   └── game.circom                    # ⚙️ LÓGICA CRIPTOGRÁFICA ZK
├── contracts/
│   └── Leaderboard.sol                # 🔗 LÓGICA BLOCKCHAIN
└── FrontEnd/src/
    ├── app.d.ts                       # 📝 DECLARACIONES DE TIPOS GLOBALES
    ├── lib/
    │   ├── store.ts                   # 📊 INTERFACES + ESTADO DEL JUEGO
    │   ├── contract.ts                # 🔗 INTERFACES BLOCKCHAIN
    │   ├── audio.ts                   # 🔊 Sistema de sonidos
    │   └── web3.ts                    # 🔌 Configuración wallet
    └── routes/
        ├── +page.svelte               # 🎮 LÓGICA PRINCIPAL DEL JUEGO
        └── api/verify-score/
            └── +server.ts             # 🛡️ VERIFICACIÓN ZK (Backend)
```

---

## 1️⃣ INTERFACES - `src/lib/store.ts`

**Ubicación:** `FrontEnd/src/lib/store.ts`

### 📝 Interfaces definidas:

```typescript
// Representa una partida individual
export interface GameRun {
    score: number;         // Puntaje obtenido
    timestamp: number;     // Momento de la partida
}

// Estadísticas acumuladas del jugador
export interface UserStats {
    bestScore: number;              // Mejor puntaje histórico
    history: GameRun[];             // Historial de todas las partidas
    totalGamesPlayed: number;       // Total de juegos jugados
}
```

### 🔧 Funciones principales:

```typescript
// Store reactivo de Svelte
export const userStats = createUserStats();

// Calcula reliability score (60% últimas 5 partidas + 40% mejor score)
export function calculateReliability(stats: UserStats): number
```

**Características:**
- ✅ Persistencia en `localStorage`
- ✅ Reactivo con Svelte stores
- ✅ Métodos: `addRun()`, `reset()`

---

## 2️⃣ INTERFACES BLOCKCHAIN - `src/lib/contract.ts`

**Ubicación:** `FrontEnd/src/lib/contract.ts` (línea 104)

```typescript
// Interface que representa un registro en el leaderboard
export type PlayerScore = {
    player: `0x${string}`;      // Dirección del jugador
    score: bigint;              // Puntaje
    reliability: bigint;        // Score de confiabilidad
    timestamp: bigint;          // Timestamp del registro
};
```

### 🔗 Funciones de interacción con el contrato:

```typescript
// Enviar puntaje verificado al blockchain
export async function submitScoreToChain(
    score: number, 
    reliability: number, 
    signature: string
): Promise<string>

// Obtener leaderboard completo
export async function fetchLeaderboard(): Promise<PlayerScore[]>

// Obtener mejor puntaje personal
export async function fetchPersonalBest(address: `0x${string}`): Promise<bigint>

// Total de juegos globales
export async function fetchTotalGames(): Promise<bigint>

// Esperar confirmación de transacción
export async function waitForTransactionReceipt(hash: string): Promise<any>
```

---

## 3️⃣ LÓGICA PRINCIPAL DEL JUEGO - `src/routes/+page.svelte`

**Ubicación:** `FrontEnd/src/routes/+page.svelte`

### 🎯 Variables de Estado del Juego (líneas 17-48):

```typescript
// -- ESTADO DEL JUEGO --
let isPlaying = false;           // Si el juego está activo
let isFinished = false;          // Si terminó la partida
let isPublishing = false;        // Si está publicando on-chain
let score = 0;                   // Puntaje actual
let timeLeft = 60;               // Segundos restantes (60s por partida)
let txHash: string | null;       // Hash de transacción blockchain
let gameLoop: any;               // Intervalo del timer
let spawnLoop: any;              // Intervalo de generación de paquetes

// -- ESTADO ZK (Zero-Knowledge) --
let poseidon: any;               // Función hash criptográfica
let gameSeed: bigint = 0n;       // Semilla aleatoria de la partida
let stepIndex = 0;               // Índice del paso actual (0-119)
const MAX_STEPS = 120;           // Total de pasos por partida
let inputClicks: number[];       // Array de clics [0 o 1] para ZK proof

// -- ESTADÍSTICAS --
let onChainBest: number = 0;     // Mejor puntaje registrado on-chain
$: reliabilityScore = calculateReliability($userStats);
$: bestScore = $userStats.bestScore;
$: effectiveBest = Math.max(onChainBest, bestScore);
```

### 🎮 Interface de Spike (Paquete) (líneas 60-67):

```typescript
type Spike = {
    id: number;              // ID único del paquete
    type: 'green' | 'yellow' | 'red';  // Color según dificultad
    x: number;               // Posición X (%)
    y: number;               // Posición Y (%)
    duration: number;        // Duración en ms
    points: number;          // Puntos que otorga
    stepIndex: number;       // Índice ZK correspondiente
};

let spikes: Spike[] = [];    // Array de paquetes activos
```

---

## 4️⃣ FUNCIONES DE LA LÓGICA DEL JUEGO

### 🚀 `startGame()` - Línea 219
Inicia una nueva partida:
- Resetea estado (score, timer, spikes)
- Genera seed criptográfico aleatorio
- Inicializa array de clics para ZK
- Inicia timers (countdown + spawn)

### 📦 `spawnSpike()` - Línea 243
Genera un nuevo paquete cada 500ms:
- Usa **Poseidon hash** determinista: `hash(seed, stepIndex)`
- Extrae byte aleatorio (0-255)
- Determina color según probabilidad:
    - 🟢 Verde (<153): 60% - 1.5s - 1 punto
    - 🟡 Amarillo (<230): 30% - 1.0s - 3 puntos
    - 🔴 Rojo (≥230): 10% - 0.5s - 5 puntos
- Posición aleatoria en pantalla

### 🎯 `clickSpike(spike)` - Línea 313
Cuando el jugador hace clic:
- Suma puntos al score
- Reproduce sonido según tipo
- **Registra el clic** en `inputClicks[stepIndex] = 1`
- Elimina el spike

### 🏁 `endGame()` - Línea 328
Finaliza la partida:
- Detiene timers
- Guarda en store (`userStats.addRun()`)
- Determina si es nuevo récord

### 🔐 `handlePublish()` - Línea 342
Publica puntaje en blockchain:

**Flujo:**
1. **Verifica wallet conectada**
2. **Genera prueba ZK:**
   ```typescript
   const inputs = {
       seed: gameSeed.toString(),
       clicks: inputClicks  // Array de 120 clics (0 o 1)
   };
   const { proof, publicSignals } = await snarkjs.groth16.fullProve(
       inputs, 
       '/zk/game.wasm',
       '/zk/game_final.zkey'
   );
   ```
3. **Envía al servidor** (`/api/verify-score`)
4. **Servidor verifica** la prueba ZK
5. **Servidor firma** con Oracle wallet
6. **Cliente envía** al smart contract con firma
7. **Espera confirmación** en blockchain

---

## 5️⃣ LÓGICA CRIPTOGRÁFICA - `circuits/game.circom`

**Ubicación:** `circuits/game.circom`

### 📐 Template del Circuito (líneas 12-78):

```circom
template Game(MAX_STEPS) {
    // INPUTS
    signal input seed;          // Semilla pública
    signal input clicks[MAX_STEPS]; // Clics privados (0 o 1)
    
    // OUTPUT
    signal output score;        // Puntaje final
    
    // LÓGICA (Loop de 120 pasos)
    for (var i = 0; i < MAX_STEPS; i++) {
        // 1. Verificar que click es booleano (0 o 1)
        clicks[i] * (1 - clicks[i]) === 0;
        
        // 2. Generar número aleatorio con Poseidon
        hash[i] = Poseidon(2);
        hash[i].inputs[0] <== seed;
        hash[i].inputs[1] <== i;
        
        // 3. Convertir a byte (0-255)
        randByte[i] <== (hash bits) & 0xFF;
        
        // 4. Determinar tipo de paquete
        isGreen[i] <== (randByte[i] < 153)
        isYellow[i] <== (randByte[i] < 230) AND NOT Green
        isRed[i] <== NOT Yellow AND NOT Green
        
        // 5. Calcular puntos
        points[i] <== (isGreen * 1) + (isYellow * 3) + (isRed * 5)
        
        // 6. Acumular score
        internalScore[i+1] <== internalScore[i] + (clicks[i] * points[i])
    }
    
    score <== internalScore[MAX_STEPS];
}
```

**¿Qué garantiza?**
- ✅ El puntaje fue calculado correctamente
- ✅ Mismo algoritmo que el juego visible
- ✅ **Sin revelar** qué paquetes hiciste clic

---

## 6️⃣ SMART CONTRACT - `contracts/Leaderboard.sol`

**Ubicación:** `contracts/Leaderboard.sol`

### 📦 Struct (líneas 10-15):

```solidity
struct PlayerScore {
    address player;
    uint256 score;
    uint256 reliability;
    uint256 timestamp;
}
```

### 🔐 Función principal (líneas 38-62):

```solidity
function submitScore(
    uint256 _score,
    uint256 _reliability,
    bytes memory _signature
) external {
    // 1. Verificar firma del Oracle
    bytes32 message = keccak256(abi.encodePacked(
        msg.sender, 
        _score, 
        _reliability
    ));
    address signer = message.toEthSignedMessageHash().recover(_signature);
    require(signer == oracle, "Invalid Oracle Signature");
    
    // 2. Actualizar best score si es mayor
    if (_score > bestScores[msg.sender]) {
        bestScores[msg.sender] = _score;
        // Actualizar leaderboard...
    }
    
    // 3. Incrementar contador global
    totalGames++;
    
    emit NewScore(msg.sender, _score);
}
```

---

## 7️⃣ VERIFICACIÓN ZK (Backend) - `api/verify-score/+server.ts`

**Ubicación:** `FrontEnd/src/routes/api/verify-score/+server.ts`

### 🛡️ Función POST (líneas 16-62):

```typescript
export async function POST({ request }: RequestEvent) {
    const { proof, publicSignals, address, reliability } = await request.json();
    
    // 1. Verificar prueba ZK
    const isValid = await snarkjs.groth16.verify(
        vKey,              // verification_key.json
        publicSignals,     // [score]
        proof              // Prueba generada por cliente
    );
    
    if (!isValid) {
        return json({ error: 'Invalid ZK Proof' }, { status: 403 });
    }
    
    const verifiedScore = BigInt(publicSignals[0]);
    
    // 2. Firmar con wallet del Oracle
    const messageHash = keccak256(
        encodePacked(
            ['address', 'uint256', 'uint256'],
            [address, verifiedScore, BigInt(reliability)]
        )
    );
    
    const signature = await account.signMessage({
        message: { raw: messageHash }
    });
    
    return json({ 
        success: true, 
        score: verifiedScore.toString(), 
        signature 
    });
}
```

---

## 🔄 FLUJO COMPLETO

```
1. JUGADOR HACE CLIC
   ↓
   +page.svelte: clickSpike()
   → inputClicks[stepIndex] = 1
   
2. TERMINA JUEGO
   ↓
   +page.svelte: endGame()
   → store.ts: userStats.addRun(score)
   
3. CLICK EN "PUBLISH"
   ↓
   +page.svelte: handlePublish()
   → Genera ZK Proof con snarkjs
   
4. ENVÍA AL SERVIDOR
   ↓
   +server.ts: POST /api/verify-score
   → Verifica proof con verification_key.json
   → Firma con Oracle wallet
   
5. ENVÍA AL BLOCKCHAIN
   ↓
   contract.ts: submitScoreToChain()
   → Leaderboard.sol: submitScore()
   → Verifica firma Oracle
   → Guarda en storage
   
6. ACTUALIZA UI
   ↓
   +page.svelte: refreshLeaderboard()
   → contract.ts: fetchLeaderboard()
   → Muestra nuevo ranking
```

---

## 📚 RESUMEN

| Archivo | Propósito | Interfaces/Tipos |
|---------|-----------|------------------|
| **store.ts** | Estado del juego (local) | `GameRun`, `UserStats` |
| **contract.ts** | Interacción blockchain | `PlayerScore` |
| **+page.svelte** | Lógica del juego | `Spike`, variables estado |
| **game.circom** | Lógica criptográfica ZK | Señales del circuito |
| **Leaderboard.sol** | Storage blockchain | `PlayerScore` struct |
| **app.d.ts** | Declaraciones módulos | `snarkjs`, `circomlibjs` |

---

## 🎯 DÓNDE MODIFICAR SEGÚN TU NECESIDAD

- **Cambiar reglas del juego** → `+page.svelte` (spawnSpike, clickSpike)
- **Cambiar probabilidades** → `game.circom` + `+page.svelte` (deben coincidir)
- **Agregar estadísticas** → `store.ts` (agregar campos a interfaces)
- **Cambiar datos blockchain** → `Leaderboard.sol` (modificar struct)
- **Nueva función del contrato** → `contract.ts` (agregar función)
