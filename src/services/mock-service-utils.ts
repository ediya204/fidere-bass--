export const mockDelay = async (ms = 250) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const makeReference = (prefix: string) =>
  `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
