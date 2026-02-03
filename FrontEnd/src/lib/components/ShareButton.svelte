<script lang="ts">
	export let score: number;
	export let reliability: number | string = 'N/A';

	// HU21: Twitter intent URL construction
	$: tweetText = `I just processed ${score} packets on zkPulse with ${reliability} reliability! 🚀 Can you beat my score? #zkPulse #Syscoin #Gaming`;
	$: shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
</script>

<a
	href={shareUrl}
	target="_blank"
	rel="noopener noreferrer"
	class="flex items-center gap-2 border border-white/20 bg-black/50 px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:bg-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
	aria-label="Share on X"
>
	<!-- X Logo (formerly Twitter) -->
	<svg class="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
		/>
	</svg>
	<span>SHARE ON X</span>
</a>
