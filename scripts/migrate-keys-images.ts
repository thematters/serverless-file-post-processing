/**
 * Similar to `migrate-images.ts`, but requires keys file.
 */
import * as fs from 'fs'
import * as prompts from 'prompts'
import * as chalk from 'chalk'
import { forEach, forEachSeries } from 'p-iteration'
import axios from 'axios'
import * as _ from 'lodash'

const questions: Array<prompts.PromptObject> = [
  {
    type: 'text',
    name: 'migrationEndpoint',
    message: 'Please enter the migration endpoint:',
  },
  {
    type: 'select',
    name: 'bucket',
    message: 'Select the target bucket:',
    choices: [
      {
        title: 'matters-server-stage',
        value: 'matters-server-stage',
        description: '(develop)',
      },
      {
        title: 'matters-server-production',
        value: 'matters-server-production',
        description: '(production)',
      },
    ],
    initial: 0,
  },
  {
    type: 'text',
    name: 'keysFile',
    message: 'Please enter the path of the file contains keys:',
    hint: 'e.g.: scripts/rollback-keys.txt',
  },
  {
    type: 'number',
    name: 'count',
    message: 'Number of images to be processed per page:',
    initial: 100,
    min: 1,
    max: 1000,
  },
  {
    type: 'confirm',
    name: 'readyToStart',
    message: 'Ready to start?',
    initial: true,
  },
]

;(async () => {
  const {
    migrationEndpoint,
    bucket,
    keysFile,
    count,
    readyToStart,
  } = await prompts(questions)

  if (!readyToStart) {
    console.log(chalk.green('------- END -------'))
    return
  }

  /**
   * Preparing and checking keys
   */
  const keys = fs
    .readFileSync(keysFile, { encoding: 'utf8' })
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => !!k)
  const chunks = _.chunk(keys, count)

  const validFolders = ['avatar/', 'embed/', 'profileCover/']
  keys.forEach((key) => {
    const isValid = validFolders.some((folder) => key.indexOf(folder) >= 0)
    if (!isValid) {
      throw new Error(`${key} is invalid.`)
    }
  })

  /**
   * Start Processing
   */
  const successKeys = []
  const errorKeys = []

  await forEachSeries(chunks, async (keys) => {
    await forEach(
      keys.filter((key) => !key.includes('.webp')),
      async (key) => {
        try {
          const data = { bucket, key }

          await axios.post(migrationEndpoint, data, {
            timeout: 10000,
          })

          successKeys.push(key)

          console.log(
            `(${successKeys.length}) ${chalk.green('SUCCESS:')} ${key}`
          )
        } catch (err) {
          errorKeys.push(key)

          console.log(`(${errorKeys.length}) ${chalk.red('ERROR:')} ${key}`)
          console.error(err.response)
        }
      }
    )
  })

  // log results
  console.log(`${chalk.green(`${successKeys.length} items done.`)}`)
  console.log(
    `${chalk.red(`${errorKeys.length} items failed:`)}`,
    JSON.stringify(errorKeys, null, 2)
  )

  // write to `logs`
  const now = Date.now()
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs')
  }
  fs.writeFileSync(
    `./logs/migrate-keys-${now}-success.txt`,
    successKeys.join('\n')
  )
  fs.writeFileSync(`./logs/migrate-keys-${now}-error.txt`, errorKeys.join('\n'))
  console.log(`See "./logs/migrate-keys-${now}-*.txt" for full logs.`)
})()
