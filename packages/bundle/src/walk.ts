import fs from 'fs/promises'
import path from 'path'

type FileStat = {
  file: string
  stat: import('fs').Stats
}

function byDirAndName(a: FileStat, b: FileStat): number {
  const aIsDir = a.stat.isDirectory()
  const bIsDir = b.stat.isDirectory()
  if (aIsDir == bIsDir) {
    return a.file < b.file ? -1 : 1
  }
  return aIsDir ? -1 : 1
}

const iterate = async<T, G>(items: T[], fn: (t: T) => Promise<G[]>): Promise<G[]> => {
  let i = 0
  const result: G[] = []
  const next = async (): Promise<G[]> => {
    if (i == items.length) {
      return result
    }
    return fn(items[i++])
      .then(r => result.push(...r))
      .then(next)
  }
  return next()
}

export async function walkDir(baseDir: string, dir: string = '.', fileFilter: ((s: string) => boolean) = () => true): Promise<string[]> {
  const files = await fs.readdir(path.resolve(baseDir, dir))
  let fileStats = await Promise.all(files.map(file => fs.stat(path.resolve(baseDir, dir, file)).then(stat => ({ file, stat }))))

  fileStats = fileStats
    .filter(fileStat => fileFilter(path.posix.join(dir, fileStat.file)))
    .sort(byDirAndName)

  const filenames = await iterate<FileStat, string>(fileStats, async (fileStat) => {
    const filename = path.posix.join(dir, fileStat.file)
    if (fileStat.stat.isDirectory()) {
      return walkDir(baseDir, filename, fileFilter)
    }
    return [filename]
  })

  return filenames
}