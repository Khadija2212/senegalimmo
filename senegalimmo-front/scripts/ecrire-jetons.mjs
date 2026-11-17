/*
  Écrit src/app/core/config/jetons.ts à partir de MAPBOX_JETON (variable d'environnement
  ou fichier .env du front). Le fichier généré est ignoré par Git : la clé ne vit pas dans le dépôt.
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fichierEnv = resolve(racine, '.env');
const cible = resolve(racine, 'src/app/core/config/jetons.ts');

function lireEnv(chemin) {
  if (!existsSync(chemin)) return {};
  return Object.fromEntries(
    readFileSync(chemin, 'utf8')
      .split('\n')
      .map((ligne) => ligne.trim())
      .filter((ligne) => ligne && !ligne.startsWith('#') && ligne.includes('='))
      .map((ligne) => {
        const i = ligne.indexOf('=');
        return [
          ligne.slice(0, i).trim(),
          ligne
            .slice(i + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ''),
        ];
      }),
  );
}

const jeton = process.env.MAPBOX_JETON ?? lireEnv(fichierEnv).MAPBOX_JETON ?? '';
if (!jeton) {
  process.stderr.write("MAPBOX_JETON absent : la carte ne s'affichera pas (voir .env.example).\n");
}
writeFileSync(
  cible,
  `// Généré par scripts/ecrire-jetons.mjs, ne pas modifier ni commiter.\nexport const MAPBOX_JETON = ${JSON.stringify(jeton)};\n`,
);
