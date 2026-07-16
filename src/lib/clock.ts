export interface Clock {
  readonly now: () => Date;
}

export const systemClock: Clock = {
  now() {
    return new Date();
  },
};

export function fixedClock(date: Date): Clock {
  return {
    now() {
      return date;
    },
  };
}
