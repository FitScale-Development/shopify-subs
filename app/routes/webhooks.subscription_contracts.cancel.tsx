import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';
import {CustomerSendEmailJob, jobs, MerchantSendEmailJob} from '~/jobs';
import {CustomerEmailTemplateName} from '~/services/CustomerSendEmailService';
import type {Jobs, Webhooks} from '~/types';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  try {
    await fetch('https://hydro-tracking.vercel.app/api/subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload, null, 2),
    });
  } catch (err) {
    logger.error(err, 'Failed to send rawBody to hydro-tracking');
  }

  const emailParams: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
    shop,
    payload: {
      ...(payload as Webhooks.SubscriptionContractStatusChange),
      emailTemplate: CustomerEmailTemplateName.SubscriptionCancelled,
    },
  };

  const merchantParams: Jobs.Parameters<Webhooks.SubscriptionContractId> = {
    shop,
    payload: {
      admin_graphql_api_id: payload.admin_graphql_api_id,
    },
  };

  jobs.enqueue(new CustomerSendEmailJob(emailParams));
  jobs.enqueue(new MerchantSendEmailJob(merchantParams));

  return new Response();
};
