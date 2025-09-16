import {json, type ActionFunctionArgs} from '@remix-run/node';
import {jobs, ScheduleShopsToChargeBillingCyclesJob} from '~/jobs';

export const action = async ({request}: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    // This job's constructor expects the payload properties directly.
    await jobs.enqueue(
      new ScheduleShopsToChargeBillingCyclesJob({
        targetDate: new Date().toISOString(),
      }),
    );

    return json({status: 'success'}, {status: 200});
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error in cron job:', error.message);
    return json({status: 'failure', error: error.message}, {status: 500});
  }
};
