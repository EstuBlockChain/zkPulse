<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    // -- ESTADO DEL JUEGO --
    let isPlaying = false;
    let isFinished = false;
    let score = 0;
    let timeLeft = 60; // HU08: Loop de 60 segundos [cite: 173]
    let gameLoop: any;
    let spawnLoop: any;

    // Definición de tipos de Spikes (Paquetes de red)
    type Spike = {
        id: number;
        type: 'green' | 'yellow' | 'red';
        x: number;
        y: number;
        duration: number;
        points: number;
    };

    let spikes: Spike[] = [];
    let nextId = 0;

    // -- LÓGICA DEL JUEGO --

    function startGame() {
        // HU07: Inicio sin wallet [cite: 172]
        isPlaying = true;
        isFinished = false;
        score = 0;
        timeLeft = 60;
        spikes = [];

        // Timer de cuenta regresiva
        gameLoop = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) endGame();
        }, 1000);

        // Loop de generación de Spikes (cada 400ms intentamos crear uno)
        spawnLoop = setInterval(spawnSpike, 400);
    }

    function spawnSpike() {
        if (!isPlaying) return;

        // Probabilidades según PDF [cite: 174, 175]
        const rand = Math.random();
        let type: Spike['type'];
        let duration: number;
        let points: number;

        if (rand < 0.60) {
            // 60% Green Spike
            type = 'green';
            duration = 1500; // 1.5s
            points = 1;
        } else if (rand < 0.90) {
            // 30% Yellow Spike
            type = 'yellow';
            duration = 1000; // 1.0s
            points = 3;
        } else {
            // 10% Red Spike
            type = 'red';
            duration = 500;  // 0.5s
            points = 5;
        }

        // Posición aleatoria dentro del área de juego (aprox 10% a 90%)
        const x = 10 + Math.random() * 80;
        const y = 10 + Math.random() * 80;

        const newSpike: Spike = { id: nextId++, type, x, y, duration, points };
        spikes = [...spikes, newSpike];

        // Eliminar el spike automáticamente si se acaba su tiempo (Miss)
        setTimeout(() => {
            removeSpike(newSpike.id);
        }, duration);
    }

    function removeSpike(id: number) {
        spikes = spikes.filter(s => s.id !== id);
    }

    function clickSpike(spike: Spike) {
        score += spike.points;
        removeSpike(spike.id);
        // Aquí podríamos agregar efectos de sonido o partículas visuales
    }

    function endGame() {
        isPlaying = false;
        isFinished = true;
        clearInterval(gameLoop);
        clearInterval(spawnLoop);
        // Aquí conectaremos después con la HU12 (Conexión Tardía)
    }

    onDestroy(() => {
        clearInterval(gameLoop);
        clearInterval(spawnLoop);
    });
</script>

<div class="relative w-full h-screen bg-slate-950 overflow-hidden font-mono select-none">
    
    <div class="absolute inset-0 opacity-20 pointer-events-none" 
         style="background-image: linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px); background-size: 50px 50px;">
    </div>

    <div class="absolute top-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
        <div>
            <h1 class="text-cyan-400 font-bold tracking-widest text-xl">zkPULSE_MONITOR</h1>
            <div class="flex items-center gap-2 mt-1">
                <div class="w-2 h-2 rounded-full {isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></div>
                <span class="text-xs text-slate-400">{isPlaying ? 'LIVE TRAFFIC' : 'SYSTEM IDLE'}</span>
            </div>
        </div>
        
        <div class="text-right">
            <div class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                {score.toString().padStart(4, '0')}
            </div>
            <div class="text-xs text-cyan-500 tracking-widest">PACKETS PROCESSED</div>
        </div>
    </div>

    {#if isPlaying}
        <div class="absolute inset-0 z-10 cursor-crosshair">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] font-bold text-white/5 pointer-events-none">
                {timeLeft}
            </div>

            {#each spikes as spike (spike.id)}
                <button
                    on:click={() => clickSpike(spike)}
                    transition:scale={{ duration: 100 }}
                    class="absolute w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_currentColor] active:scale-90 transition-transform"
                    style="left: {spike.x}%; top: {spike.y}%; 
                           background-color: {spike.type === 'green' ? 'rgba(16, 185, 129, 0.2)' : spike.type === 'yellow' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(244, 63, 94, 0.2)'};
                           border-color: {spike.type === 'green' ? '#10b981' : spike.type === 'yellow' ? '#eab308' : '#f43f5e'};
                           color: {spike.type === 'green' ? '#10b981' : spike.type === 'yellow' ? '#eab308' : '#f43f5e'};"
                >
                    <span class="font-bold text-lg">+{spike.points}</span>
                </button>
            {/each}
        </div>
    {/if}

    {#if !isPlaying && !isFinished}
        <div class="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/80 backdrop-blur-sm" in:fade>
            <h2 class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                STRESS TEST
            </h2>
            <p class="text-slate-400 mb-8 max-w-md text-center">
                Simula tráfico de red eliminando nodos inestables. <br>
                <span class="text-cyan-500">Green (+1), Yellow (+3), Red (+5).</span>
            </p>
            <button on:click={startGame} 
                class="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl tracking-widest clip-path-polygon transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                START SEQUENCE
            </button>
        </div>
    {/if}

    {#if isFinished}
        <div class="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/90 backdrop-blur-md" in:fade>
            <div class="text-cyan-500 text-sm tracking-[0.2em] mb-2">DIAGNOSTIC COMPLETE</div>
            <h2 class="text-7xl font-black text-white mb-6 drop-shadow-lg">{score} PTS</h2>
            
            <div class="flex gap-4">
                <button on:click={startGame} class="px-6 py-3 border border-cyan-500 text-cyan-400 font-bold hover:bg-cyan-500/10 transition-colors">
                    RETRY TEST
                </button>
                <button class="px-6 py-3 bg-cyan-500 text-black font-bold hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                    PUBLISH ON-CHAIN
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .clip-path-polygon {
        clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
    }
</style>