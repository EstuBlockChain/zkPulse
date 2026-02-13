<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { userStats, calculateReliability } from '$lib/store';
	import { sounds } from '$lib/audio';
	import { getAccount, watchAccount } from '@wagmi/core';
	import { wagmiAdapter, modal, zkSysPoBDevnet } from '$lib/web3';
	import {
		submitScoreToChain,
		fetchLeaderboard,
		fetchTotalGames,
		fetchPersonalBest
	} from '$lib/contract';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	// Dynamic imports inside functions/onMount to avoid SSR issues with circom/snarkjs

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
	let totalGames: string = '--';
	let onChainBest: number = 0; // Personal Best on Chain

	// -- ZK STATE --
	let poseidon: any;
	let gameSeed: bigint = 0n;
	let stepIndex = 0;
	const MAX_STEPS = 120;
	let inputClicks: number[] = [];

	let leaderboardAllTime: { address: string; value: number; reliability: number }[] = [];
	let leaderboardMonthly: { address: string; value: number; reliability: number }[] = [];
	let leaderboardWeekly: { address: string; value: number; reliability: number }[] = [];

	// Wallet State
	let accountAddress: string | undefined = undefined;
	let isConnected = false;
	let unwatchAccount: () => void;

	// Métricas reactivas
	$: reliabilityScore = calculateReliability($userStats);
	$: bestScore = $userStats.bestScore;

	// Effective Best: The highest score from all sources (Contract, Leaderboard, Local)
	// onChainBest is strictly the best form remote sources.
	$: effectiveBest = Math.max(onChainBest, bestScore);

	// Check if current score beats the appropriate record
	// Logic moved to endGame() to capture state before store update

	// Definición de tipos de Spikes (Paquetes de red)
	type Spike = {
		id: number;
		type: 'green' | 'yellow' | 'red';
		x: number;
		y: number;
		duration: number;
		points: number;
		stepIndex: number; // ZK Step Index
	};

	let spikes: Spike[] = [];
	let nextId = 0;

	// Helper to update personal best from multiple sources (Remote Only)
	async function updateOnChainBest(address: string) {
		if (!address) return;

		let maxScore = 0;

		// 1. Check direct contract mapping
		try {
			const bestFromContract = await fetchPersonalBest(address as `0x${string}`);
			maxScore = Number(bestFromContract) || 0;
		} catch (e) {
			console.error('Error fetching best score:', e);
		}

		// 2. Check leaderboard data (in case contract mapping is out of sync)
		const leaderboardEntry = leaderboardAllTime.find(
			(p) => p.address.toLowerCase() === address.toLowerCase()
		);

		if (leaderboardEntry && leaderboardEntry.value > maxScore) {
			maxScore = leaderboardEntry.value;
		}

		onChainBest = maxScore;
	}

	async function refreshLeaderboard() {
		const rawLeaderboard = await fetchLeaderboard();
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		// Helper: Process list to find max score per player
		const processScores = (items: typeof rawLeaderboard) => {
			const uniqueScores = new Map<
				string,
				{ address: string; value: number; reliability: number }
			>();

			items.forEach((item) => {
				const address = item.player;
				const value = Number(item.score);
				const reliability = Number(item.reliability);

				if (!uniqueScores.has(address) || value > uniqueScores.get(address)!.value) {
					uniqueScores.set(address, { address, value, reliability });
				}
			});

			return Array.from(uniqueScores.values()).sort((a, b) => b.value - a.value);
		};

		// 1. All Time Leaderboard
		leaderboardAllTime = processScores(rawLeaderboard);

		// 2. Monthly Leaderboard
		const monthlyItems = rawLeaderboard.filter((item) => {
			const date = new Date(Number(item.timestamp) * 1000);
			return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
		});
		leaderboardMonthly = processScores(monthlyItems);

		// 3. Weekly Leaderboard
		// Get Monday of current week
		const d = new Date(now);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
		const monday = new Date(d.setDate(diff));
		monday.setHours(0, 0, 0, 0);

		const weeklyItems = rawLeaderboard.filter((item) => {
			const date = new Date(Number(item.timestamp) * 1000);
			return date >= monday;
		});
		leaderboardWeekly = processScores(weeklyItems);
	}

	onMount(async () => {
		// Watch wallet changes
		unwatchAccount = watchAccount(wagmiAdapter.wagmiConfig, {
			onChange(data) {
				accountAddress = data.address;
				isConnected = data.isConnected;

				if (data.isConnected && data.address) {
					fetchPersonalBest(data.address).then((best) => {
						onChainBest = Number(best) || 0;
					});
				} else {
					onChainBest = 0;
				}
			}
		});

		// Initialize Poseidon for ZK RNG
		try {
			// @ts-ignore - Module types are defined in app.d.ts but editor may need sync
			const { buildPoseidon } = await import('circomlibjs');
			poseidon = await buildPoseidon();
		} catch (e) {
			console.error('Failed to load Poseidon:', e);
		}

		// Fetch initial data
		await refreshLeaderboard();

		// Fetch personal best if wallet is connected
		const account = getAccount(wagmiAdapter.wagmiConfig);
		if (account.isConnected && account.address) {
			accountAddress = account.address;
			isConnected = true;
			updateOnChainBest(account.address);
		}
	});

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

		// ZK Reset
		gameSeed = BigInt(Math.floor(Math.random() * 1000000000));
		stepIndex = 0;
		inputClicks = new Array(MAX_STEPS).fill(0);

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
		if (stepIndex >= MAX_STEPS) return;

		// Deterministic RNG using Poseidon
		// Hash(seed, stepIndex)
		// Note: Poseidon inputs must be BigInts or strings convertible to BigInt
		// We use stepIndex as the second input
		let randByte = 0;

		if (poseidon) {
			const hash = poseidon([gameSeed, BigInt(stepIndex)]);
			// Convert Field Element to BigInt -> Number
			// F.toString() gives the decimal string
			const hashStr = poseidon.F.toString(hash);
			const hashBn = BigInt(hashStr);
			// Take lowest 8 bits (same as circuit)
			randByte = Number(hashBn & 255n);
		} else {
			// Fallback if poseidon fails to load (should not happen in prod)
			randByte = Math.floor(Math.random() * 256);
		}

		// Circuit Logic:
		// Green < 153
		// Yellow < 230
		// Red >= 230

		let type: Spike['type'];
		let duration: number;
		let points: number;

		if (randByte < 153) {
			// 60% Green Spike
			type = 'green';
			duration = 1500; // 1.5s
			points = 1;
		} else if (randByte < 230) {
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

		const newSpike: Spike = { id: nextId++, type, x, y, duration, points, stepIndex };
		spikes = [...spikes, newSpike];

		stepIndex++;

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

		// Record Click for ZK
		// Only set to 1 if within bounds
		if (spike.stepIndex < MAX_STEPS) {
			inputClicks[spike.stepIndex] = 1;
		}
	}

	// State to track record status for the finished game
	let isNewRecord = false;
	let previousBestSnapshot = 0;

	function endGame() {
		isPlaying = false;
		isFinished = true;
		clearInterval(gameLoop);
		clearInterval(spawnLoop);

		sounds.playGameOver();

		// Snapshot current best before updating
		previousBestSnapshot = effectiveBest;
		isNewRecord = score > effectiveBest;

		// Guardar resultado (updates bestScore store)
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

		// 2. Publicar On-chain con ZK
		isPublishing = true;
		try {
			// A. Generate ZK Proof
			// Dynamic import snarkjs
			// @ts-ignore
			const snarkjs = await import('snarkjs');

			const inputs = {
				seed: gameSeed.toString(),
				claimedScore: score.toString(), // Public Input
				clicks: inputClicks
			};

			console.log('Generating ZK Proof...', inputs);

			// Paths to circuit files (Must be in static/ folder)
			const wasmPath = '/zk/game.wasm';
			const zkeyPath = '/zk/game_final.zkey';

			const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);
			console.log('Proof Generated:', publicSignals);

			// B. Verify & Sign with Oracle
			const verifyRes = await fetch('/api/verify-score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ proof, publicSignals, address: account.address })
			});

			if (!verifyRes.ok) {
				const err = await verifyRes.json();
				throw new Error(err.error || 'Oracle Verification Failed');
			}

			const { signature } = await verifyRes.json();

			// C. Submit to Contract
			const hash = await submitScoreToChain(score, signature);
			txHash = hash;

			// Determinar explorador según red
			if (account.chainId === zkSysPoBDevnet.id) {
				explorerUrl = 'https://explorer-pob.dev11.top/tx';
			} else if (account.chainId === 5700) {
				explorerUrl = 'https://tanenbaum.io/tx';
			} else {
				explorerUrl = 'https://explorer.syscoin.org/tx'; // Fallback to mainnet explorer
			}

			// Update leaderboard and stats after successful publish
			setTimeout(async () => {
				totalGames = await fetchTotalGames();
				await refreshLeaderboard();

				// Update personal best
				if (account.address) {
					updateOnChainBest(account.address);
				}
			}, 5000); // Wait a bit for block propagation
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
		if (unwatchAccount) unwatchAccount();
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

			<div class="mt-4 flex gap-4 text-xs text-slate-500">
				<p>GLOBAL GAMES: <span class="text-cyan-600">{leaderboardAllTime.length}</span></p>
				<p>LOCAL RUNS: <span class="text-purple-400">{$userStats.totalGamesPlayed}</span></p>
			</div>
		</div>

		<div class="pointer-events-auto flex flex-col items-end gap-2 text-right">
			<!-- Wallet Button -->
			{#if isConnected && accountAddress}
				<button
					on:click={() => modal?.open({ view: 'Account' })}
					class="mb-1 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/80 px-4 py-1.5 text-xs font-bold text-cyan-400 backdrop-blur-sm transition-all hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
				>
					<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
					{accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
					<span class="ml-1 text-[10px] text-slate-500">▼</span>
				</button>
			{/if}

			<div class="pointer-events-none">
				<div class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
					{score.toString().padStart(4, '0')}
				</div>
				<div class="text-xs tracking-widest text-cyan-500">PACKETS PROCESSED</div>
			</div>
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
			class="absolute inset-0 z-30 flex flex-col items-center justify-start overflow-y-auto bg-slate-950/90 py-10 backdrop-blur-md"
			in:fade
		>
			<div class="mt-10 mb-2 text-sm tracking-[0.2em] text-cyan-500">DIAGNOSTIC COMPLETE</div>
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

			{#if isNewRecord}
				<div class="mb-4 animate-bounce text-center font-bold tracking-widest text-yellow-400">
					🏆 NEW RECORD DETECTED!
					<div class="text-xs font-normal text-slate-400">
						Beat previous best: {previousBestSnapshot}
					</div>
				</div>
			{:else}
				<div class="mb-4 text-center text-xs tracking-widest text-slate-500">
					PREV BEST SCORE: {effectiveBest}
				</div>
			{/if}

			<div class="flex gap-4">
				<button
					on:click={startGame}
					class="border border-cyan-500 px-6 py-3 font-bold text-cyan-400 transition-colors hover:bg-cyan-500/10"
				>
					RETRY TEST
				</button>

				<ShareButton {score} reliability={reliabilityScore} />

				<div class="group relative">
					<button
						on:click={handlePublish}
						disabled={isPublishing}
						class="bg-cyan-500 px-6 py-3 font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 {isNewRecord
							? 'animate-pulse'
							: ''}"
					>
						{isPublishing ? 'PUBLISHING...' : 'PUBLISH ON-CHAIN'}
					</button>
					{#if !isNewRecord && effectiveBest > 0}
						<div
							class="pointer-events-none absolute -top-12 left-1/2 w-48 -translate-x-1/2 rounded bg-slate-800 p-2 text-center text-xs text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
						>
							Score lower than record ({effectiveBest}).
						</div>
					{/if}
				</div>
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

			<div class="mt-8 w-full max-w-md">
				<Leaderboard
					allTimeScores={leaderboardAllTime}
					monthlyScores={leaderboardMonthly}
					weeklyScores={leaderboardWeekly}
					history={$userStats.history}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.clip-path-polygon {
		clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
	}
</style>
