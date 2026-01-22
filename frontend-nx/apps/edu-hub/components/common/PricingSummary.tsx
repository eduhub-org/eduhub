import { FC, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { MdCheckBox, MdWarning, MdOpenInNew } from 'react-icons/md';

/**
 * Represents an addon item in the pricing summary.
 * Compatible with CourseAddonMapping GraphQL type.
 */
export interface AddonItem {
  id: number;
  description: string;
  validatedPrice: number;
  currency: string;
  questionTextDe?: string | null;
  questionTextEn?: string | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
}

/**
 * Props for the PricingSummary component.
 */
export interface PricingSummaryProps {
  /** Base price in cents */
  basePrice: number;
  /** Currency code (e.g., 'EUR', 'USD') */
  currency: string;
  /** Stripe product ID for the base price (optional) */
  stripeProductId?: string | null;
  /** Stripe price ID for the base price (optional, reserved for future use) */
  stripePriceId?: string | null;
  /** Array of addon items */
  addons?: AddonItem[];
  /** Whether to show Stripe synchronization status (default: false) */
  showStripeStatus?: boolean;
  /** Whether to show the total price (default: true) */
  showTotal?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PricingSummary component displays course pricing information including base price,
 * addons, and total. Supports Stripe synchronization status display for admin views.
 *
 * @example
 * ```tsx
 * <PricingSummary
 *   basePrice={5000}
 *   currency="EUR"
 *   stripeProductId="prod_123"
 *   addons={addonMappings}
 *   showStripeStatus={true}
 * />
 * ```
 */
export const PricingSummary: FC<PricingSummaryProps> = ({
  basePrice,
  currency,
  stripeProductId,
  stripePriceId: _stripePriceId, // Reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addons = [],
  showStripeStatus = false,
  showTotal = true,
  className = '',
}) => {
  const t = useTranslations();
  const router = useRouter();
  const locale = router?.locale || 'de';

  /**
   * Formats a price in cents to a human-readable string with locale-aware decimal separator.
   * @param priceInCents - Price in cents
   * @param curr - Currency code
   * @returns Formatted price string (e.g., "50,00 EUR" for German, "50.00 EUR" for English)
   */
  const formatPrice = useCallback((priceInCents: number, curr: string): string => {
    const price = priceInCents / 100;
    const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(price)} ${curr}`;
  }, [locale]);

  /**
   * Filters out invalid addons (missing required fields).
   */
  const validAddons = useMemo(() => {
    return addons.filter((addon) => addon?.id && addon?.description?.trim() && addon?.validatedPrice >= 0 && addon?.currency);
  }, [addons]);

  const basePriceValue = Math.max(0, basePrice || 0);
  const currencyValue = currency?.trim() || 'EUR';

  /**
   * Calculates the total price.
   */
  const total = useMemo(() => {
    const addonsTotal = validAddons.reduce((sum, addon) => sum + addon.validatedPrice, 0);
    return basePriceValue + addonsTotal;
  }, [basePriceValue, validAddons]);

  /**
   * Gets the localized question text for an addon.
   */
  const getLocalizedQuestionText = useCallback(
    (addon: AddonItem): string | null => {
      if (locale === 'de') {
        return addon.questionTextDe || addon.questionTextEn || null;
      }
      return addon.questionTextEn || addon.questionTextDe || null;
    },
    [locale]
  );

  return (
    <section 
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className} overflow-hidden`}
      aria-label={t('pricing_summary.title')}
    >
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        {t('pricing_summary.title')}
      </h4>

      <div className="space-y-3 overflow-hidden">
        {/* Base Price with Stripe Status */}
        {basePriceValue > 0 && (
          <div className="flex justify-between items-start py-2 border-b border-gray-100 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-800">
                  {t('pricing_summary.base_price')}
                </span>
                <span 
                  className="text-sm font-medium text-gray-900 ml-2 flex-shrink-0"
                  aria-label={`${t('pricing_summary.base_price')}: ${formatPrice(basePriceValue, currencyValue)}`}
                >
                  {formatPrice(basePriceValue, currencyValue)}
                </span>
              </div>
              {showStripeStatus && (
                <output className="mt-2 block" aria-live="polite">
                  {stripeProductId ? (
                    <div className="space-y-1">
                      <StripeStatusBadge 
                        productId={stripeProductId} 
                        showLink={false}
                        truncateLength={20}
                      />
                      <a
                        href={`https://dashboard.stripe.com/products/${stripeProductId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
                        aria-label={`${t('manageCourse.pricing.view_in_stripe')} - ${stripeProductId}`}
                      >
                        {t('manageCourse.pricing.view_in_stripe')}
                        <MdOpenInNew className="h-3 w-3 ml-1" aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <StripeStatusBadge 
                      productId={undefined} 
                      showLink={false}
                    />
                  )}
                </output>
              )}
            </div>
          </div>
        )}

        {/* Addons */}
        {validAddons.length > 0 && (
          <div className="space-y-2 overflow-hidden">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('pricing_summary.addons')}
            </span>
            {validAddons.map((addon) => {
              const questionText = getLocalizedQuestionText(addon);
              
              return (
                <div 
                  key={addon.id}
                  className="flex justify-between items-start py-2 border-b border-gray-50 gap-4"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-sm text-gray-800 block">{addon.description}</span>
                    {showStripeStatus && (
                      <div className="mt-1">
                        {questionText && (
                          <p className="text-xs text-gray-500 mt-0.5 break-words">
                            {questionText}
                          </p>
                        )}
                        <StripeStatusBadge 
                          productId={addon.stripeProductId}
                          showLink={true}
                          size="small"
                          truncateLength={20}
                        />
                      </div>
                    )}
                  </div>
                  <span 
                    className="text-sm font-medium text-gray-900 flex-shrink-0"
                    aria-label={`${addon.description}: ${formatPrice(addon.validatedPrice, currencyValue)}`}
                  >
                    {formatPrice(addon.validatedPrice, currencyValue)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        {showTotal && (basePriceValue > 0 || validAddons.length > 0) && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-900">
              {t('pricing_summary.total')}
            </span>
            <span 
              className="text-base font-bold text-gray-900"
              aria-label={`${t('pricing_summary.total')}: ${formatPrice(total, currencyValue)}`}
            >
              {formatPrice(total, currencyValue)}
            </span>
          </div>
        )}

        {/* Empty state */}
        {basePriceValue === 0 && validAddons.length === 0 && (
          <output className="text-sm text-gray-500 italic block">
            {t('pricing_summary.no_pricing')}
          </output>
        )}
      </div>
    </section>
  );
};

/**
 * Props for the StripeStatusBadge component.
 */
interface StripeStatusBadgeProps {
  /** Stripe product ID (null/undefined means not synced) */
  productId?: string | null;
  /** Whether to show a link to Stripe dashboard */
  showLink?: boolean;
  /** Size variant (reserved for future use) */
  size?: 'small' | 'normal';
  /** Maximum length before truncating the product ID */
  truncateLength?: number;
}

/**
 * StripeStatusBadge displays the synchronization status of a Stripe product.
 * Shows a warning if not synced, or a success indicator with product ID if synced.
 */
const StripeStatusBadge: FC<StripeStatusBadgeProps> = ({ 
  productId, 
  showLink = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  size: _size = 'normal', // Reserved for future use
  truncateLength = 20
}) => {
  const t = useTranslations();
  const textSize = 'text-xs';
  
  const truncateId = useCallback((id: string | null | undefined): string => {
    if (!id) return '';
    return id.length <= truncateLength ? id : `${id.substring(0, truncateLength)}...`;
  }, [truncateLength]);
  
  if (!productId) {
    return (
      <output 
        className={`flex items-center ${textSize} text-amber-600 mt-1`}
        aria-label={t('pricing_summary.not_synced')}
      >
        <MdWarning className="h-3 w-3 mr-1 flex-shrink-0" aria-hidden="true" />
        <span className="break-words">{t('pricing_summary.not_synced')}</span>
      </output>
    );
  }

  const truncatedId = truncateId(productId);
  const stripeUrl = `https://dashboard.stripe.com/products/${productId}`;

  return (
    <output className={`flex items-center gap-2 ${textSize} mt-1 flex-wrap`}>
      <span className="flex items-center text-green-600 flex-shrink-0">
        <MdCheckBox className="h-3 w-3 mr-1" aria-hidden="true" />
        {t('pricing_summary.synced')}
      </span>
      <code 
        className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 text-xs break-all max-w-full" 
        title={productId}
        aria-label={`Stripe Product ID: ${productId}`}
      >
        {truncatedId}
      </code>
      {showLink && (
        <a
          href={stripeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
          aria-label={`${t('pricing_summary.synced')} - View in Stripe: ${productId}`}
        >
          <MdOpenInNew className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </output>
  );
};

export default PricingSummary;
