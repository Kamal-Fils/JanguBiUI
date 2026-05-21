import { delay } from 'msw';

export const networkDelay = () => {
  const delayTime = process.env.TEST
    ? 0
    : Math.floor(Math.random() * 700) + 300;
  return delay(delayTime);
};
