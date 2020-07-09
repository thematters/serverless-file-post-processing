/**
 * This script aims to rollback GIFs to an older unprocessed version
 * due to sharp.js can't properly process animated GIFs.
 *
 * @see {@url https://github.com/lovell/sharp/issues/245}
 * @see {@url https://docs.aws.amazon.com/AmazonS3/latest/dev/DeletingObjectVersions.html}
 */
import * as prompts from 'prompts'
import * as chalk from 'chalk'
import * as fs from 'fs'
import * as _ from 'lodash'
import { forEach, forEachSeries } from 'p-iteration'

import { S3Service } from '../services'

const questions: Array<prompts.PromptObject> = [
  {
    type: 'text',
    name: 'accessKeyId',
    message: 'Please enter AWS Access Key ID:',
  },
  {
    type: 'password',
    name: 'secretAccessKey',
    message: 'Please enter AWS Secret Access Key:',
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
    message: 'Number of images to be processed per time:',
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
    accessKeyId,
    secretAccessKey,
    bucket,
    keysFile,
    count,
    readyToStart,
  } = await prompts(questions)

  if (!readyToStart) {
    console.log(chalk.green('------- END -------'))
    return
  }

  if (!accessKeyId || !secretAccessKey) {
    console.log(`${chalk.red(
      'ERROR:'
    )} Access Key ID and Secret Access Key are required.
    `)
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
  const s3 = new S3Service({ accessKeyId, secretAccessKey })

  const successKeys = []
  const skippedKeys = []
  const errorKeys = []

  await forEachSeries(chunks, async (keys) => {
    const objects: { key: string; versionId: string }[] = []

    // gather key-versionId objects
    await forEach(keys, async (key) => {
      try {
        const versions = await s3.listFileVersions({ bucket, key })

        // skip if the object already the latest version
        if (versions.length <= 1) {
          console.log(`${chalk.green('SKIPPED:')} ${key}`)
          skippedKeys.push(key)
          return
        }

        const versionToBeDeleted = versions[0]
        objects.push({ key, versionId: versionToBeDeleted })
        console.log(
          `${chalk.blue('PUSHED:')} key: ${key}, version: ${versionToBeDeleted}`
        )
      } catch (err) {
        errorKeys.push(key)
        console.log(`${chalk.red('ERROR:')} ${key}`)
        console.error(err.response)
      }
    })

    if (objects.length <= 0) {
      return
    }

    // batch delete versioned objects
    try {
      const { Deleted, Errors } = await s3.deleteFiles({ bucket, objects })

      Deleted.forEach((obj) => {
        successKeys.push(`${obj.Key}, ${obj.VersionId}`)
        console.log(
          `${chalk.green('SUCCESS:')} key: ${obj.Key}, version: ${
            obj.VersionId
          }`
        )
      })

      Errors.forEach((obj) => {
        errorKeys.push(`${obj.Key}, ${obj.VersionId}`)
        console.log(
          `${chalk.red('ERROR:')} key: ${obj.Key}, version: ${obj.VersionId}`
        )
      })
    } catch (err) {
      objects.forEach((obj) => {
        errorKeys.push(`${obj.key}, ${obj.versionId}`)
        console.log(
          `${chalk.red('ERROR:')} key: ${obj.key}, version: ${obj.versionId}`
        )
      })
      console.error(err.response)
    }
  })

  // log results
  console.log(`${chalk.green(`${successKeys.length} items done.`)}`)
  console.log(`${chalk.green(`${skippedKeys.length} items skipped.`)}`)
  console.log(
    `${chalk.red(`${errorKeys.length} items failed:`)}`,
    JSON.stringify(errorKeys, null, 2)
  )

  // write to `logs`
  const now = Date.now()
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs')
  }
  fs.writeFileSync(`./logs/rollback-${now}-success.txt`, successKeys.join('\n'))
  fs.writeFileSync(`./logs/rollback-${now}-skipped.txt`, skippedKeys.join('\n'))
  fs.writeFileSync(`./logs/rollback-${now}-error.txt`, errorKeys.join('\n'))
  console.log(`See "./logs/rollback-${now}-*.txt" for full logs.`)
})()
