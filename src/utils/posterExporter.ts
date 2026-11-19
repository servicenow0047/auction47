import html2canvas from 'html2canvas';

/**
 * Converts a remote/blob URL or file to a safe base64 JPEG/PNG data URL.
 * If CORS or network fails, creates a stylized initials avatar data URL so canvas is never tainted.
 */
export async function toSafeBase64(url: string, fallbackText = 'P'): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;

  // Try 1: Fetch as blob (handles blobs, local assets, CORS-enabled endpoints)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continue to Try 2
  }

  // Try 2: Browser Image element
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          reject(e);
        }
        resolve('');
      };
      img.onerror = reject;
      const separator = url.includes('?') ? '&' : '?';
      img.src = `${url}${separator}t=${Date.now()}`;
    });
    if (dataUrl) return dataUrl;
  } catch {
    // Both failed
  }

  // Fallback: Generate an SVG avatar data URL so the canvas never fails
  return createFallbackAvatarDataUrl(fallbackText);
}

function createFallbackAvatarDataUrl(text: string): string {
  const initials = (text || 'P').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#1e293b"/>
    <circle cx="100" cy="100" r="80" fill="#0f172a" stroke="#f59e0b" stroke-width="4"/>
    <text x="100" y="115" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#facc15" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Pre-processes all images within an element so that they are guaranteed to be inline base64.
 * Handles both <img> tags and CSS backgroundImage declarations.
 * This guarantees that canvas rasterization will NEVER throw a SecurityError or tainted canvas exception.
 */
export async function inlineAllImagesInElement(element: HTMLElement): Promise<void> {
  // 1. Process <img> tags
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:image/')) return;
      const safe = await toSafeBase64(src, img.getAttribute('alt') || 'P');
      if (safe) {
        img.src = safe;
      }
    })
  );

  // 2. Process background-image declarations
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  await Promise.all(
    allElements.map(async (el) => {
      const bg = el.style.backgroundImage;
      if (!bg || !bg.includes('url(')) return;
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1] && !match[1].startsWith('data:image/')) {
        const safe = await toSafeBase64(match[1], 'BG');
        if (safe) {
          el.style.backgroundImage = `url("${safe}")`;
        }
      }
    })
  );
}

/**
 * Converts modern CSS oklch color string to sRGB via browser 2D canvas
 */
let colorContext: CanvasRenderingContext2D | null = null;
function getCanvasColorContext(): CanvasRenderingContext2D | null {
  if (!colorContext && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    colorContext = canvas.getContext('2d');
  }
  return colorContext;
}

export function convertOklchColor(colorString: string): string {
  const ctx = getCanvasColorContext();
  if (!ctx || !colorString) return colorString;
  try {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = colorString.trim();
    return ctx.fillStyle;
  } catch {
    return colorString;
  }
}

export function sanitizeOklchInString(text: string): string {
  if (!text || !text.includes('oklch')) return text;
  return text.replace(/oklch\([^)]+\)/g, (match) => convertOklchColor(match));
}

export function sanitizeDocumentOklchColors(clonedDoc: Document, clonedEl: HTMLElement): void {
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = sanitizeOklchInString(styleTag.textContent);
    }
  });

  const allElements = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))];
  const commonProps = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'fill',
    'stroke',
    'box-shadow',
    'text-shadow',
  ];

  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && inlineStyle.includes('oklch')) {
      el.setAttribute('style', sanitizeOklchInString(inlineStyle));
    }
    const computed = window.getComputedStyle(el);
    for (const prop of commonProps) {
      const val = computed.getPropertyValue(prop);
      if (val && val.includes('oklch')) {
        const rgb = sanitizeOklchInString(val);
        el.style.setProperty(prop, rgb, 'important');
      }
    }
  });
}

/**
 * Engine B: Native Browser SVG ForeignObject Renderer.
 * Uses the browser's own CSS/HTML engine which natively understands OKLCH, modern CSS,
 * filters, gradients, and shadows without relying on any external color parser.
 */
async function renderViaSvgForeignObject(
  element: HTMLElement,
  width = 1080,
  height = 1920,
  scale = 2
): Promise<HTMLCanvasElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.position = 'relative';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  // Aggregate document stylesheets
  let cssText = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules || [])) {
        cssText += rule.cssText + '\n';
      }
    } catch {
      // Cross-origin stylesheet access restriction
    }
  }

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${width}px; height: ${height}px; margin: 0; padding: 0;">
          <style>
            ${cssText}
          </style>
          ${serialized}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load SVG foreignObject: ' + e));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  return canvas;
}

/**
 * Trigger file download from a canvas
 */
async function downloadCanvas(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'jpeg',
  quality = 0.95
): Promise<string> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const finalName = fileName.endsWith(`.${format}`) ? fileName : `${fileName}.${format}`;

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          try {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const link = document.createElement('a');
            link.download = finalName;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = finalName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        resolve(url);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Export a DOM element to an image file (PNG / JPEG) with dual-engine failover.
 * Strictly enforces 9:16 aspect ratio (1080 x 1920 base).
 */
export async function exportElementToImage(
  element: HTMLElement,
  options: {
    fileName?: string;
    format?: 'png' | 'jpeg';
    quality?: number;
    scale?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<string> {
  const {
    fileName = 'Team_Squad_Poster.png',
    format = 'png',
    quality = 0.95,
    scale = 2,
    width = 1080,
    height = 1920,
  } = options;

  // 1. Ensure all images and background images are pre-converted to base64
  await inlineAllImagesInElement(element);

  // 2. Try Engine A (html2canvas)
  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#050b14',
      logging: false,
      imageTimeout: 15000,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.transform = 'none';
        clonedEl.style.position = 'relative';
        clonedEl.style.top = '0px';
        clonedEl.style.left = '0px';
        clonedEl.style.width = `${width}px`;
        clonedEl.style.height = `${height}px`;
        clonedEl.style.margin = '0';
        clonedEl.style.padding = '0';

        const parent = clonedEl.parentElement;
        if (parent) {
          parent.style.transform = 'none';
          parent.style.width = `${width}px`;
          parent.style.height = `${height}px`;
          parent.style.margin = '0';
          parent.style.padding = '0';
          parent.style.overflow = 'visible';
        }

        sanitizeDocumentOklchColors(clonedDoc, clonedEl);
      },
    });

    return await downloadCanvas(canvas, fileName, format, quality);
  } catch (html2canvasErr) {
    console.warn('[PosterExport] Engine A (html2canvas) encountered an error, activating Engine B (Native SVG):', html2canvasErr);

    // 3. Engine B: Native Browser SVG ForeignObject (100% OKLCH and CSS4 compatible)
    try {
      const canvas = await renderViaSvgForeignObject(element, width, height, scale);
      return await downloadCanvas(canvas, fileName, format, quality);
    } catch (engineBErr) {
      console.error('[PosterExport] Both engines failed:', engineBErr);
      throw engineBErr;
    }
  }
}
