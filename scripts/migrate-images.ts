/**
 * This script aims to migrate images that unprocessed
 * by the current version of Lambda function.
 */
import * as prompts from 'prompts'
import * as chalk from 'chalk'
import { forEach } from 'p-iteration'
import fetch, { Response } from 'node-fetch'

import { S3Service } from '../services'
import { performance } from 'perf_hooks'

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
    type: 'select',
    name: 'prefix',
    message: 'Select the target folder:',
    choices: [
      { title: 'avatar/', value: 'avatar/', description: 'user avatars' },
      {
        title: 'embed/',
        value: 'embed/',
        description: 'article embedded images',
      },
      {
        title: 'profileCover/',
        value: 'profileCover/',
        description: 'user profile covers',
      },
    ],
    initial: 0,
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

const checkStatus = (res: Response) => {
  if (res.ok) {
    return res
  } else {
    throw new Error(res.statusText)
  }
}

;(async () => {
  const {
    accessKeyId,
    secretAccessKey,
    migrationEndpoint,
    bucket,
    prefix,
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
   * Start Processing
   */
  const s3 = new S3Service({ accessKeyId, secretAccessKey })

  let counter = 1
  const params = {
    bucket,
    prefix,
    count,
    after: undefined,
  }

  for (;;) {
    const { files, next, hasNext } = await s3.listFiles(params)

    await forEach(
      files.filter((f) => !f.Key.includes('.webp')),
      async (file) => {
        counter++

        try {
          const now = performance.now()
          const res = await fetch(migrationEndpoint, {
            method: 'post',
            body: JSON.stringify({ bucket, key: file.Key }),
            headers: { 'Content-Type': 'application/json' },
          })
          checkStatus(res)
          const duration = now - performance.now()
          console.log(
            `(${counter}) ${chalk.green('SUCCESS:')} ${file.Key} ${chalk.grey(
              duration + 'ms'
            )}`
          )
        } catch (err) {
          console.log(`${chalk.red('ERROR:')} ${file.Key}`)
          console.error(err)
          throw err
        }
      }
    )

    if (!hasNext) {
      break
    }

    params.after = next
  }
})()
