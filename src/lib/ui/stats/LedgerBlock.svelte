<script lang="ts">
  import TickValue from './TickValue.svelte';
  import { fx } from './fx-bridge';

  interface Row {
    label: string;
    value: string;
    numericValue?: number;
    formatNum?: (n: number) => string;
    suffix?: string;
    emphasize?: boolean;
  }

  interface Props {
    title: string;
    rows: Row[];
    defaultOpen?: boolean;
  }

  let { title, rows, defaultOpen = true }: Props = $props();
  let open = $state(true);

  let initialized = false;
  $effect(() => {
    if (!initialized) {
      initialized = true;
      open = defaultOpen;
    }
  });

  function toggle(): void {
    open = !open;
    fx('tap');
  }
</script>

<section class="border border-[var(--c-line)] bg-[var(--c-panel)]">
  <button
    type="button"
    onclick={toggle}
    aria-expanded={open}
    class="pressable flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-[var(--c-strip)]"
  >
    <span class="text-[12px] font-bold leading-[1.4] text-[var(--c-text)]">
      {title}
    </span>
    <span class="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
      <span class="oc-kit-num">{rows.length} بنود</span>
      <span aria-hidden="true" class="oc-kit-num text-[14px] font-bold leading-none">
        {open ? '−' : '+'}
      </span>
    </span>
  </button>

  {#if open}
    <table class="w-full border-collapse">
      <tbody>
        {#each rows as row (row.label)}
          <tr
            class="border-t {row.emphasize
              ? 'border-[var(--c-line-strong)] bg-[var(--c-strip)]'
              : 'border-[var(--c-line)]'}"
          >
            <th
              scope="row"
              class="px-3 py-2 text-start text-[12px] leading-snug {row.emphasize
                ? 'font-bold text-[var(--c-text)]'
                : 'font-normal text-[var(--c-muted)]'}"
            >
              {row.label}
            </th>
            <td
              class="oc-kit-num px-3 py-2 text-end tabular-nums text-[var(--c-text)] {row.emphasize
                ? 'text-[14px] font-bold'
                : 'text-[13px] font-semibold'}"
            >
              <span dir="ltr" class="inline-flex items-baseline justify-end gap-1">
                {#if row.numericValue !== undefined && row.formatNum}
                  <TickValue value={row.numericValue} format={row.formatNum} />
                {:else}
                  <span>{row.value}</span>
                {/if}
                {#if row.suffix}
                  <span class="text-[11px] font-normal text-[var(--c-muted)]">{row.suffix}</span>
                {/if}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
