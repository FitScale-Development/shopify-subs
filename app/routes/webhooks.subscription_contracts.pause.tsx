import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  const url = new URL('https://hydro-tracking.vercel.app/api/event');
  url.searchParams.append('event', 'INIT');
  url.searchParams.append('path', '/shopify');
  url.searchParams.append('senderId', 'asdf');

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!res.ok) {
      console.error('Failed to track event', res.status, await res.text());
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }

  logger.info({topic, shop, payload}, 'Received webhook');

  return new Response();
};
