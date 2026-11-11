import { continueRender, delayRender, staticFile } from "remotion";

export const LATIN = "PoppinsEdit";
export const ARABIC = "CairoEdit";

const FACES: [string, string, number][] = [
  [LATIN, "fonts/poppins-latin-800-normal.woff2", 800],
  [LATIN, "fonts/poppins-latin-900-normal.woff2", 900],
  [ARABIC, "fonts/cairo-arabic-900-normal.woff2", 900],
];

let loaded = false;

export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Loading fonts");
  Promise.all(
    FACES.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
        weight: String(weight),
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
