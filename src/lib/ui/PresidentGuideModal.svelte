<script lang="ts">
  import { uiStore } from '../stores/ui-store';

    const STEPS = [
    {
      id: "mandate",
      badge: "الفصل 01",
      title: "الغاية الاستراتيجية ومهمة الرئاسة",
      subtitle: "الميثاق السيادي لإدارة المرحلة الانتقالية الحرجة (2024 - 2044)",
      spotlight: "none",
      sections: [
        {
          label: "الهدف الوطني الأعلى",
          desc: "أنت تتولى سدة الحكم كرئيس للجمهورية في منعطف تاريخي حرج. هدفك هو قيادة الدولة السورية عبر 40 دوراً نصف سنوي (20 عاماً، دورتان في كل عام: الحصاد والشتاء) للحفاظ على وحدة التراب الوطني وبناء نهضة مؤسساتية مستدامة.",
          tag: "البقاء والسيادة",
        },
        {
          label: "معادلة الحكم والمقايضة",
          desc: "لا توجد سياسة بلا ثمن؛ زيادة الرواتب تمتص الاحتقان لكنها تستنزف الخزينة، وتقليص الدعم يحمي الاحتياطي لكنه قد يشعل الاحتجاجات. فن الحكم يكمن في توزيع الأعباء وإدارة الأولويات دون انكسار الدولة.",
          tag: "المقايضة السيادية",
        },
        {
          label: "بوصلة المصير الوطني (13 نهاية)",
          desc: "تقاس مسيرتك عبر بوصلة سياسية ثنائية الأبعاد (السيادة والوحدة مقابل العقيدة الاقتصادية)، وتتفرع إلى 5 نهايات مئوية كبرى، و3 مسارات للجبهة الجنوبية، و5 خطوط انهيار فوري (Fail States).",
          tag: "المصير الوطني",
        },
        {
          label: "مسار النصر الأسمى (العنقاء السيادية)",
          desc: "لتحقيق النصر التاريخي الكامل: اصمد 40 دوراً، حقق رصيداً وطنياً >= 80، خفّض الفساد دون 40%، ارفع معدل الإعمار >= 65%، حافظ على استقلالية القرار (رافعة >= 50% وديون <= $10B)، وكهرباء >= 12 ساعة، مع وفاق الجنوب.",
          tag: "شروط الانتصار",
        },
      ],
    },
    {
      id: "ribbon",
      badge: "الفصل 02",
      title: "الشريط السيادي واقتصاد الدولة",
      subtitle: "غرفة المراقبة المالية والنقدية المستمرة وإدارة الرصيد السياسي في أعلى الشاشة",
      spotlight: "top-ribbon",
      sections: [
        {
          label: "الخزينة العامة واحتياطي النقد",
          desc: "السيولة المحلية (بالليرة) للأجور والدعم. واحتياطي النقد الأجنبي (بالدولار) لاستيراد القمح والفيول ومستلزمات الإنتاج. يوضح «مؤشر الأمان» عدد الأشهر المتبقية قبل نفاد العملات الصعبة والوقوع في الإفلاس السيادي.",
          tag: "الموازنة والاحتياطي",
        },
        {
          label: "اقتصاد الرصيد السياسي (طرق الكسب)",
          desc: "يُستخدم الرصيد السياسي لتمرير المراسيم والمشاريع. يمكنك شحنه عبر: جلسة مساءلة علنية مجانية كل دور (+8 رصيد دورياً)، استيعاب معارضة التكنوقراط (+18)، خطاب الوحدة (+4)، وتأميم أصول الأوليغارشية (+36 إجمالاً).",
          tag: "شحن الرصيد السياسي",
        },
        {
          label: "سعر الصرف الموازي ومزاد التدخل",
          desc: "سعر صرف الليرة والتضخم يعكسان القدرة الشرائية للمواطنين والقيمة الحقيقية للأجور. يمكنك تفعيل مزاد التدخل الدولاري للمصرف المركزي لضخ العملة الصعبة وكبح تدهور الصرف وامتصاص فائض السيولة النقدية.",
          tag: "الاستقرار النقدي",
        },
        {
          label: "الرافعة السيادية والديون الخارجية",
          desc: "مؤشر استقلالية القرار الوطني؛ الاقتراض المفرط من الصناديق الأجنبية أو رهن الموانئ ومناجم الفوسفات يخفض الرافعة السيادية ويرفع الديون، مما يهدد بتحويل الدولة إلى «إمارة مرهونة للشركات الأجنبية».",
          tag: "السيادة المالية",
        },
      ],
    },
    {
      id: "map",
      badge: "الفصل 03",
      title: "خريطة العمليات الثلاثية الأبعاد",
      subtitle: "طاولة الرمل التكتيكية: استطلاع الحالة الإنشائية والأمنية للمحافظات الـ 14",
      spotlight: "map-viewport",
      sections: [
        {
          label: "ارتفاع الأقاليم (منسوب الإعمار)",
          desc: "تمثل الكتل الجغرافية محافظات الجمهورية الـ 14. يعكس ارتفاع الكتلة منسوب إعادة الإعمار والنشاط الاقتصادي الميداني القائم في المحافظة نتيجة تنفيذ المشاريع الاستراتيجية وتخصيص الطاقة.",
          tag: "البنية التحتية",
        },
        {
          label: "أبراج الطاقة وشبكة الكهرباء",
          desc: "الأبراج الفولاذية تعبر عن ساعات التغذية؛ التوهج الذهبي الوهاج يرمز للاستقرار (12 ساعة فأكثر)، التوهج الخافت يشير للتقنين الحاد، وانطفاء البرج يعني العتمة الشاملة التي تشل المصانع وتفاقم الاحتقان.",
          tag: "الشبكة الوطنية",
        },
        {
          label: "شاخصات حقول الألغام وتطهير الأراضي",
          desc: "الأوتاد التحذيرية وأشرطة الخطر تشير لنسبة تلوث الأراضي الزراعية ومحاور النقل بمخلفات الحرب. إرسال فرق كاسحات الألغام يحرر الأراضي الخصبة ويعيد الفلاحين لمواسم الحصاد.",
          tag: "الأمان الميداني",
        },
        {
          label: "مؤشر الاحتقان الشعبي وأجهزة الإنذار",
          desc: "تتلون الكتل بحسب الحالة الأمنية: الأخضر (مستقرة)، الأصفر (متوترة)، الخمري (اضطرابات مع تنبيه نبضي)، والأحمر القاني (تمرد مسلح مع وميض طوارئ يهدد بعصيان مدني شامل).",
          tag: "الاستقرار المدني",
        },
      ],
    },
    {
      id: "drawers",
      badge: "الفصل 04",
      title: "مجلس الوزراء والمحافظات والجبهة الجنوبية",
      subtitle: "أجنحة القيادة اليومية: إدارة المراسيم، استثمارات الطاقة، وملفات الاستقرار الإقليمي",
      spotlight: "sidebars",
      sections: [
        {
          label: "الجناح الأيمن: مجلس الوزراء والمراسيم",
          desc: "إدارة الوزارات السيادية، التحكم بسلالم الأجور، الدعم السلعي، ومزاد العملة. ويضم ديوان المراسيم لإطلاق هيئة مكافحة الفساد، بوابات استرداد الأملاك، أو جلسات المساءلة الدورية المجانية.",
          tag: "التوجيه المركزي",
        },
        {
          label: "الجناح الأيسر: المشاريع الاستراتيجية اللامركزية",
          desc: "النقر على أي محافظة يفتح ملفها الميداني؛ يمكنك إطلاق مشروعها الاستراتيجي (كمدينة الشيخ نجار بحلب أو سدود الفرات بالرقة)، وتخصيص دفعة الطاقة الاستثنائية، وإرسال كاسحات الألغام.",
          tag: "التنمية الإقليمية",
        },
        {
          label: "ملف الجبهة الجنوبية وسياسات السويداء",
          desc: "عبر لوحة السويداء، يمكنك توجيه سياسة الجبهة الجنوبية: الوفاق التاريخي الشامل (+18 اندماج)، قسائم الإغاثة المحلية المشروطة، المساعدات المفتوحة، أو الحصار الأمني المشدد (مما يفجر الانفصال).",
          tag: "الجبهة الجنوبية",
        },
        {
          label: "استثمار شبكة الكهرباء (CapEx)",
          desc: "تخصيص ميزانية رأسمالية للكهرباء ($30M-$35M/دور) يرفع التغذية إلى 20-24 ساعة/يوم ويدعم تشغيل المعامل والري، متفادياً كارثة الجفاف وتصحر الريف (صحراء العطش).",
          tag: "طاقة الجمهورية",
        },
      ],
    },
    {
      id: "turn",
      badge: "الفصل 05",
      title: "دورة الدور والمصادقة التنفيذية",
      subtitle: "بروتوكول اتخاذ القرارات والتقدم الزمني في مسيرة الحكم",
      spotlight: "command-deck",
      sections: [
        {
          label: "مسودة القرارات والتخطيط المرن",
          desc: "أي قرار أو مرسوم تختاره يُحفظ أولاً في مسودة مؤقتة. تراقب المنصة قيود الموازنة والرصيد السياسي في الوقت الفعلي، وتمنع تجاوز الحدود المتاحة حتى توازن خطتك بإحكام.",
          tag: "التخطيط المرن",
        },
        {
          label: "منصة القيادة ومراجعة الموازنة",
          desc: "الأزرار العائمة أسفل الشاشة تتيح مراجعة إجمالي الالتزامات المالية والسياسية، والتراجع عن المسودة بضغطة واحدة، أو فتح نافذة التدقيق والمصادقة النهائية قبل التنفيذ.",
          tag: "الانضباط المالي",
        },
        {
          label: "المصادقة التنفيذية وإنهاء الدور",
          desc: "بالنقر على «إنهاء الدور والمصادقة»، تُراجع وتؤكد مراسيمك. عندها تتقدم المحاكاة نصف عام، وتُحسب الآثار التراكمية على سعر الصرف، والاحتياطيات، ومعدلات الأجور والاحتقان.",
          tag: "المصادقة الرئاسية",
        },
        {
          label: "الأحداث والأزمات الطارئة",
          desc: "في مطلع كل دور، قد تواجه أحداثاً استثنائية أو أزمات قطاعية طارئة تتطلب تدخلاً رئاسياً حاسماً؛ تزن خياراتك بين التكلفة المالية، والرصيد السياسي، والثقة الشعبية.",
          tag: "إدارة الأزمات",
        },
      ],
    },
    {
      id: "endings",
      badge: "الفصل 06",
      title: "بوصلة المصير الوطني والنهايات الـ 13",
      subtitle: "سجل خطوط الانهيار الفورية ومسارات المئوية التاريخية للجمهورية",
      spotlight: "none",
      sections: [
        {
          label: "خطوط الانهيار الخمسة (Fail States)",
          desc: "تجنب السقوط الفوري: 1) الإفلاس بنفاد الدولار ($0). 2) العصيان المدني (احتقان >=80 وتمرد 4 محافظات). 3) انقلاب الجيش (أجور <$8 وفساد >75%). 4) البلقنة (انفصال السويداء >=85%). 5) الشلل الحكومي (صفر رصيد وصفر ثقة).",
          tag: "خطوط الانهيار",
        },
        {
          label: "نهايات المئوية الخمسة (Century Outcomes)",
          desc: "عند إتمام الدور 40 بنجاح: 1) العنقاء السيادية (نهضة شاملة). 2) الإمارة المرهونة (ديون >$12B أو ارتهان الأصول). 3) صحراء العطش (عتمة وتصحر). 4) حصن الحامية (عسكرة وفساد >70%). 5) الجمهورية المفرغة (نزيف الكفاءات).",
          tag: "المصائر الكبرى",
        },
        {
          label: "مسارات الجبهة الجنوبية الثلاثة",
          desc: "يتحدد مصير حوران وجبل العرب مستقلاً: 1) الجنوب المتصالح والمستقر (وفاق تاريخي واندماج >=80%). 2) مستنقع الكانتونات وشبكات التهريب (انفصال >=60%). 3) الجبهة العازلة والنزاع المجمد (هدنة هشة).",
          tag: "مصير الجنوب",
        },
        {
          label: "نصائح استراتيجية لتحقيق النصر",
          desc: "فعّل جلسات المساءلة كل دور لشحن الرصيد السياسي مجاناً، استثمر $30M في شبكة الكهرباء، طهر الأراضي من الألغام، ونفذ المشاريع الاستراتيجية بالمحافظات لحصد أعلى تقييم وطني.",
          tag: "استراتيجية الفوز",
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
