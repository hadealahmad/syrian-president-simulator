<script lang="ts">
  import { untrack } from 'svelte';

  interface Props {
    value: number;
    format?: (n: number) => string;
    class?: string;
    dir?: 'ltr' | 'rtl' | 'auto';
  }

  let {
    value,
    format = (n: number) => String(Math.round(n)),
    class: className = '',
    dir = 'ltr',
  }: Props = $props();

  let shown = $state(untrack(() => value));
  let ticking = $state(false);
  let hasMounted = false;

  $effect(() => {
    const target = value;
    if (!hasMounted) {
      hasMounted = true;
      shown = target;
      return;
    }

    const start = untrack(() => shown);
    if (!Number.isFinite(target) || !Number.isFinite(start) || Math.abs(target - start) < 1e-6) {
      shown = target;
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof requestAnimationFrame === 'undefined') {
      shown = target;
      return;
    }

    ticking = true;
    const duration = 220;
    const t0 = performance.now();
    let raf = 0;

    const step = (now: number): void => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      shown = start + (target - start) * eased;
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        shown = target;
        ticking = false;
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ticking = false;
    };
  });

  let text = $derived(format(shown));
</script>

<span
  {dir}
  class="num transition-transform duration-150 motion-reduce:transition-none {ticking
    ? 'scale-[1.04] brightness-110'
    : ''} {className}"
>
  {text}
</span>
