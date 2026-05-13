// ============================================================
// BL-047: SaaS Monetization — Pricing Page
// ============================================================

import { useState, useEffect } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  agents_limit: number;
  projects_limit: number;
  features: string[];
  popular: boolean;
}

export default function Pricing() {
  const [lang] = useLang();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('/api/saas/pricing').then(r => r.json()).then(d => setTiers(d.tiers || []));
    fetch('/api/saas/metrics').then(r => r.json()).then(setMetrics);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t('pricing.title')}</h1>
        <p className="text-muted-foreground-foreground mt-2">{t('pricing.subtitle')}</p>

        {/* Period toggle */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPeriod('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${period === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {t('pricing.monthly')}
          </button>
          <button onClick={() => setPeriod('annual')}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${period === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {t('pricing.annual')} <span className="text-xs text-green-400">-20%</span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map(tier => (
          <div key={tier.id}
            className={`bg-card border rounded-xl p-5 relative transition-all hover:scale-[1.02] ${
              tier.popular ? 'border-primary ring-1 ring-primary/30' : 'border-border'
            }`}>
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                Популярный
              </div>
            )}
            <h3 className="text-lg font-bold">{tier.name}</h3>
            <p className="text-xs text-muted-foreground-foreground mt-1">{tier.description}</p>

            <div className="mt-4 mb-4">
              <span className="text-3xl font-bold">
                ${period === 'monthly' ? tier.price_monthly : tier.price_annual}
              </span>
              {tier.price_monthly > 0 && (
                <span className="text-muted-foreground-foreground text-sm">/{period === 'monthly' ? 'мес' : 'мес'}</span>
              )}
            </div>

            <div className="text-xs text-muted-foreground-foreground mb-4 space-y-1">
              <div>Агенты: {tier.agents_limit === -1 ? '∞' : tier.agents_limit}</div>
              <div>Проекты: {tier.projects_limit === -1 ? '∞' : tier.projects_limit}</div>
            </div>

            <ul className="space-y-1.5 mb-6">
              {tier.features.map((f, i) => (
                <li key={i} className="text-xs flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>

            <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              tier.popular
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/80'
            }`}>
              {tier.id === 'free' ? 'Начать бесплатно' : tier.id === 'enterprise' ? 'Связаться' : 'Попробовать 14 дней'}
            </button>
          </div>
        ))}
      </div>

      {/* SaaS Metrics */}
      {metrics && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Метрики платформы</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">${metrics.mrr}</div>
              <div className="text-xs text-muted-foreground-foreground">MRR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${metrics.arr}</div>
              <div className="text-xs text-muted-foreground-foreground">ARR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.total_subscriptions}</div>
              <div className="text-xs text-muted-foreground-foreground">Подписки</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.active_trials}</div>
              <div className="text-xs text-muted-foreground-foreground">Активные триалы</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
