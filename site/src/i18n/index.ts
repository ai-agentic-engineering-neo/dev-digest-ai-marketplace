// Active locale. Swap the import to change the whole UI language — all copy
// lives in the locale files, never inline in components.
import { en, type Messages } from './en';

export const t: Messages = en;
export type { Messages };
