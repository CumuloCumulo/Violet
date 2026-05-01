import { getPalette } from 'colorthief';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #d4eda4 0%, #a1c4fd 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #d4eda4 100%)',
  'linear-gradient(135deg, #fecfef 0%, #ff9a9e 100%)',
];

const cache = new Map<string, string>();

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function getFallbackGradient(id: string): string {
  return FALLBACK_GRADIENTS[hashId(id) % FALLBACK_GRADIENTS.length];
}

export async function extractAuraGradient(avatarUrl: string): Promise<string> {
  if (cache.has(avatarUrl)) return cache.get(avatarUrl)!;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const palette = await getPalette(img, { colorCount: 2 });
        if (palette && palette.length >= 2) {
          const c1 = palette[0].rgb();
          const c2 = palette[1].rgb();
          const gradient = `linear-gradient(135deg, rgb(${c1.r}, ${c1.g}, ${c1.b}) 0%, rgb(${c2.r}, ${c2.g}, ${c2.b}) 100%)`;
          cache.set(avatarUrl, gradient);
          resolve(gradient);
        } else if (palette && palette.length === 1) {
          const c = palette[0].rgb();
          const gradient = `linear-gradient(135deg, rgb(${c.r}, ${c.g}, ${c.b}) 0%, rgb(${c.r}, ${c.g}, ${c.b}) 100%)`;
          cache.set(avatarUrl, gradient);
          resolve(gradient);
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = avatarUrl;
  });
}
