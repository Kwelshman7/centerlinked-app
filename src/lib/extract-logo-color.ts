/** Sample a logo image and return a saturated dominant hex color. */
export async function extractLogoColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 25) continue;
          if (max > 240 && min > 200) continue;
          if (max < 40) continue;

          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }

        let best: string | null = null;
        let bestCount = 0;
        for (const [key, count] of buckets) {
          if (count > bestCount) {
            bestCount = count;
            best = key;
          }
        }
        if (!best) {
          resolve(null);
          return;
        }

        const [r, g, b] = best.split(",").map(Number);
        resolve(
          `#${[r, g, b]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")}`,
        );
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
