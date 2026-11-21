let applyUpdate: (() => Promise<void>) | null = null;

export const setPwaUpdate = (apply: () => Promise<void>): void => {
  applyUpdate = apply;
};

export const applyPwaUpdate = async (): Promise<void> => {
  await applyUpdate?.();
};
