<script lang="ts">
  let { text }: { text: string } = $props();

  const parts = $derived(text.split(/([+−-]?\d+(?:[\/×]\d+)?)/g));
</script>

{#each parts as part, i (i)}{#if i % 2 === 1}<bdi dir="ltr" class="num mx-[1px]">{part}</bdi>{:else}{part}{/if}{/each}
