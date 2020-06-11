import { S3Handler } from 'aws-lambda'
import 'source-map-support/register'

import { processImage } from './lib'
import { IMAGE_FOLDER_OUT, IMAGE_FORMATS } from './enum'

export const handler: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  // skip processed files
  const records = event.Records.filter((record) => {
    const key = record.s3.object.key
    const isProcessed = key.indexOf(`${IMAGE_FOLDER_OUT}/`) >= 0
    const isSupported =
      Object.values(IMAGE_FORMATS).indexOf(key.split('.').pop() as any) >= 0
    return !isProcessed && isSupported
  })

  // TBC: check object size

  let tasks = []
  for (let i = 0; i < records.length; i++) {
    tasks.push(processImage(records[i]))
  }

  const keys = records.map((r) => r.s3.object.key).join(', ')

  return Promise.all(tasks)
    .then(() => {
      context.succeed(`[SUCCEED] ${keys}`)
    })
    .catch(() => {
      context.succeed(`[FAILED] ${keys}`)
    })
}
