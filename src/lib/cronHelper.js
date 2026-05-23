import cron from 'node-cron';
import cronParser from 'cron-parser';

const DAY_MAP = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function parseTime(time) {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
    throw Object.assign(new Error('time must be HH:MM format (e.g. "09:00")'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  const [h, m] = time.split(':').map(Number);
  if (h > 23 || m > 59) {
    throw Object.assign(new Error('time value out of range'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  return { h, m };
}

export function toCronExpression(input) {
  // Raw cron string passed through
  if (typeof input === 'string') {
    if (!cron.validate(input)) {
      throw Object.assign(new Error(`Invalid cron expression: "${input}"`), { status: 400, code: 'VALIDATION_ERROR' });
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
      const dayNum = DAY_MAP[day?.toLowerCase()];
      if (dayNum === undefined) {
        throw Object.assign(new Error(`Invalid day "${day}". Use: ${Object.keys(DAY_MAP).join(', ')}`), { status: 400, code: 'VALIDATION_ERROR' });
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
        throw Object.assign(new Error('Monthly day must be between 1 and 28'), { status: 400, code: 'VALIDATION_ERROR' });
      }
      return `${m} ${h} ${dom} * *`;
    }

    default:
      throw Object.assign(
        new Error(`Unknown frequency "${frequency}". Use: hourly, daily, weekly, weekdays, monthly`),
        { status: 400, code: 'VALIDATION_ERROR' }
      );
  }
}

export function computeNextRun(cronExpression) {
  try {
    const interval = cronParser.parseExpression(cronExpression, { utc: true });
    return interval.next().toISOString();
  } catch {
    return null;
  }
}

export function validateCronExpression(expr) {
  return cron.validate(expr);
}
