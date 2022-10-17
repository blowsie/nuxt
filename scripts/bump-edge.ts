import { execSync } from 'node:child_process'
import { $fetch } from 'ohmyfetch'
import { inc } from 'semver'
import { loadWorkspace } from './_utils'

async function main () {
  const workspace = await loadWorkspace(process.cwd())

  const commit = execSync('git rev-parse --short HEAD').toString('utf-8').trim()
  const date = Math.round(Date.now() / (1000 * 60))

  const nuxtPkg = workspace.find('nuxt')
  const nitroInfo = await $fetch('https://registry.npmjs.org/nitropack-edge')
  const latestNitro = nitroInfo['dist-tags'].latest
  nuxtPkg.data.dependencies.nitropack = `npm:nitropack-edge@^${latestNitro}`

  for (const pkg of workspace.packages.filter(p => !p.data.private)) {
    // TODO: Set release type based on changelog after 3.0.0
    const newVersion = inc(pkg.data.version, 'prerelease', 'rc')
    workspace.setVersion(pkg.data.name, `${newVersion}-${date}.${commit}`)
    const newname = pkg.data.name === 'nuxt' ? 'nuxt3' : (pkg.data.name + '-edge')
    workspace.rename(pkg.data.name, newname)
  }

  await workspace.save()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
