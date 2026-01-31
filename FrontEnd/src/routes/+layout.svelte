<script lang="ts">
    import '../app.css'; 
    import { onMount } from 'svelte';
    
    // Importamos web3 dinámicamente solo cuando la página ya montó
    onMount(async () => {
        await import('$lib/web3');
    });
</script>

<slot />