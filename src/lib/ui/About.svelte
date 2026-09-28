<script lang="ts">
  import GameIcon from './GameIcon.svelte';
  import { PROJECT_LINKS } from '../project-links';
  import { uiStore } from '../stores/ui-store';

  interface SourceRef {
    label: string;
    href: string;
  }

  interface FactCard {
    /** Short Arabic label for the figure's subject. */
    topic: string;
    /** The figure itself, in Arabic words or figures. */
    figure: string;
    /** One sentence of context, written as a complete sentence. */
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
    uiStore.setAboutOpen(false);
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if $uiStore.isAboutOpen}
  <div
    class="pointer-events-auto fixed inset-0 z-[200] overflow-y-auto bg-charcoal-deep font-arabic scroll-area"
    role="dialog"
    aria-modal="true"
    aria-label="عن اللعبة"
  >
    <article class="mx-auto w-full max-w-[760px] px-6 py-8 md:px-10 md:py-12">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <header class="flex items-start justify-between gap-4 border-b-2 border-wheat-mid/70 pb-6">
        <div class="space-y-2">
          <span class="block text-xs font-bold tracking-widest text-wheat-dark uppercase font-heading"
            >محاكي إدارة المرحلة الانتقالية السورية</span
          >
          <h1 class="text-3xl font-bold text-wheat-gold font-heading">عن اللعبة</h1>
          <p class="max-w-[54ch] text-sm leading-relaxed text-wheat-mid">
            محاكاة استراتيجية واقتصادية مبنية على إحصاءات حقيقية عن سوريا. هذه الصفحة تشرح فكرتها،
            وتذكر أرقامها، ومصدر كل رقم منها.
          </p>
        </div>
        <button
          onclick={close}
          aria-label="إغلاق صفحة عن اللعبة"
          class="h-9 w-9 shrink-0 flex items-center justify-center bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer gloss-hover"
        >
          <GameIcon name="cross-mark" cls="w-4 h-4 shrink-0" />
        </button>
      </header>

      <!-- ── الفكرة ─────────────────────────────────────────────────────── -->
      <section class="mt-10 space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-wheat-light font-heading">
          <GameIcon name="scroll-quill" cls="w-5 h-5 shrink-0 text-wheat-gold" />
          <span>فكرة اللعبة</span>
        </h2>

        <p class="text-sm leading-loose text-wheat-light">
          تبدأ اللعبة من عام 2027، بعد سقوط النظام، وأنت في موقع قيادة الدولة السورية. بيدك أربعون
          دوراً، يمتد كل دور منها ستة أشهر، أي عشرون عاماً تتخذ فيها قراراتك. غير أن الفوز والخسارة لا
          يُحسمان في هذه العشرين عاماً: فبعد الدور الأخير يشغّل المحرّك «تقرير المئوية»، فيُقاس أثر ما
          فعلت حتى عام 2127. ومن ثمّ يُصبح القرار الذي يبدو ثانوياً اليوم قراراً تحتمله الثمن بعد
          عقدين.
        </p>

        <p class="text-sm leading-loose text-wheat-light">
          للعبة هدفان، لا هدف واحد. الأول أن يرى اللاعب كم يبلغ تعقيد الوضع، وأن يقف على حجم العمل
          المتراكم أمامه: فالوضع ضغوط متراكمة لا تنفك، وكل واحدة منها تستهلك ما
          تنفقه الأخرى.
        </p>

        <p class="text-sm leading-loose text-wheat-light">
          والهدف الثاني أن يفهم اللاعب <span class="text-wheat-gold font-bold">أنواع</span> المشاكل، وأن
          يعرف لكل نوعٍ ما يقتضيه من معالجة. تكفي محاكاة مبسطة، إذا بُنيت على أرقام حقيقية، لتوصل هذه الفكرة: ما نوع هذه
          المشكلة؟ وما الذي تقتضيه معالجتها؟ وأين تقع حدّها؟
        </p>

        <p class="text-sm leading-loose text-wheat-light">
          ولهذا صيغت اللعبة على إحصاءات وأرقام حقيقية عن سوريا. ومن يعرف أن الناتج المحلي الإجمالي
          انكمش إلى نحو 21.4 مليار دولار، وأن كلفة إعادة الإعمار تُقدَّر بـ216 مليار دولار، يعرف أن
          إصلاح الوضع هنا موازنة اختيارات، وأن بعض هذه الاختيارات مكلف.
        </p>
      </section>

      <!-- ── كيف تُلعب ──────────────────────────────────────────────────── -->
      <section class="mt-10 space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-wheat-light font-heading">
          <GameIcon name="chart" cls="w-5 h-5 shrink-0 text-wheat-gold" />
          <span>كيف تُلعب</span>
        </h2>

        <ul class="space-y-3">
          <li class="flex gap-3 text-sm leading-relaxed text-wheat-mid">
            <span class="shrink-0 mt-1.5 h-1.5 w-1.5 bg-wheat-gold" aria-hidden="true"></span>
            <span>
              <span class="font-bold text-wheat-light">أربعون دوراً</span>
              ، كل دور منها ستة أشهر: موسم حصاد، ثم موسم شتاء. ولكل محافظة أرقامها الخاصة: أضرارها
              التي لم تُصلَح بعد، ونسبة ما تولّده من الكهرباء، ومؤشّر نزوح أهلها.
            </span>
          </li>
          <li class="flex gap-3 text-sm leading-relaxed text-wheat-mid">
            <span class="shrink-0 mt-1.5 h-1.5 w-1.5 bg-wheat-gold" aria-hidden="true"></span>
            <span>
              <span class="font-bold text-wheat-light">خزينة من عملتين</span>
              : دولار للصفقات الخارجية، وليرة للخزينة الداخلية. والتحويل من إحداهما إلى الأخرى له ثمن
              وكلفة، فالنتيجة إفلاس سيادي قبل أن يكون انهياراً سياسياً.
            </span>
          </li>
          <li class="flex gap-3 text-sm leading-relaxed text-wheat-mid">
            <span class="shrink-0 mt-1.5 h-1.5 w-1.5 bg-wheat-gold" aria-hidden="true"></span>
            <span>
              <span class="font-bold text-wheat-light">لكل وزارة متغيراتها</span>
              ، ومن التوجيه الذي يبدو هامشياً في العام الأول إلى ما يؤثر في العام الأخير. فقرار واحد
              متعجّل قد يقف في السنة العاشرة.
            </span>
          </li>
          <li class="flex gap-3 text-sm leading-relaxed text-wheat-mid">
            <span class="shrink-0 mt-1.5 h-1.5 w-1.5 bg-wheat-gold" aria-hidden="true"></span>
            <span>
              <span class="font-bold text-wheat-light">الأحداث عشوائية، وأثر قرارك فيها محسوب سلفاً</span>
              . فالحدث يقع، ويردّ فعله محسوباً قبل أن تراه.
            </span>
          </li>
          <li class="flex gap-3 text-sm leading-relaxed text-wheat-mid">
            <span class="shrink-0 mt-1.5 h-1.5 w-1.5 bg-wheat-gold" aria-hidden="true"></span>
            <span>
              <span class="font-bold text-wheat-light">ثلاث عشرة نهاية</span>
              ، لكلٍّ منها تقرير ختامي يشرح الطريق الذي أوصلك إليها.
            </span>
          </li>
        </ul>
      </section>

      <!-- ── أرقام من سوريا ────────────────────────────────────────────── -->
      <section class="mt-10 space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-wheat-light font-heading">
          <GameIcon name="stone-throne" cls="w-5 h-5 shrink-0 text-wheat-gold" />
          <span>أرقام من سوريا</span>
        </h2>
        <p class="max-w-[64ch] text-sm leading-relaxed text-wheat-mid">
          هذه أرقام بُنيت عليها اللعبة أو صُحّحت. ولكل رقمٍ مصدرُه مذكور تحته، وقد جُمع بعضها من أكثر من
          مصدر. وكل مصدر قابل للتحقق بنقرة.
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          {#each FACTS as fact (fact.topic)}
            <div class="space-y-2 bg-charcoal-deep border border-charcoal-mid p-4">
              <span class="block text-xs font-bold text-wheat-dark font-heading">{fact.topic}</span>
              <span class="block text-lg font-bold text-wheat-gold font-mono" dir="rtl"
                >{fact.figure}</span
              >
              <p class="text-xs leading-relaxed text-wheat-mid">{fact.detail}</p>
              <ul class="space-y-1 pt-1">
                {#each fact.sources as source (source.href)}
                  <li>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      class="text-[11px] text-forest-accent hover:text-wheat-gold underline underline-offset-2 transition-colors"
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

      <!-- ── عن المطور ──────────────────────────────────────────────────── -->
      <section class="mt-10 space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-wheat-light font-heading">
          <GameIcon name="crown-coin" cls="w-5 h-5 shrink-0 text-wheat-gold" />
          <span>عن المطوّر</span>
        </h2>
        <div class="space-y-3 bg-charcoal-deep border border-charcoal-mid p-5">
          <span class="block text-base font-bold text-wheat-light font-heading">هادي الأحمد</span>
          <p class="text-sm leading-relaxed text-wheat-mid">
            متخصص في إدارة المشاريع الرقمية وتطوير الويب، وصانع محتوى رقمي، مهتم بالسياسة والثقافة
            الرقمية والتقنيات مفتوحة المصدر. وله مشاريع أخرى في البنية التحتية الرقمية السورية، منها
            <a
              href="https://syrian.zone"
              target="_blank"
              rel="noreferrer"
              class="text-forest-accent hover:text-wheat-gold underline underline-offset-2 transition-colors"
              >المساحة السورية</a
            >.
          </p>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={PROJECT_LINKS.authorSite}
              target="_blank"
              rel="noreferrer"
              class="h-9 px-4 flex items-center bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-xs font-bold text-wheat-light font-heading transition-colors cursor-pointer gloss-hover"
            >
              الموقع الشخصي
            </a>
            <a
              href={PROJECT_LINKS.authorGithub}
              target="_blank"
              rel="noreferrer"
              class="h-9 px-4 flex items-center gap-2 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-xs font-bold text-wheat-light font-heading transition-colors cursor-pointer gloss-hover"
            >
              <GameIcon name="brand-github" cls="w-4 h-4 shrink-0" />
              <span>حساب المطوّر</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ── مفتوح المصدر ──────────────────────────────────────────────── -->
      <section class="mt-10 space-y-4">
        <h2 class="flex items-center gap-2 text-lg font-bold text-wheat-light font-heading">
          <GameIcon name="key" cls="w-5 h-5 shrink-0 text-wheat-gold" />
          <span>مفتوح المصدر</span>
        </h2>
        <p class="max-w-[64ch] text-sm leading-relaxed text-wheat-mid">
          نُشرت هذه اللعبة تحت رخصة <span class="font-bold text-wheat-light">MIT</span>، والكود
          والتوثيق متاحان للجميع: تقرأهما، وتنسخهما، وتعدّلهما، وتبني عليهما، بما في ذلك الاستخدام
          التجاري. والشرط الوحيد هو الإبقاء على إشعار حقوق النشر والرخصة.
        </p>
        <p class="max-w-[64ch] text-sm leading-relaxed text-wheat-mid">
          وإذا وجدت خطأً في رقم من أرقام اللعبة، أو في طريقة حسابها، فالمستودع مفتوح للمساهمات، وسأقرأ
          كل تقرير.
        </p>
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={PROJECT_LINKS.repo}
            target="_blank"
            rel="noreferrer"
            class="h-10 px-5 flex items-center gap-2 bg-forest-mid hover:bg-forest-surface border border-wheat-mid/60 text-xs font-bold text-wheat-light font-heading transition-colors cursor-pointer gloss-hover"
          >
            <GameIcon name="brand-github" cls="w-4 h-4 shrink-0 text-wheat-gold" />
            <span>مستودع الكود</span>
          </a>
          <a
            href={PROJECT_LINKS.repoIssues}
            target="_blank"
            rel="noreferrer"
            class="h-10 px-5 flex items-center gap-2 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-xs font-bold text-wheat-light font-heading transition-colors cursor-pointer gloss-hover"
          >
            <GameIcon name="check-mark" cls="w-4 h-4 shrink-0 text-wheat-gold" />
            <span>الإبلاغ عن خطأ أو اقتراح</span>
          </a>
          <a
            href={PROJECT_LINKS.license}
            target="_blank"
            rel="noreferrer"
            class="h-10 px-5 flex items-center bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-xs font-bold text-wheat-light font-heading transition-colors cursor-pointer gloss-hover"
          >
            نص الرخصة
          </a>
        </div>
      </section>

      <footer class="mt-12 pt-6 border-t border-charcoal-mid">
        <button
          onclick={close}
          class="h-11 px-8 flex items-center justify-center bg-wheat-mid hover:bg-wheat-light text-forest-deep font-bold text-xs border border-wheat-mid transition-colors active:translate-y-0.5 cursor-pointer rounded-none font-heading"
        >
          العودة إلى اللعبة
        </button>
      </footer>
    </article>
  </div>
{/if}
