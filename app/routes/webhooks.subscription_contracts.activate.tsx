import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  try {
    await fetch('https://hydro-tracking.vercel.app/api/subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload, null, 2),
    });
  } catch (err) {
    logger.error(err, 'Failed to send rawBody to hydro-tracking');
  }

  logger.info({topic, shop, payload}, 'Received webhook');

  return new Response();
};
