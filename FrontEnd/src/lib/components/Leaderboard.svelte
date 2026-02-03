<script lang="ts">
	import { fade } from 'svelte/transition';

	// Mock Data para simular la HU13
	const mockScores = [
		{ address: '0x1A2...3B4C', value: 2450 },
		{ address: '0x8B7...9C2D', value: 2100 },
		{ address: '0x4D5...1E8F', value: 1850 },
		{ address: '0x9E2...7A3B', value: 1720 },
		{ address: '0x3C4...5D6E', value: 1540 }
	];

	const mockReliability = [
		{ address: '0x2F1...8A9B', value: '99%' },
		{ address: '0x5C6...2D4E', value: '98%' },
		{ address: '0x7E3...1B5A', value: '97%' },
		{ address: '0x0A9...4C2D', value: '96%' },
		{ address: '0x4D5...1E8F', value: '95%' }
	];

	let activeTab: 'score' | 'reliability' = 'score';
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
			'reliability'
				? 'border-b-2 border-cyan-400 bg-cyan-500/10 text-cyan-400'
				: 'text-slate-500 hover:text-cyan-200'}"
			on:click={() => (activeTab = 'reliability')}
		>
			RELIABILITY
		</button>
	</div>

	<!-- List -->
	<div class="flex flex-col gap-2">
		{#if activeTab === 'score'}
			<div in:fade={{ duration: 200 }}>
				{#each mockScores as item, i}
					<div class="flex items-center justify-between border-b border-white/5 py-2 text-sm">
						<div class="flex items-center gap-3">
							<span class="w-4 text-xs font-bold text-slate-500">#{i + 1}</span>
							<span class="font-mono text-cyan-100">{item.address}</span>
						</div>
						<span class="font-bold text-cyan-400">{item.value} PTS</span>
					</div>
				{/each}
			</div>
		{:else}
			<div in:fade={{ duration: 200 }}>
				{#each mockReliability as item, i}
					<div class="flex items-center justify-between border-b border-white/5 py-2 text-sm">
						<div class="flex items-center gap-3">
							<span class="w-4 text-xs font-bold text-slate-500">#{i + 1}</span>
							<span class="font-mono text-cyan-100">{item.address}</span>
						</div>
						<span class="font-bold text-green-400">{item.value}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
