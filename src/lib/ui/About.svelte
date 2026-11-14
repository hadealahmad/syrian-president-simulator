<script lang="ts">
  import { onMount } from 'svelte';
  import GameIcon from './GameIcon.svelte';
  import { PROJECT_LINKS } from '../project-links';
  import { uiStore } from '../stores/ui-store';
  import { focusTrap } from './actions/focus-trap';
  import { fx } from './fx/feedback';
  import { shellLayout } from './shell/viewport';
  import KbdHint from './flow/KbdHint.svelte';
  import './flow/flow-desktop.css';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  interface SourceRef {
    label: string;
    href: string;
  }

  interface FactCard {
    topic: string;
    figure: string;
    detail: string;
    sources: SourceRef[];
  }

  const FACTS: FactCard[] = [
    {
      topic: 'الناتج المحلي الإجمالي',
      figure: '21.4 مليار دولار',
      detail:
        'انكمش من 67.5 مليار دولار عام 2011 إلى نحو 21.4 مليار دولار عام 2024، وتشير بيانات ضوء الليل إلى هبوط يقارب 83% بين عامَي 2010 و2024.',
      sources: [
        {
          label: 'البنك الدولي — تقييم الوضع المالي-الجزئي',
          href: 'https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf',
        },
      ],
    },
    {
      topic: 'الأضرار المادية',
      figure: '108 مليارات دولار',
      detail:
        'موزّعة على المحافظات الأربع عشرة: حلب نحو 31 مليار دولار، وريف دمشق نحو 22 مليار، وحمص نحو 11 مليار.',
      sources: [
        {
          label: 'البنك الدولي — تقييم الأضرار المادية وإعادة الإعمار (أكتوبر 2025)',
          href: 'https://www.worldbank.org/en/news/press-release/2025/10/21/syria-s-post-conflict-reconstruction-costs-estimated-at-216-billion',
        },
      ],
    },
    {
      topic: 'كلفة إعادة الإعمار',
      figure: '216 مليار دولار',
      detail:
        'أي نحو عشرة أضعاف الناتج المحلي المتوقَّع لعام 2024، ضمن مدى يقدِّره البنك الدولي بين 140 و345 مليار دولار.',
      sources: [
        {
          label: 'البنك الدولي — بيان صحفي',
          href: 'https://www.worldbank.org/en/news/press-release/2025/10/21/syria-s-post-conflict-reconstruction-costs-estimated-at-216-billion',
        },
      ],
    },
    {
      topic: 'الدين العام',
      figure: '27 مليار دولار',
      detail:
        'نحو 128% من الناتج المحلي نهاية عام 2024، منها 22.3 مليار دولار دَيناً خارجياً، مع متأخرات كبيرة على وجه التحديد في مستحقات إيران.',
      sources: [
        {
          label: 'البنك الدولي — تقييم الوضع المالي-الجزئي (يونيو 2025)',
          href: 'https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf',
        },
      ],
    },
    {
      topic: 'تحويلات المغتربين',
      figure: 'نحو مليار دولار سنوياً',
      detail:
        'حوالات غير مشروطة، تُوجَّه بحسب حاجة الأسرة لا بحسب تفضيل الدولة. وتعادل نحو 4.7% من الناتج المحلي.',
      sources: [
        {
          label: 'البنك الدولي — مؤشر التحويلات الواردة',
          href: 'https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=SY',
        },
        {
          label: 'مجلس الشرق الأوسط — إحاطة (أكتوبر 2025)',
          href: 'https://mecouncil.org/publication/the-distant-anchor-how-diasporas-can-stabilize-fragile-states/',
        },
      ],
    },
    {
      topic: 'توليد الكهرباء',
      figure: '3000 ميغاواط',
      detail:
        'نحو 2250 ميغاواط عام 2025، ونحو 3000 ميغاواط في أبريل 2026، بينما يقع الطلب المقدَّر بين 5000 و7000 ميغاواط. وقد تجاوزت الطاقة الشمسية خارج الشبكة 2200 ميغاواط.',
      sources: [
        {
          label: 'وزارة الطاقة السورية — عبر ورقة IDOS (2026)',
          href: 'https://www.idos-research.de/fileadmin/user_upload/pdfs/publikationen/discussion_paper/2026/DP_6.2026.pdf',
        },
        {
          label: 'التحليل القطري المشترك للأمم المتحدة — أضرار الشبكة',
          href: 'https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf',
        },
      ],
    },
    {
      topic: 'العودة والنزوح',
      figure: '2.9 مليون عودة',
      detail:
        'عاد نحو مليون لاجئ ومليون ونصف مليون نازح داخلياً منذ ديسمبر 2024، في حين بقي نحو 6.14 مليون نازح داخلياً وستة ملايين لاجئ في الخارج.',
      sources: [
        {
          label: 'UNDP — التقرير السنوي لسوريا (2025)',
          href: 'https://www.undp.org/arabic-states/syria',
        },
        {
          label: 'التحليل القطري المشترك للأمم المتحدة — التقديرات السكانية',
          href: 'https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf',
        },
      ],
    },
  ];

  function close(): void {
    fx('cancel');
    uiStore.setAboutOpen(false);
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!$uiStore.isAboutOpen) return;
    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });
</script>

{#if $uiStore.isAboutOpen}
  <div
    use:focusTrap
    tabindex="-1"
    class="pointer-events-auto fixed inset-0 z-[200] flex flex-col overflow-hidden border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] pt-[env(safe-area-inset-top)] text-[var(--c-text)] font-arabic {isDesktop ? 'flow-desktop' : ''}"
    role="dialog"
    aria-modal="true"
    aria-label="عن اللعبة"
  >
    {#if isDesktop}
      <!-- Quiet sticky header bar on desktop with return action + Esc hint -->
      <div class="sticky top-0 z-10 shrink-0 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-8 py-2.5">
        <div class="mx-auto flex w-full max-w-[min(70ch,calc(100vw-64px))] items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-2.5">
            <span class="font-heading text-[var(--flow-fs-xs)] font-bold text-[var(--c-accent)]">
              محاكي إدارة المرحلة الانتقالية السورية
            </span>
            <span class="text-[var(--c-line-strong)]" aria-hidden="true">/</span>
            <span class="truncate font-heading text-[var(--flow-fs-sm)] font-bold text-[var(--c-text)]">
              عن اللعبة والمصادر
            </span>
          </div>
          <button
            data-autofocus
            type="button"
            onclick={close}
            style="min-height: var(--flow-btn-h);"
            class="kit-btn sec shrink-0 gap-2 px-4 text-[var(--flow-fs-sm)] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
          >
            <span>العودة إلى اللعبة</span>
            <KbdHint keys="Esc" />
          </button>
        </div>
      </div>
    {/if}

    <div class="scroll-area min-h-0 flex-1 overflow-y-auto">
      <article class="mx-auto w-full {isDesktop
        ? 'max-w-[min(70ch,calc(100vw-64px))] py-10'
        : 'max-w-[760px] px-5 py-6 sm:px-8 sm:py-9 phone-l:py-4'}">
        <!-- Title Header -->
        <header class="flex items-start justify-between gap-4 border-b border-[var(--c-line)] {isDesktop ? 'pb-6' : 'pb-5 phone-l:pb-3'}">
          <div class="space-y-1.5">
            {#if !isDesktop}
              <span class="block font-heading text-xs font-bold text-[var(--c-accent)]">
                محاكي إدارة المرحلة الانتقالية السورية
              </span>
            {/if}
            <h1 class="font-display font-bold text-[var(--c-text)] {isDesktop ? 'text-[clamp(28px,2.2vw,40px)] leading-[1.25]' : 'text-3xl phone-l:text-2xl'}">
              عن اللعبة
            </h1>
            <p class="reading-text max-w-[60ch] leading-relaxed text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-sm'}">
              محاكاة استراتيجية واقتصادية مبنية على إحصاءات حقيقية عن سوريا. هذه الصفحة تشرح فكرتها،
              وتذكر أرقامها، ومصدر كل رقم منها.
            </p>
          </div>
          {#if !isDesktop}
            <button
              data-autofocus
              type="button"
              onclick={close}
              aria-label="إغلاق صفحة عن اللعبة"
              class="kit-btn sec h-11 w-11 shrink-0 p-0 text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <GameIcon name="cross-mark" cls="w-4 h-4 shrink-0" />
            </button>
          {/if}
        </header>

        <!-- الفكرة -->
        <section class="mt-7 space-y-4">
          <h2 class="flex items-center gap-2 border-b border-[var(--c-line)] pb-2 font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[16px]'}">
            <GameIcon name="scroll-quill" cls="w-5 h-5 shrink-0 text-[var(--c-accent)]" />
            <span>فكرة اللعبة</span>
          </h2>

          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            تبدأ اللعبة من عام 2027، بعد سقوط النظام، وأنت في موقع قيادة الدولة السورية. بيدك أربعون
            دوراً، يمتد كل دور منها ستة أشهر، أي عشرون عاماً تتخذ فيها قراراتك. غير أن الفوز والخسارة لا
            يُحسَمان في هذه العشرين عاماً: فبعد الدور الأخير يشغّل المحرّك «تقرير المئوية»، فيُقاس أثر ما
            فعلت حتى عام 2127. ومن ثمّ يُصبح القرار الذي يبدو ثانوياً اليوم قراراً تحتمله الثمن بعد
            عقدين.
          </p>

          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            للعبة هدفان، لا هدف واحد. الأول أن يرى اللاعب كم يبلغ تعقيد الوضع، وأن يقف على حجم العمل
            المتراكم أمامه: فالوضع ضغوط متراكمة لا تنفك، وكل واحدة منها تستهلك ما
            تنفقه الأخرى.
          </p>

          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            والهدف الثاني أن يفهم اللاعب <span class="font-bold text-[var(--c-accent)]">أنواع</span> المشاكل، وأن
            يعرف لكل نوعٍ ما يقتضيه من معالجة. تكفي محاكاة مبسطة، إذا بُنيت على أرقام حقيقية، لتوصل هذه الفكرة: ما نوع هذه
            المشكلة؟ وما الذي تقتضيه معالجتها؟ وأين تقع حدّها؟
          </p>

          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            ولهذا صيغت اللعبة على إحصاءات وأرقام حقيقية عن سوريا. وأرقامٌ من هذا الحجم تعني أن إصلاح
            الوضع موازنة اختيارات، وأن بعض هذه الاختيارات مكلف: الناتج المحلي الإجمالي انكمش إلى نحو
            21.4 مليار دولار، وكلفة إعادة الإعمار تُقدَّر بـ216 مليار دولار.
          </p>
        </section>

        <!-- كيف تُلعب -->
        <section class="mt-8 space-y-4">
          <h2 class="flex items-center gap-2 border-b border-[var(--c-line)] pb-2 font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[16px]'}">
            <GameIcon name="chart" cls="w-5 h-5 shrink-0 text-[var(--c-accent)]" />
            <span>كيف تُلعب</span>
          </h2>

          <ul class="max-w-[65ch] space-y-3">
            <li class="flex gap-3 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.75]' : 'text-[13.5px] leading-[1.7]'}">
              <span class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
              <span>
                <span class="font-bold text-[var(--c-text)]">أربعون دوراً</span>
                ، كل دور منها ستة أشهر: موسم حصاد، ثم موسم شتاء. ولكل محافظة أرقامها الخاصة: أضرارها
                التي لم تُصلَح بعد، ونسبة ما تولّده من الكهرباء، ومؤشّر نزوح أهلها.
              </span>
            </li>
            <li class="flex gap-3 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.75]' : 'text-[13.5px] leading-[1.7]'}">
              <span class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
              <span>
                <span class="font-bold text-[var(--c-text)]">خزينة من عملتين</span>
                : دولار للصفقات الخارجية، وليرة للخزينة الداخلية. والتحويل من إحداهما إلى الأخرى له ثمن
                وكلفة، فالنتيجة إفلاس سيادي قبل أن يكون انهياراً سياسياً.
              </span>
            </li>
            <li class="flex gap-3 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.75]' : 'text-[13.5px] leading-[1.7]'}">
              <span class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
              <span>
                <span class="font-bold text-[var(--c-text)]">لكل وزارة متغيراتها</span>
                ، ومن التوجيه الذي يبدو هامشياً في العام الأول إلى ما يؤثر في العام الأخير. فقرار واحد
                متعجّل قد يقف في السنة العاشرة.
              </span>
            </li>
            <li class="flex gap-3 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.75]' : 'text-[13.5px] leading-[1.7]'}">
              <span class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
              <span>
                <span class="font-bold text-[var(--c-text)]">الأحداث عشوائية، وأثر قرارك فيها محسوب سلفاً.</span>
                فلا يكون ردّ الفعل مفاجأة.
              </span>
            </li>
            <li class="flex gap-3 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.75]' : 'text-[13.5px] leading-[1.7]'}">
              <span class="mt-2.5 h-1.5 w-1.5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
              <span>
                <span class="font-bold text-[var(--c-text)]">ثلاث عشرة نهاية</span>
                ، لكلٍّ منها تقرير ختامي يشرح الطريق الذي أوصلك إليها.
              </span>
            </li>
          </ul>
        </section>

        <!-- أرقام من سوريا -->
        <section class="mt-8 space-y-4">
          <h2 class="flex items-center gap-2 border-b border-[var(--c-line)] pb-2 font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[16px]'}">
            <GameIcon name="stone-throne" cls="w-5 h-5 shrink-0 text-[var(--c-accent)]" />
            <span>أرقام من سوريا</span>
          </h2>
          <p class="reading-text max-w-[65ch] text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            هذه أرقام بُنيت عليها اللعبة أو صُحّحت. ولكل رقمٍ مصدرُه مذكور تحته، وقد جُمع بعضها من أكثر من
            مصدر. وكل مصدر قابل للتحقق بنقرة.
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            {#each FACTS as fact (fact.topic)}
              <div class="space-y-2 border border-[var(--c-line)] bg-[var(--c-panel)] p-4">
                <span class="block font-heading font-bold text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-xs'}">{fact.topic}</span>
                <span class="num block font-heading font-bold text-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-lg'}" dir="rtl">
                  {fact.figure}
                </span>
                <p class="leading-[1.65] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">{fact.detail}</p>
                <ul class="space-y-0.5 pt-1">
                  {#each fact.sources as source (source.href)}
                    <li>
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        onclick={() => fx('tap')}
                        class="inline-flex min-h-11 md:min-h-9 items-center text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}"
                      >
                        {source.label}
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        </section>

        <!-- عن المطور -->
        <section class="mt-8 space-y-3">
          <h2 class="flex items-center gap-2 border-b border-[var(--c-line)] pb-2 font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[16px]'}">
            <GameIcon name="crown-coin" cls="w-5 h-5 shrink-0 text-[var(--c-accent)]" />
            <span>عن المطوّر</span>
          </h2>
          <div class="space-y-2.5 border-b border-[var(--c-line)] pb-4">
            <span class="block font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-base'}">هادي الأحمد</span>
            <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
              متخصص في إدارة المشاريع الرقمية وتطوير الويب، وصانع محتوى رقمي، مهتم بالسياسة والثقافة
              الرقمية والتقنيات مفتوحة المصدر. وله مشاريع أخرى في البنية التحتية الرقمية السورية، منها
              <a
                href="https://syrian.zone"
                target="_blank"
                rel="noreferrer"
                onclick={() => fx('tap')}
                class="text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >المساحة السورية</a
              >، وغيرها.
            </p>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1">
              <a
                href={PROJECT_LINKS.authorSite}
                target="_blank"
                rel="noreferrer"
                onclick={() => fx('tap')}
                class="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
              >
                الموقع الشخصي
              </a>
              <a
                href={PROJECT_LINKS.authorGithub}
                target="_blank"
                rel="noreferrer"
                onclick={() => fx('tap')}
                class="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
              >
                <GameIcon name="brand-github" cls="w-4 h-4 shrink-0" />
                <span>حساب المطوّر</span>
              </a>
            </div>
          </div>
        </section>

        <!-- مفتوح المصدر -->
        <section class="mt-8 space-y-3 pb-2">
          <h2 class="flex items-center gap-2 border-b border-[var(--c-line)] pb-2 font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[16px]'}">
            <GameIcon name="key" cls="w-5 h-5 shrink-0 text-[var(--c-accent)]" />
            <span>مفتوح المصدر</span>
          </h2>
          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            نُشرت هذه اللعبة تحت رخصة <bdi class="font-bold text-[var(--c-text)]">MIT</bdi>، والكود
            والتوثيق متاحان للجميع: تقرأهما، وتنسخهما، وتعدّلهما، وتبني عليهما، بما في ذلك الاستخدام
            التجاري. والشرط الوحيد هو الإبقاء على إشعار حقوق النشر والرخصة.
          </p>
          <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.8]' : 'text-[13.5px] leading-[1.75]'}">
            وإذا وجدت خطأً في رقم من أرقام اللعبة، أو في طريقة حسابها، فالمستودع مفتوح للمساهمات، وسأقرأ
            كل تقرير.
          </p>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1">
            <a
              href={PROJECT_LINKS.repo}
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              class="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
            >
              <GameIcon name="brand-github" cls="w-4 h-4 shrink-0" />
              <span>مستودع الكود</span>
            </a>
            <a
              href={PROJECT_LINKS.repoIssues}
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              class="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
            >
              <GameIcon name="check-mark" cls="w-4 h-4 shrink-0" />
              <span>الإبلاغ عن خطأ أو اقتراح</span>
            </a>
            <a
              href={PROJECT_LINKS.license}
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              class="inline-flex min-h-11 items-center gap-1.5 font-bold text-[var(--c-pos)] underline underline-offset-4 transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
            >
              نص الرخصة
            </a>
          </div>
        </section>
      </article>
    </div>

    {#if !isDesktop}
      <!-- Pinned return action outside the scroll container on phone layouts -->
      <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-5 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] sm:px-8 phone-l:py-2">
        <div class="mx-auto flex w-full max-w-[760px] sm:justify-end">
          <button
            type="button"
            onclick={close}
            class="btn-primary-chamfer pressable min-h-11 w-full px-8 font-heading text-sm font-bold sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
          >
            العودة إلى اللعبة
          </button>
        </div>
      </footer>
    {/if}
  </div>
{/if}

