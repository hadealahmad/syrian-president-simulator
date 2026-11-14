<script lang="ts">
  import './kit.css';
  import { fx } from '../fx/feedback';

  interface Props {
    label: string;
    destination: string;
    onclick: () => void;
    tone?: 'default' | 'accent';
    class?: string;
  }

  let {
    label,
    destination,
    onclick,
    tone = 'default',
    class: className = '',
  }: Props = $props();

  function handleClick(): void {
    fx('tap');
    onclick();
  }
</script>

<button
  type="button"
  onclick={handleClick}
  class="oc-sec-link {tone === 'accent' ? 'accent' : ''} {className}"
>
  <b>{label}</b>
  <span>{destination}</span>
  <i aria-hidden="true">←</i>
</button>
