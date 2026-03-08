import { PlayClient } from '../services/play-client.js';

/** Price schema for InAppProduct: { priceMicros, currency } */
function toPrice(priceUsd: number): { priceMicros: string; currency: string } {
  return {
    priceMicros: String(Math.round(priceUsd * 1_000_000)),
    currency: 'USD',
  };
}

/** Money schema for Subscription: { units, nanos, currencyCode } */
function toMoney(priceUsd: number): { units: string; nanos: number; currencyCode: string } {
  const units = Math.floor(priceUsd);
  const nanos = Math.round((priceUsd - units) * 1e9);
  return {
    units: String(units),
    nanos,
    currencyCode: 'USD',
  };
}

export class IapHandlers {
  constructor(private client: PlayClient) {}

  /**
   * List in-app products (managed products) for an app
   */
  async listInAppProducts(args: { packageName?: string; maxResults?: number }): Promise<any> {
    const pkg = args.packageName || this.client.getPackageName();
    const publisher = this.client.getPublisher();
    const res = await publisher.inappproducts.list({
      packageName: pkg,
      maxResults: args.maxResults ?? 100,
    });
    return res.data;
  }

  /**
   * Create a managed in-app product (one-time purchase, e.g. lifetime unlock)
   */
  async createInAppProduct(args: {
    packageName?: string;
    productId: string;
    title: string;
    description: string;
    priceUsd: number;
    autoConvertMissingPrices?: boolean;
  }): Promise<any> {
    const pkg = args.packageName || this.client.getPackageName();
    const publisher = this.client.getPublisher();
    const defaultPrice = toPrice(args.priceUsd);

    const resource = {
      packageName: pkg,
      sku: args.productId,
      status: 'active' as const,
      purchaseType: 'managedUser' as const,
      defaultPrice,
      defaultLanguage: 'en-US',
      listings: {
        'en-US': {
          title: args.title,
          description: args.description,
        },
      },
    };

    const res = await publisher.inappproducts.insert({
      packageName: pkg,
      requestBody: resource,
      autoConvertMissingPrices: args.autoConvertMissingPrices ?? true,
    });
    return res.data;
  }

  /**
   * List subscriptions for an app
   */
  async listSubscriptions(args: { packageName?: string; pageSize?: number }): Promise<any> {
    const pkg = args.packageName || this.client.getPackageName();
    const publisher = this.client.getPublisher();
    const res = await publisher.monetization.subscriptions.list({
      packageName: pkg,
      pageSize: args.pageSize ?? 100,
    });
    return res.data;
  }

  /**
   * Create a subscription (monthly or yearly)
   */
  async createSubscription(args: {
    packageName?: string;
    productId: string;
    title: string;
    description: string;
    priceUsd: number;
    duration: 'P1M' | 'P1Y';
    regionsVersion?: string;
  }): Promise<any> {
    const pkg = args.packageName || this.client.getPackageName();
    const publisher = this.client.getPublisher();
    const price = toMoney(args.priceUsd);
    const regionsVersion = args.regionsVersion ?? '2022/01';

    const basePlanId = args.duration === 'P1M' ? 'monthly' : 'yearly';

    const subscription = {
      packageName: pkg,
      productId: args.productId,
      listings: [
        {
          languageCode: 'en-US',
          title: args.title,
          description: args.description,
          benefits: ['Unlimited quizzes', 'Unlimited questions', 'All flashcard features'],
        },
      ],
      basePlans: [
        {
          basePlanId,
          state: 'DRAFT' as const,
          autoRenewingBasePlanType: {
            billingPeriodDuration: args.duration,
          },
          regionalConfigs: [
            {
              regionCode: 'US',
              newSubscriberAvailability: true,
              price,
            },
          ],
        },
      ],
    };

    const res = await publisher.monetization.subscriptions.create({
      packageName: pkg,
      productId: args.productId,
      'regionsVersion.version': regionsVersion,
      requestBody: subscription,
    });
    return res.data;
  }
}
