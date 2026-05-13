import { useState } from 'react';
import { t, useLang } from '../shared/lib/i18n';
import { Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// ============================================================
// Onboarding — приветственный тур для новых пользователей
// ============================================================

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: '🐜',
    titleKey: 'onboarding.step1.title',
    descKey: 'onboarding.step1.description',
    detailKeys: [
      'onboarding.step1.detail1',
      'onboarding.step1.detail2',
      'onboarding.step1.detail3',
      'onboarding.step1.detail4',
    ],
  },
  {
    icon: '📁',
    titleKey: 'onboarding.step2.title',
    descKey: 'onboarding.step2.description',
    detailKeys: [
      'onboarding.step2.detail1',
      'onboarding.step2.detail2',
      'onboarding.step2.detail3',
      'onboarding.step2.detail4',
    ],
  },
  {
    icon: '🤖',
    titleKey: 'onboarding.step3.title',
    descKey: 'onboarding.step3.description',
    detailKeys: [
      'onboarding.step3.detail1',
      'onboarding.step3.detail2',
      'onboarding.step3.detail3',
      'onboarding.step3.detail4',
    ],
  },
  {
    icon: '📊',
    titleKey: 'onboarding.step4.title',
    descKey: 'onboarding.step4.description',
    detailKeys: [
      'onboarding.step4.detail1',
      'onboarding.step4.detail2',
      'onboarding.step4.detail3',
      'onboarding.step4.detail4',
    ],
  },
  {
    icon: '⌨️',
    titleKey: 'onboarding.step5.title',
    descKey: 'onboarding.step5.description',
    detailKeys: [
      'onboarding.step5.detail1',
      'onboarding.step5.detail2',
      'onboarding.step5.detail3',
      'onboarding.step5.detail4',
    ],
  },
];

export function Onboarding({ onComplete }: Props) {
  const [lang] = useLang();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-xl font-bold mb-2">{t(current.titleKey)}</h2>
          <p className="text-sm text-muted-foreground-foreground mb-6">{t(current.descKey)}</p>

          <div className="space-y-2 text-left">
            {current.detailKeys.map((detailKey, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success flex-shrink-0" />
                <span>{t(detailKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('onboarding.back')}
          </button>

          <span className="text-xs text-muted-foreground-foreground">
            {t('onboarding.stepIndicator', { current: step + 1, total: STEPS.length })}
          </span>

          {isLast ? (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1"
            >
              {t('onboarding.start')}
              <Zap className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {t('onboarding.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="pb-4 text-center">
          <button
            onClick={onComplete}
            className="text-xs text-muted-foreground-foreground hover:text-foreground transition-colors"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
