import cronParser from 'cron-parser';

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export class ScheduleValidationError extends Error {
  status = 400;
  code = 'VALIDATION_ERROR';
}

function parseTime(time?: string) {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
    throw new ScheduleValidationError('time must be HH:MM format (e.g. "09:00")');
  }
  const [h, m] = time.split(':').map(Number);
  if (h > 23 || m > 59) {
    throw new ScheduleValidationError('time value out of range');
  }
  return { h, m };
}

export function validateCronExpression(expr: string): boolean {
  try {
    cronParser.parseExpression(expr, { utc: true });
    return true;
  } catch {
    return false;
  }
}

export type FrequencyInput = { frequency: string; time?: string; day?: string };

export function toCronExpression(input: string | FrequencyInput): string {
  if (typeof input === 'string') {
    if (!validateCronExpression(input)) {
      throw new ScheduleValidationError(`Invalid cron expression: "${input}"`);
    }
    return input;
  }

  const { frequency, time, day } = input;

  switch (frequency) {
    case 'hourly':
      return '0 * * * *';

    case 'daily': {
      const { h, m } = parseTime(time);
      return `${m} ${h} * * *`;
    }

    case 'weekly': {
      const { h, m } = parseTime(time);
      const dayNum = DAY_MAP[day?.toLowerCase() ?? ''];
      if (dayNum === undefined) {
        throw new ScheduleValidationError(`Invalid day "${day}". Use: ${Object.keys(DAY_MAP).join(', ')}`);
      }
      return `${m} ${h} * * ${dayNum}`;
    }

    case 'weekdays': {
      const { h, m } = parseTime(time);
      return `${m} ${h} * * 1-5`;
    }

    case 'monthly': {
      const { h, m } = parseTime(time);
      const dom = Math.min(Number(day) || 1, 28);
      if (dom < 1) {
        throw new ScheduleValidationError('Monthly day must be between 1 and 28');
      }
      return `${m} ${h} ${dom} * *`;
    }

    default:
      throw new ScheduleValidationError(
        `Unknown frequency "${frequency}". Use: hourly, daily, weekly, weekdays, monthly`,
      );
  }
}

export function computeNextRun(cronExpression: string): string | null {
  try {
    const interval = cronParser.parseExpression(cronExpression, { utc: true });
    return interval.next().toISOString();
  } catch {
    return null;
  }
}
