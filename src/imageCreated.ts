import 'source-map-support/register'
import { S3Handler } from 'aws-lambda'
import { S3EventRecord } from 'aws-lambda'
import { forEach } from 'p-iteration'

import { processImage } from './processors'

import { S3Service } from './services'

export const handler: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  const s3 = new S3Service()

  return forEach(event.Records, async (record: S3EventRecord) => {
    await processImage({
      s3,
      bucket: record.s3.bucket.name,
      key: record.s3.object.key,
    })
  })
}
