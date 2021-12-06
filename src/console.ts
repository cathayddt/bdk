import config from './config'
import { spawnSync } from 'child_process'
import { exit } from 'process'

const [, , ...args] = process.argv

console.log(`hello BDK world! args: ${args}`)
console.log('[config.environment]', config.environment)

console.log('[*] args: ', args)
console.log('[*] build typescript project.')

/**
 * npm unlink -g
 */
console.log('[*] exec spawnSync: npm unlink -g')
const npmUnlink = spawnSync('npm', ['unlink', '-g'])
// console.log(`[=] stdout: ${npmUnlink.stdout}`)
// console.log(`[x] stderr: ${npmUnlink.stderr}`)
console.log(`[+] child process exited with code ${npmUnlink.status}`)
if (npmUnlink.status !== 0) { console.error('\x1b[31m%s\x1b[0m', npmUnlink.stderr); exit(0) }

/**
 * rm -rf dist/
 */
console.log('[*] exec spawnSync: rm -rf dist')
const rm = spawnSync('rm', ['-rf', 'dist'])
// console.log(`[=] stdout: ${rm.stdout}`)
// console.log(`[x] stderr: ${rm.stderr}`)
console.log(`[+] child process exited with code ${rm.status}`)
if (rm.status !== 0) { console.error('\x1b[31m%s\x1b[0m', rm.stderr); exit(0) }

/**
 * npm run build-ts
 */
console.log('[*] exec spawnSync: npm run build-ts')
const npmBuild = spawnSync('npm', ['run', 'build-ts'])
// console.log(`[=] stdout: ${npmBuild.stdout}`)
// console.log(`[x] stderr: ${npmBuild.stderr}`)
console.log(`[+] child process exited with code ${npmBuild.status}`)
if (npmBuild.status !== 0) { console.error(`${npmBuild.output[1]}`); console.error('\x1b[31m%s\x1b[0m', npmBuild.stderr); exit(0) }

/**
 * npm link/
 */
console.log('[*] exec spawnSync: npm link')
const npmLink = spawnSync('npm', ['link', '--bin-links'])
// console.log(`[=] stdout: ${npmLink.stdout}`)
// console.log(`[x] stderr: ${npmLink.stderr}`)
console.log(`[+] child process exited with code ${npmLink.status}`)
if (npmLink.status !== 0) { console.error('\x1b[31m%s\x1b[0m', npmLink.stderr); exit(0) }

console.log('[*] exit process.')
exit(0)
