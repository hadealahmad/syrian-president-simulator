import type { EventCard } from '../types';
import { MASTER_EVENTS } from './master-events';
import { SOUTHERN_EVENTS } from './southern-events';
import { MONETARY_EVENTS } from './monetary-events';
import { ENERGY_EVENTS } from './energy-events';
import { AGRICULTURE_EVENTS } from './agriculture-events';
import { INDUSTRY_EVENTS } from './industry-events';
import { SOVEREIGNTY_EVENTS } from './sovereignty-events';
import { SERVICES_EVENTS } from './services-events';
import { DISASTER_EVENTS } from './disaster-events';

export {
  MASTER_EVENTS,
  SOUTHERN_EVENTS,
  MONETARY_EVENTS,
  ENERGY_EVENTS,
  AGRICULTURE_EVENTS,
  INDUSTRY_EVENTS,
  SOVEREIGNTY_EVENTS,
  SERVICES_EVENTS,
  DISASTER_EVENTS,
};

/**
 * Consolidated master pool of all 64 events (14 original + 50 new thematic events).
 */
export const ALL_EVENTS: EventCard[] = [
  ...MASTER_EVENTS,
  ...SOUTHERN_EVENTS,
  ...MONETARY_EVENTS,
  ...ENERGY_EVENTS,
  ...AGRICULTURE_EVENTS,
  ...INDUSTRY_EVENTS,
  ...SOVEREIGNTY_EVENTS,
  ...SERVICES_EVENTS,
  ...DISASTER_EVENTS,
];
