type ShareOrCopyOptions = {
  url: string;
  title?: string;
  onSuccess?: () => void;
};

export async function shareOrCopyUrl({ url, title, onSuccess }: ShareOrCopyOptions): Promise<boolean> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (typeof navigator !== "undefined" && nav.share) {
    try {
      await nav.share({ url, title });
      onSuccess?.();
      return true;
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    onSuccess?.();
    return true;
  } catch {
    return false;
  }
}
