# SikkerHandel

Single page app til at præsentere SikkerHandel fra Gul&Gratis.

Bygget med React, TypeScript, Vite og Tailwind CSS. Kører på [Bun](https://bun.sh).

## Kom i gang

```bash
bun install
bun run dev      # udviklingsserver på http://localhost:5173/guloggartis/
bun run build    # byg til dist/
bun run preview  # se det byggede resultat lokalt
bun run lint     # lint med oxlint
```

## Deploy

Hvert push til `main` bygger og deployer automatisk til GitHub Pages via `.github/workflows/deploy.yml`.

Første gang skal GitHub Pages slås til: **Settings → Pages → Source: GitHub Actions**.

Siden ligger på https://khojgaardkroyer-stack.github.io/guloggartis/
