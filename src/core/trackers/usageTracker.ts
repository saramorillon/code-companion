import { claudeProjectsDir, fileCreatedAt, findJsonlFiles, fileSize, readNewTokensSince } from '../claudeUsageReader.js'

export type FileOffsets = Record<string, number>

// Scanne tous les fichiers .jsonl connus, lit les octets ajoutés depuis le dernier offset,
// et retourne le total de nouveaux tokens ainsi que la table d'offsets mise à jour.
//
// Un fichier jamais vu auparavant (absent de previousOffsets) peut être dans deux situations très
// différentes : une session déjà ancienne qu'on découvre seulement maintenant (son passé ne doit
// pas être compté rétroactivement), ou une toute nouvelle session créée depuis installBaselineAt
// (tout son contenu est légitimement nouveau et doit être compté, même si on ne la découvre que
// plusieurs cycles de scan plus tard). On tranche sur la date de création du fichier, pas sur le
// moment où on le découvre — sinon un fichier créé juste avant un scan mais lu seulement au scan
// suivant perdrait les tokens déjà écrits dans l'intervalle.
export async function scanForNewTokens(
  previousOffsets: FileOffsets,
  installBaselineAt: Date,
): Promise<{ tokens: number; offsets: FileOffsets }> {
  const files = await findJsonlFiles(claudeProjectsDir())
  const offsets: FileOffsets = { ...previousOffsets }
  let tokens = 0

  for (const file of files) {
    const knownOffset = offsets[file]
    if (knownOffset === undefined) {
      const createdAt = await fileCreatedAt(file)
      offsets[file] = createdAt < installBaselineAt ? await fileSize(file) : 0
    }

    const result = await readNewTokensSince(file, offsets[file]!)
    tokens += result.tokens
    offsets[file] = result.newOffset
  }

  return { tokens, offsets }
}
