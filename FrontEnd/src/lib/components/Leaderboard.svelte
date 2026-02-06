<script lang="ts">
	import { fade } from 'svelte/transition';

	// Props
	export let scores: { address: string; value: number; reliability: number }[] = [];
	export let userAddress: string | undefined = undefined;

	let activeTab: 'score' | 'history' = 'score';

	// Computed
	$: myHistory = userAddress
		? scores.filter((s) => s.address.toLowerCase() === userAddress?.toLowerCase())
		: [];
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
								<span class="font-mono text-cyan-100">{item.address}</span>
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
			<div in:fade={{ duration: 200 }}>
				{#if myHistory.length === 0}
					<div class="py-8 text-center text-xs text-slate-500">NO HISTORY FOUND</div>
				{:else}
					{#each myHistory.slice(0, 10) as item, i}
						<div class="flex items-center justify-between border-b border-white/5 py-2 text-sm">
							<div class="flex items-center gap-3">
								<span class="w-4 text-xs font-bold text-slate-500"></span>
								<div class="flex flex-col">
									<span class="font-mono text-cyan-100">RUN #{myHistory.length - i}</span>
									<span class="text-[0.6rem] text-slate-400">Reliability: {item.reliability}%</span>
								</div>
							</div>
							<span class="font-bold text-white">{item.value} PTS</span>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>
