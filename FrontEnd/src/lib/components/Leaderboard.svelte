<script lang="ts">
	import { fade } from 'svelte/transition';

	// Props
	export let scores: { address: string; value: number; reliability: number }[] = [];
	export let history: { score: number; timestamp: number }[] = []; // Local history

	let activeTab: 'score' | 'history' = 'score';

	function shortenAddress(addr: string) {
		if (!addr) return '';
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	}

	function getTrend(currentScore: number, index: number) {
		if (index >= history.length - 1) return { icon: '-', color: 'text-slate-500' };
		const prevScore = history[index + 1].score;
		if (currentScore > prevScore) return { icon: '↑', color: 'text-green-400' };
		if (currentScore < prevScore) return { icon: '↓', color: 'text-red-400' };
		return { icon: '-', color: 'text-slate-500' };
	}
</script>

<div class="w-full max-w-md border border-cyan-900/50 bg-slate-900/50 p-4 backdrop-blur-sm">
	<!-- Tabs -->
	<div class="mb-4 flex border-b border-cyan-900/30">
		<button
			class="flex-1 py-2 text-xs font-bold tracking-widest transition-colors {activeTab === 'score'
				? 'border-b-2 border-cyan-400 bg-cyan-500/10 text-cyan-400'
				: 'text-slate-500 hover:text-cyan-200'}"
			on:click={() => (activeTab = 'score')}
		>
			TOP SCORES
		</button>
		<button
			class="flex-1 py-2 text-xs font-bold tracking-widest transition-colors {activeTab ===
			'history'
				? 'border-b-2 border-cyan-400 bg-cyan-500/10 text-cyan-400'
				: 'text-slate-500 hover:text-cyan-200'}"
			on:click={() => (activeTab = 'history')}
		>
			MY HISTORY
		</button>
	</div>

	<!-- List -->
	<div class="flex flex-col gap-2">
		{#if activeTab === 'score'}
			<div in:fade={{ duration: 200 }}>
				<!-- Show Top 5 from the list passed in (assuming it is sorted) -->
				{#each scores.slice(0, 5) as item, i}
					<div class="flex items-center justify-between border-b border-white/5 py-2 text-sm">
						<div class="flex items-center gap-3">
							<span class="w-4 text-xs font-bold text-slate-500">#{i + 1}</span>
							<div class="flex flex-col">
								<span class="font-mono text-cyan-100">{shortenAddress(item.address)}</span>
								<!-- Reliability Indicator -->
								<div class="flex items-center gap-1">
									<div class="h-1 w-10 overflow-hidden rounded-full bg-slate-800">
										<div class="h-full bg-cyan-500" style="width: {item.reliability}%"></div>
									</div>
									<span class="text-[0.6rem] text-slate-400">{item.reliability}%</span>
								</div>
							</div>
						</div>
						<span class="font-bold text-cyan-400">{item.value} PTS</span>
					</div>
				{/each}
			</div>
		{:else}
			<div in:fade={{ duration: 200 }} class="custom-scrollbar max-h-60 overflow-y-auto pr-2">
				{#if history.length === 0}
					<div class="py-8 text-center text-xs text-slate-500">NO LOCAL HISTORY FOUND</div>
				{:else}
					{#each history as item, i}
						{@const trend = getTrend(item.score, i)}
						<div class="flex items-center justify-between border-b border-white/5 py-2 text-sm">
							<div class="flex items-center gap-3">
								<span class="{trend.color} w-4 text-xs font-bold">{trend.icon}</span>
								<div class="flex flex-col">
									<span class="font-mono text-cyan-100">RUN #{history.length - i}</span>
									<span class="text-[0.6rem] text-slate-500"
										>{new Date(item.timestamp).toLocaleTimeString()}</span
									>
								</div>
							</div>
							<span class="font-bold text-white">{item.score} PTS</span>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(6, 182, 212, 0.1);
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(6, 182, 212, 0.5);
		border-radius: 2px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(6, 182, 212, 0.8);
	}
</style>
