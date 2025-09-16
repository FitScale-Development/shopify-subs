import {json, type LoaderFunctionArgs} from '@remix-run/node';
import {jobs, ScheduleShopsToChargeBillingCyclesJob} from '~/jobs';

// Changed from 'action' to 'loader' to handle GET requests from Vercel Cron
export const loader = async ({request}: LoaderFunctionArgs) => {
  // Vercel Cron sends a GET, so no need to check the method anymore.

  try {
    console.log(
      'Cron job triggered: Enqueuing ScheduleShopsToChargeBillingCyclesJob',
    );

    // This job will enqueue the ChargeBillingCyclesJob for all active shops for the current date
    await jobs.enqueue(
      new ScheduleShopsToChargeBillingCyclesJob({
        targetDate: new Date().toISOString(),
      }),
    );

    console.log('Successfully enqueued ScheduleShopsToChargeBillingCyclesJob.');
    return json({status: 'success'}, {status: 200});
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error in cron job:', error.message);
    return json({status: 'failure', error: error.message}, {status: 500});
  }
};
