<script lang="ts">
  import './kit.css';

  interface Props {
    label: string;
    count?: number;
    tone?: 'muted' | 'accent';
    class?: string;
  }

  let {
    label,
    count,
    tone = 'muted',
    class: className = '',
  }: Props = $props();

  let display = $derived(count !== undefined ? `${label} · ${count}` : label);
</script>

<div class="divider {tone === 'accent' ? 'tone-accent' : ''} {className}" role="separator">
  <span>{display}</span>
</div>
