import {json, type LoaderFunctionArgs} from '@remix-run/node';
import {jobs, ChargeBillingCyclesJob} from '~/jobs';
import {getShopsWithBillingEnabled} from '~/models/BillingSchedule/BillingSchedule.server';

/**
 * This cron job is a direct trigger to bill all pending subscriptions for all active shops.
 * It bypasses the daily scheduling logic and instead finds every shop
 * and tells it to process any billing cycles due in the last 30 days.
 * This is useful for clearing a backlog of failed or missed payments.
 */
export const loader = async ({request}: LoaderFunctionArgs) => {
  try {
    console.log(
      'Force-billing cron job triggered: Attempting to bill all past-due cycles for ALL shops.',
    );

    const shops = await getShopsWithBillingEnabled();
    console.log(`Found ${shops.length} active shops to process.`);

    // Set a wide date range to catch any and all missed billings from the last 30 days up to today.
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setUTCHours(23, 59, 59, 999);

    for (const shop of shops) {
      console.log(
        `Enqueuing immediate ChargeBillingCyclesJob for shop: ${shop.shop}`,
      );
      await jobs.enqueue(
        new ChargeBillingCyclesJob({
          shop: shop.shop,
          payload: {
            startDate: thirtyDaysAgo.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      );
    }

    console.log(
      'Successfully enqueued all past-due billing jobs for all shops.',
    );
    return json(
      {status: 'success', shopsProcessed: shops.length},
      {status: 200},
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error in force-billing cron job:', error.message);
    return json({status: 'failure', error: error.message}, {status: 500});
  }
};
