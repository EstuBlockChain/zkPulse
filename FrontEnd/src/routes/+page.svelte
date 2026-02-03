<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { userStats, calculateReliability } from '$lib/store';
	import { sounds } from '$lib/audio';
	import { getAccount } from '@wagmi/core';
	import { wagmiAdapter, modal } from '$lib/web3';
	import { publishScoreToChain } from '$lib/contract';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';

	// -- ESTADO DEL JUEGO --
	let isPlaying = false;
	let isFinished = false;
	let isPublishing = false;
	let score = 0;
	let timeLeft = 60; // HU08: Loop de 60 segundos [cite: 173]
	let txHash: string | null = null;
	let explorerUrl = '';
	let gameLoop: any;
	let spawnLoop: any;

	// Métricas reactivas
	$: reliabilityScore = calculateReliability($userStats);
	$: bestScore = $userStats.bestScore;

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
		isFinished = false;
		score = 0;
		timeLeft = 60;
		spikes = [];
		txHash = null; // Reset transaction hash on new game

		sounds.playStart();

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

		if (rand < 0.6) {
			// 60% Green Spike
			type = 'green';
			duration = 1500; // 1.5s
			points = 1;
		} else if (rand < 0.9) {
			// 30% Yellow Spike
			type = 'yellow';
			duration = 1000; // 1.0s
			points = 3;
		} else {
			// 10% Red Spike
			type = 'red';
			duration = 500; // 0.5s
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
		spikes = spikes.filter((s) => s.id !== id);
	}

	function clickSpike(spike: Spike) {
		score += spike.points;
		sounds.playHit(spike.type); // Sonido de impacto
		removeSpike(spike.id);
		// Aquí podríamos agregar efectos de sonido o partículas visuales
	}

	function endGame() {
		isPlaying = false;
		isFinished = true;
		clearInterval(gameLoop);
		clearInterval(spawnLoop);

		sounds.playGameOver();

		// Guardar resultado
		userStats.addRun(score);
	}

	async function handlePublish() {
		if (isPublishing) return;

		// 1. Lazy Connect: Verificar si está conectado
		const account = getAccount(wagmiAdapter.wagmiConfig);
		if (!account.isConnected) {
			if (modal) {
				await modal.open();
			}
			return;
		}

		// 2. Publicar On-chain
		isPublishing = true;
		try {
			const hash = await publishScoreToChain(score);
			txHash = hash;

			// Determinar explorador según red
			if (account.chainId === 5700) {
				explorerUrl = 'https://tanenbaum.io/tx';
			} else {
				explorerUrl = 'https://explorer.syscoin.org/tx'; // Fallback to mainnet explorer
			}
		} catch (error: any) {
			console.error(error);
			if (error.message && !error.message.includes('User rejected')) {
				alert('Error publishing score. See console.');
			}
		} finally {
			isPublishing = false;
		}
	}

	onDestroy(() => {
		clearInterval(gameLoop);
		clearInterval(spawnLoop);
	});
</script>

<div class="relative h-screen w-full overflow-hidden bg-slate-950 font-mono select-none">
	<div
		class="pointer-events-none absolute inset-0 opacity-20"
		style="background-image: linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px); background-size: 50px 50px;"
	></div>

	<div class="pointer-events-none absolute top-0 z-20 flex w-full items-start justify-between p-6">
		<div>
			<h1 class="text-xl font-bold tracking-widest text-cyan-400">zkPULSE_MONITOR</h1>
			<div class="mt-1 flex items-center gap-2">
				<div
					class="h-2 w-2 rounded-full {isPlaying ? 'animate-pulse bg-green-500' : 'bg-red-500'}"
				></div>
				<span class="text-xs text-slate-400">{isPlaying ? 'LIVE TRAFFIC' : 'SYSTEM IDLE'}</span>
			</div>
			<!-- Mock de estadisticas globales por ahora -->
			<div class="mt-4 text-xs text-slate-500">
				<p>GLOBAL AVG: <span class="text-cyan-600">--</span></p>
				<p>TOTAL TESTS: <span class="text-cyan-600">--</span></p>
			</div>
		</div>

		<div class="text-right">
			<div class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
				{score.toString().padStart(4, '0')}
			</div>
			<div class="text-xs tracking-widest text-cyan-500">PACKETS PROCESSED</div>
		</div>
	</div>

	{#if isPlaying}
		<div class="absolute inset-0 z-10 cursor-crosshair">
			<div
				class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] font-bold text-white/5"
			>
				{timeLeft}
			</div>

			{#each spikes as spike (spike.id)}
				<button
					on:click={() => clickSpike(spike)}
					transition:scale={{ duration: 100 }}
					class="absolute flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-[0_0_15px_currentColor] transition-transform active:scale-90"
					style="left: {spike.x}%; top: {spike.y}%; 
                           background-color: {spike.type === 'green'
						? 'rgba(16, 185, 129, 0.2)'
						: spike.type === 'yellow'
							? 'rgba(234, 179, 8, 0.2)'
							: 'rgba(244, 63, 94, 0.2)'};
                           border-color: {spike.type === 'green'
						? '#10b981'
						: spike.type === 'yellow'
							? '#eab308'
							: '#f43f5e'};
                           color: {spike.type === 'green'
						? '#10b981'
						: spike.type === 'yellow'
							? '#eab308'
							: '#f43f5e'};"
				>
					<span class="text-lg font-bold">+{spike.points}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if !isPlaying && !isFinished}
		<div
			class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
			in:fade
		>
			<h2
				class="mb-2 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-6xl font-black text-transparent"
			>
				STRESS TEST
			</h2>
			<p class="mb-8 max-w-md text-center text-slate-400">
				Simula tráfico de red eliminando nodos inestables. <br />
				<span class="text-cyan-500">Green (+1), Yellow (+3), Red (+5).</span>
			</p>

			<div class="mb-8 grid grid-cols-2 gap-8 text-center">
				<div>
					<div class="mb-1 text-xs tracking-wider text-slate-500">BEST SCORE</div>
					<div class="text-3xl font-bold text-white">{bestScore}</div>
				</div>
				<div>
					<div class="mb-1 text-xs tracking-wider text-slate-500">RELIABILITY</div>
					<div class="text-3xl font-bold text-cyan-400">{reliabilityScore}</div>
				</div>
			</div>

			<div class="mb-8 w-full max-w-md">
				<Leaderboard />
			</div>

			<button
				on:click={startGame}
				class="clip-path-polygon bg-cyan-500 px-10 py-4 text-xl font-bold tracking-widest text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:scale-105 hover:bg-cyan-400"
			>
				Start Network Test
			</button>
		</div>
	{/if}

	{#if isFinished}
		<div
			class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md"
			in:fade
		>
			<div class="mb-2 text-sm tracking-[0.2em] text-cyan-500">DIAGNOSTIC COMPLETE</div>
			<h2 class="mb-2 text-7xl font-black text-white drop-shadow-lg">{score} PTS</h2>

			<div class="mb-8 flex gap-8 text-center opacity-80">
				<div>
					<div class="text-xs text-slate-400">BEST</div>
					<div class="text-xl font-bold text-white">{bestScore}</div>
				</div>
				<div>
					<div class="text-xs text-slate-400">RELIABILITY</div>
					<div class="text-xl font-bold text-cyan-400">{reliabilityScore}</div>
				</div>
			</div>

			<div class="flex gap-4">
				<button
					on:click={startGame}
					class="border border-cyan-500 px-6 py-3 font-bold text-cyan-400 transition-colors hover:bg-cyan-500/10"
				>
					RETRY TEST
				</button>

				<ShareButton {score} reliability={reliabilityScore} />

				<button
					on:click={handlePublish}
					disabled={isPublishing}
					class="bg-cyan-500 px-6 py-3 font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPublishing ? 'PUBLISHING...' : 'PUBLISH ON-CHAIN'}
				</button>
			</div>

			{#if txHash}
				<div class="mt-6 flex animate-pulse flex-col items-center">
					<div class="mb-2 font-bold text-green-400">🚀 TRANSACTION SENT!</div>
					<a
						href="{explorerUrl}/{txHash}"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-slate-400 underline decoration-dashed underline-offset-4 hover:text-cyan-400"
					>
						VIEW ON EXPLORER ↗
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.clip-path-polygon {
		clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
	}
</style>
