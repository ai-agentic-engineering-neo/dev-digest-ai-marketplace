// Active locale. Swap the import to change the whole UI language — all copy
// lives in the locale files, never inline in components.
import { en } from './en';
import type { Messages } from './uk';

export const t: Messages = en;
export type { Messages };
