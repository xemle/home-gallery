import os from 'os'
import path from 'path'

import { logger } from './log'
import { uniq } from './utils'
import { RunStep, Mapping, readConfig, Target } from './config'
import { runSimple } from './run'
import { resolvePackages } from './dependency-tree'
import { matchPlatformArch, getFilter } from './filter'
import { writeArchive } from './archive'
import { pack } from './caxa'
import { updateHash } from './update-hash'
import { symlink } from './symlink'

export { BundleConfig, Pattern, RunStep, PlatformArch } from './config'

const log = logger.child({module: 'main'});

const toMapping = (mappings: Mapping[], platform: string, arch: string) => {
    const targetMappings = mappings.filter(mapping => matchPlatformArch(mapping, platform, arch))
    targetMappings.forEach(mapping => log.info(`Map '${mapping.from}' -> '${mapping.to}'`))
    return (name: string) => {
        let result = name;
        targetMappings.forEach(({from, to}) => {
            result = result.replace(from, to)
        })
        return result
    }
}

const runSteps = async (steps: RunStep[], platform: string, arch: string) => {
    const matching = steps.filter(step => matchPlatformArch(step, platform, arch))
    for (const step of matching) {
        await runSimple(step.command)
    }
}

const filterTargets = (targets: Target[], filter: string | undefined) => {
    if (!filter) {
        return targets
    }

    const whitelist = filter.split(',')
    return targets.filter(target => {
        const platformArch = `${target.platform}-${target.arch}`
        return whitelist.indexOf(platformArch) >= 0
    })
}

export interface BundleOptions {
    version: string
    bundleFile?: string
    filter?: string
    noBefore?: boolean
    noRun?: boolean
}

export const bundle = async (options: BundleOptions): Promise<void> => {
    const { bundleFile, version } = options;
    const config = await readConfig(bundleFile || 'bundle.yml')
    const dir = process.cwd()
    const { output, targets, before, run, entries, includes, excludes, map } = config;

    if (!options.noBefore) {
        await runSteps(before, os.platform(), os.arch())
    }

    const outputDir = path.join(output.dir, version)
    const archivePrefix = output.prefix
    const hashAlgorithm = 'sha256'
    const hashFile = path.join(outputDir, 'sha256sums.txt')

    const filteredTargets = filterTargets(targets, options.filter)
    for (const target of filteredTargets) {
        log.info(`Bundling target ${target.platform}-${target.arch}`)
        const isWin = target.platform.startsWith('win')
        const fileBase = `${output.name}-${version}-${target.platform}-${target.arch}`;
        const archiveFile = path.join(outputDir, `${fileBase}.tar.gz`);
        const binFile = path.join(outputDir, `${fileBase}${isWin ? '.exe' : ''}`);

        if (!options.noRun) {
            await runSteps(run, target.platform, target.arch)
        }

        const packages = await resolvePackages(dir, entries)
        log.info(`Require ${packages.length} packages for ${entries.length} entries`)

        const filter = getFilter(packages, includes, excludes, target.platform, target.arch)
        const mapping = toMapping(map, target.platform, target.arch)

        await writeArchive(dir, filter, mapping, archivePrefix, archiveFile)
        log.info(`Created archive ${archiveFile}`)

        await pack(archiveFile, archivePrefix, `${output.name}/${version}`, target.platform, target.command, binFile)
        log.info(`Created binary ${binFile}`)

        await updateHash([archiveFile, binFile], hashAlgorithm, hashFile)
        await Promise.all([archiveFile, binFile].map(file => symlink(file, file.replace(new RegExp(version, 'g'), 'latest'))))
        log.debug(`Updated checksum file and latest links`)
    }
}
