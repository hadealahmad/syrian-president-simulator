<script lang="ts">
  import { uiStore } from '../stores/ui-store';

  const STEPS = [
    {
      id: 'mandate',
      badge: 'الفصل 01',
      title: 'الغاية الاستراتيجية ومهمة الرئاسة',
      subtitle: 'الميثاق السيادي لإدارة المرحلة الانتقالية الحرجة (2024 - 2044)',
      spotlight: 'none',
      sections: [
        {
          label: 'الهدف الوطني الأعلى',
          desc: 'أنت تتولى سدة الحكم كرئيس للجمهورية في منعطف تاريخي حرج. هدفك هو قيادة الدولة السورية عبر 40 دوراً نصف سنوي (20 عاماً، دورتان في كل عام: الحصاد والشتاء) للحفاظ على وحدة التراب الوطني وتفادي الانهيار.',
          tag: 'البقاء والسيادة',
        },
        {
          label: 'أركان بقاء الدولة',
          desc: 'تقاس استمرارية حكمك بـ 4 توازنات مصيرية: تفادي الإفلاس المالي، منع التضخم الجامح، كبح جماح الاضطرابات الشعبية، وتجنب خروج المحافظات عن السيطرة المركزية.',
          tag: 'الأمن القومي',
        },
        {
          label: 'معادلة الحكم والمقايضة',
          desc: 'لا توجد سياسة بلا ثمن؛ زيادة الرواتب تمتص الاحتقان لكنها تستنزف الخزينة، وتقليص الدعم يحمي الاحتياطي لكنه قد يشعل الاحتجاجات. فن الحكم يكمن في توزيع الأعباء وإدارة الأولويات دون انكسار الدولة.',
          tag: 'المقايضة السيادية',
        },
      ],
    },
    {
      id: 'ribbon',
      badge: 'الفصل 02',
      title: 'الشريط السيادي واحتياطيات الدولة',
      subtitle: 'غرفة المراقبة المالية والنقدية المستمرة في أعلى الشاشة',
      spotlight: 'top-ribbon',
      sections: [
        {
          label: 'الخزينة العامة (ليرة سورية)',
          desc: 'السيولة المحلية المتاحة للإنفاق على الأجور التشغيلية، برامج الدعم الاجتماعي، وإعانات المحافظات. تُغذى من الضرائب والرسوم الجمركية.',
          tag: 'الموازنة المحلية',
        },
        {
          label: 'احتياطي النقد الأجنبي ومؤشر الأمان',
          desc: 'مخزون العملات الصعبة في مصرف سورية المركزي؛ الدرع الأساسي لاستيراد القمح والمحروقات والمستلزمات الطبية. يوضح "مؤشر الأمان" عدد الأشهر المتبقية قبل نفاذ السيولة الصعبة إذا استمر العجز.',
          tag: 'الاحتياطي الاستراتيجي',
        },
        {
          label: 'الرصيد السياسي السيادي',
          desc: 'مخزون الهيبة والنفوذ الرئاسي (0 - 100). تحتاجه لإصدار المراسيم السيادية الحساسة وتمرير المشاريع الكبرى. يرتفع برضا الشارع واستقرار المؤسسات وينخفض جراء الإجراءات القسرية.',
          tag: 'النفوذ التنفيذي',
        },
        {
          label: 'سعر الصرف الموازي والتضخم',
          desc: 'معدل صرف الليرة مقابل العملات الصعبة والتضخم السنوي؛ مؤشران يعكسان القدرة الشرائية للمواطنين وتآكل الرواتب في الأسواق الحقيقية.',
          tag: 'الاستقرار النقدي',
        },
      ],
    },
    {
      id: 'map',
      badge: 'الفصل 03',
      title: 'خريطة العمليات الثلاثية الأبعاد',
      subtitle: 'طاولة الرمل التكتيكية: استطلاع الحالة الإنشائية والأمنية للمحافظات',
      spotlight: 'map-viewport',
      sections: [
        {
          label: 'ارتفاع الأقاليم (منسوب الإعمار)',
          desc: 'تمثل الكتل الجغرافية محافظات الجمهورية الـ 14. يعكس ارتفاع الكتلة منسوب إعادة الإعمار والنشاط الاقتصادي الميداني القائم في المحافظة.',
          tag: 'البنية التحتية',
        },
        {
          label: 'أبراج الطاقة وشبكة الكهرباء',
          desc: 'الأبراج الفولاذية المصغرة تعبر عن ساعات التغذية؛ التوهج الذهبي الوهاج يرمز للاستقرار (12 ساعة فأكثر)، التوهج الخافت يشير للتقنين الحاد، وانطفاء البرج يعني العتمة الكاملة.',
          tag: 'الشبكة الوطنية',
        },
        {
          label: 'شاخصات حقول الألغام',
          desc: 'الأوتاد التحذيرية وأشرطة الخطر تشير لنسبة تلوث الأراضي الزراعية ومحاور النقل بالألغام ومخلفات الحرب غير المنفجرة.',
          tag: 'الأمان الميداني',
        },
        {
          label: 'مؤشر الاحتقان الشعبي وأجهزة الإنذار',
          desc: 'تتلون الكتل بحسب الحالة الأمنية: الأخضر (مستقرة)، الأصفر (متوترة)، الخمري (اضطرابات مع تنبيه نبضي)، والأحمر القاني (تمرد مسلح مع وميض طوارئ).',
          tag: 'الاستقرار المدني',
        },
      ],
    },
    {
      id: 'drawers',
      badge: 'الفصل 04',
      title: 'مجلس الوزراء وإدارة المحافظات',
      subtitle: 'أجنحة القيادة اليومية: السياسات القطاعية المركزية والتنمية الإقليمية',
      spotlight: 'sidebars',
      sections: [
        {
          label: 'الجناح الأيمن: مجلس الوزراء والسياسات القطاعية',
          desc: 'إدارة الوزارات السيادية (المالية، الاقتصاد، الطاقة، الداخلية، الصحة، والخارجية). تحكم بسلالم أجور الموظفين، وضبط الدعم السلعي للخبز والمازوت، والإنفاق الأمني العام.',
          tag: 'التوجيه المركزي',
        },
        {
          label: 'الجناح الأيسر: إدارة المحافظات والمشاريع المحلية',
          desc: 'عند النقر على أي محافظة، تفتح لوحتها التفصيلية لمتابعة سكانها، ومستشفياتها، ونسب الاحتقان. يمكنك إطلاق مشاريع استراتيجية محلية، أو إرسال فرق كاسحات الألغام، أو دعم حصتها من الكهرباء.',
          tag: 'اللامركزية التنموية',
        },
        {
          label: 'ديوان المراسيم الرئاسية الاستثنائية',
          desc: 'مراسيم تشريعية استثنائية لإعادة الهيكلة الاقتصادية، مكافحة الفساد، أو عقد اتفاقيات قطاعية، تتطلب تكلفة فورية من الرصيد السياسي والموازنة.',
          tag: 'المراسيم الاستثنائية',
        },
      ],
    },
    {
      id: 'turn',
      badge: 'الفصل 05',
      title: 'دورة الدور والمصادقة التنفيذية',
      subtitle: 'بروتوكول اتخاذ القرارات والتقدم الزمني في مسيرة الحكم',
      spotlight: 'command-deck',
      sections: [
        {
          label: 'مسودة القرارات والتوجيهات الرئاسية',
          desc: 'أي قرار تختاره أو مرسوم تفعله يُحفظ أولاً في مسودة مؤقتة. تراقب المنصة قيود الموازنة والرصيد السياسي في الوقت الفعلي، وتمنع تجاوز الحدود المتاحة.',
          tag: 'التخطيط المرن',
        },
        {
          label: 'منصة القيادة ومراجعة الموازنة',
          desc: 'الأزرار العائمة أسفل الشاشة تتيح مراجعة إجمالي الالتزامات المالية والسياسية، والتراجع عن المسودة بضغطة واحدة قبل اعتمادها.',
          tag: 'الانضباط المالي',
        },
        {
          label: 'إنهاء الدور والمصادقة التنفيذية',
          desc: 'بالنقر على "إنهاء الدور والمصادقة"، تُراجع قائمة قراراتك المعتمدة. عند التأكيد، تُنفذ القرارات وتتقدم المحاكاة نصف عام ويُحسب الأثر الاقتصادي والأمني التراكمي.',
          tag: 'المصادقة الرئاسية',
        },
        {
          label: 'الأحداث والأزمات الطارئة',
          desc: 'في مطلع كل دور، قد تواجه أحداثاً استثنائية أو أزمات قطاعية طارئة تتطلب تدخلاً رئاسياً حاسماً لاحتواء التداعيات.',
          tag: 'إدارة الأزمات',
        },
      ],
    },
  ];

  let currentStep = $derived($uiStore.guideStep);
  let activeData = $derived(STEPS[currentStep] ?? STEPS[0]);

  function handleNext(): void {
    if (currentStep < STEPS.length - 1) {
      uiStore.setGuideStep(currentStep + 1);
    } else {
      uiStore.setGuideModal(false);
    }
  }

  function handlePrev(): void {
    if (currentStep > 0) {
      uiStore.setGuideStep(currentStep - 1);
    }
  }

  function handleClose(): void {
    uiStore.setGuideModal(false);
  }

  function handleJump(index: number): void {
    uiStore.setGuideStep(index);
  }
</script>

{#if $uiStore.isGuideModalOpen}
  <div class="fixed inset-0 z-50 overflow-hidden font-arabic select-none pointer-events-auto">
    <!-- Non-obscuring Transparent Backdrop: Keeps the entire application behind crystal clear -->
    <div
      class="absolute inset-0 bg-black/25 transition-opacity duration-300"
      onclick={handleClose}
      onkeydown={(e) => e.key === 'Escape' && handleClose()}
      role="button"
      tabindex="-1"
      aria-label="إغلاق الدليل"
    ></div>

    <!-- Interactive Spotlights based on active step -->
    {#if activeData.spotlight === 'top-ribbon'}
      <div
        class="pointer-events-none absolute top-0 left-[390px] right-[390px] h-[84px] border-2 border-wheat-gold shadow-[0_0_35px_rgba(223,202,160,0.5)] z-40 transition-all duration-300"
      >
        <span class="absolute -bottom-6 right-4 px-2 py-0.5 bg-wheat-gold text-forest-deep text-[10px] font-bold font-heading shadow-md">
          الشريط السيادي المستهدف
        </span>
      </div>
    {:else if activeData.spotlight === 'map-viewport'}
      <div
        class="pointer-events-none absolute top-[84px] bottom-0 left-[390px] right-[390px] border-2 border-wheat-gold shadow-[inset_0_0_40px_rgba(223,202,160,0.35)] z-40 transition-all duration-300"
      >
        <span class="absolute top-4 right-4 px-2.5 py-1 bg-wheat-gold text-forest-deep text-[11px] font-bold font-heading shadow-md">
          خريطة العمليات الثلاثية الأبعاد
        </span>
      </div>
    {:else if activeData.spotlight === 'sidebars'}
      <!-- Left Sidebar Spotlight: Provincial Drawer -->
      <div
        class="pointer-events-none absolute top-0 bottom-0 left-0 w-[390px] border-r-2 border-wheat-gold shadow-[0_0_35px_rgba(223,202,160,0.4)] z-40 transition-all duration-300"
      >
        <span class="absolute top-20 right-4 px-2 py-0.5 bg-wheat-gold text-forest-deep text-[10px] font-bold font-heading shadow-md">
          لوحة المحافظات (الجناح الأيسر)
        </span>
      </div>
      <!-- Right Sidebar Spotlight: Cabinet Ministries -->
      <div
        class="pointer-events-none absolute top-0 bottom-0 right-0 w-[390px] border-l-2 border-wheat-gold shadow-[0_0_35px_rgba(223,202,160,0.4)] z-40 transition-all duration-300"
      >
        <span class="absolute top-20 left-4 px-2 py-0.5 bg-wheat-gold text-forest-deep text-[10px] font-bold font-heading shadow-md">
          مجلس الوزراء والمراسيم (الجناح الأيمن)
        </span>
      </div>
    {:else if activeData.spotlight === 'command-deck'}
      <div
        class="pointer-events-none absolute bottom-4 left-[398px] w-[350px] h-[68px] border-2 border-wheat-gold shadow-[0_0_35px_rgba(223,202,160,0.5)] z-40 transition-all duration-300"
      >
        <span class="absolute -top-6 right-2 px-2 py-0.5 bg-wheat-gold text-forest-deep text-[10px] font-bold font-heading shadow-md">
          منصة القيادة واعتماد الدور
        </span>
      </div>
    {/if}

    <!-- Guidebook Central Modal Card (Constrained between sidebars, leaves sidebars and top ribbon clear) -->
    <div
      class="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
    >
      <div
        class="pointer-events-auto w-full max-w-[630px] bg-forest-deep/95 border-2 border-wheat-mid/80 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[82vh] overflow-hidden text-wheat-light"
      >
        <!-- Modal Top Bar -->
        <header class="flex items-center justify-between px-5 py-3.5 bg-charcoal-deep border-b border-charcoal-mid shrink-0">
          <div class="flex items-center gap-2.5">
            <!-- Presidential Heraldic Icon -->
            <div class="w-7 h-7 bg-forest-mid border border-wheat-gold flex items-center justify-center shrink-0 text-wheat-gold">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold text-wheat-light font-heading tracking-wide">البروتوكول الرئاسي // دليل قيادة الدولة</h2>
                <span class="px-1.5 py-0.2 bg-wheat-gold/20 text-wheat-gold text-[9px] font-mono border border-wheat-gold/40 font-bold">
                  {activeData.badge}
                </span>
              </div>
              <p class="text-[10px] text-wheat-dark">وثيقة التوجيه الاستراتيجي لإدارة المرحلة الانتقالية</p>
            </div>
          </div>

          <!-- Dismiss Button -->
          <button
            onclick={handleClose}
            class="px-2.5 py-1 text-xs text-wheat-dark hover:text-wheat-gold hover:bg-forest-mid border border-transparent hover:border-charcoal-mid transition-colors cursor-pointer font-heading flex items-center gap-1"
          >
            <span>تخطي الدليل</span>
            <span class="font-mono text-[11px]">✕</span>
          </button>
        </header>

        <!-- Chapter Selector Tabs -->
        <nav class="flex border-b border-charcoal-mid bg-forest-mid/60 text-xs shrink-0 overflow-x-auto">
          {#each STEPS as step, idx}
            <button
              onclick={() => handleJump(idx)}
              class="flex-1 min-w-[100px] py-2 px-2 text-center border-l border-charcoal-mid last:border-l-0 transition-colors font-heading text-[10px] flex items-center justify-center gap-1 cursor-pointer {currentStep === idx ? 'bg-forest-deep text-wheat-gold font-bold border-b-2 border-b-wheat-gold' : 'text-wheat-dark hover:text-wheat-mid hover:bg-forest-mid'}"
            >
              <span class="font-mono text-[9px] opacity-70">0{idx + 1}</span>
              <span class="truncate">{step.title.split(' ')[0]} {step.title.split(' ')[1] ?? ''}</span>
            </button>
          {/each}
        </nav>

        <!-- Modal Body Content Area -->
        <main class="p-5 overflow-y-auto space-y-4 flex-1 bg-gradient-to-b from-forest-deep to-charcoal-deep/80">
          <div>
            <span class="text-[10px] text-wheat-gold font-mono font-bold">{activeData.badge}</span>
            <h3 class="text-lg font-bold text-wheat-light font-heading mt-0.5">{activeData.title}</h3>
            <p class="text-[11px] text-wheat-mid mt-0.5 leading-relaxed">{activeData.subtitle}</p>
          </div>

          <!-- Section Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each activeData.sections as item}
              <div class="p-3 bg-charcoal-deep/90 border border-charcoal-mid flex flex-col justify-between space-y-1.5 shadow-sm hover:border-wheat-mid/50 transition-colors">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-xs font-bold text-wheat-gold font-heading">{item.label}</span>
                    <span class="text-[9px] px-1.5 py-0.2 bg-forest-mid text-wheat-mid border border-charcoal-mid font-mono">
                      {item.tag}
                    </span>
                  </div>
                  <p class="text-[11px] text-wheat-light/90 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </main>

        <!-- Modal Footer Navigation -->
        <footer class="flex items-center justify-between px-5 py-3.5 bg-charcoal-deep border-t border-charcoal-mid shrink-0">
          <!-- Step Counter -->
          <div class="flex items-center gap-1.5 text-xs text-wheat-dark font-mono">
            <span>الخطوة</span>
            <span class="text-wheat-gold font-bold text-sm">0{currentStep + 1}</span>
            <span>/</span>
            <span>0{STEPS.length}</span>
          </div>

          <!-- Next / Previous Controls -->
          <div class="flex items-center gap-2.5">
            <button
              onclick={handlePrev}
              disabled={currentStep === 0}
              class="px-3.5 py-1.5 border border-charcoal-mid text-xs font-heading font-bold transition-all {currentStep === 0 ? 'opacity-30 cursor-not-allowed text-wheat-dark' : 'text-wheat-mid hover:text-wheat-light hover:border-wheat-mid cursor-pointer'}"
            >
              السابق
            </button>

            {#if currentStep < STEPS.length - 1}
              <button
                onclick={handleNext}
                class="flex items-center gap-1.5 px-4.5 py-1.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep text-xs font-heading font-bold transition-all shadow-md active:translate-y-0.5 cursor-pointer"
              >
                <span>التالي</span>
                <svg class="w-3.5 h-3.5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            {:else}
              <button
                onclick={handleClose}
                class="flex items-center gap-2 px-5 py-1.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep text-xs font-heading font-bold transition-all shadow-xl active:translate-y-0.5 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>بدء الحكم وإغلاق الدليل</span>
              </button>
            {/if}
          </div>
        </footer>
      </div>
    </div>
  </div>
{/if}
