// This file is intentionally kept minimal.
// The original @mswjs/data-based db has been replaced by
// simple in-memory data generators in src/testing/data-generators.ts
// and static MSW handlers in src/testing/mocks/handlers/.

export const db = {};
export type Model = never;
export const initializeDb = (): Promise<void> => Promise.resolve();
export const resetDb = (): Promise<void> => Promise.resolve();
