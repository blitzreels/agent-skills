/**
 * Generated or real footage as a seekable layer: frames pre-extracted to JPEG at the film's fps
 * (scripts/generate.mjs does this), so frame t is an exact image, never a browser video seek.
 * seek() returns a promise that resolves once the frame is decoded, and the runtime waits for it.
 */
export function footage(el, { dir, count, fps, loop, fit }) {
  const img = document.createElement("img");
  img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:${fit ?? "cover"};`;
  el.appendChild(img);
  let current = -1;
  return {
    seek({ t, at, rate }) {
      const local = Math.max(0, (t - at) * (rate ?? 1));
      const raw = Math.floor(local * fps + 1e-6);
      const index = loop ? raw % count : Math.min(count - 1, raw);
      if (index === current) return Promise.resolve();
      current = index;
      img.src = `${dir}/${String(index + 1).padStart(5, "0")}.jpg`;
      return img.decode().catch(() => {});
    },
  };
}
