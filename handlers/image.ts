// import 'source-map-support/register'
import { S3Handler, APIGatewayProxyHandler } from 'aws-lambda'
import { S3EventRecord } from 'aws-lambda'
// import { forEach } from 'p-iteration'

import { processImage, deleteProcessedImages } from '../libs'

import { S3Service } from '../services'

/**
 * To resize & compress images which newly added to a specific folders.
 *
 * @param event
 * @param context
 */
export const created: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  const s3 = new S3Service()

  return Promise.all(
    event.Records.map((record: S3EventRecord) =>
      processImage({
        s3,
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
      })
    )
  )
}

/**
 * To delete thumbnails when the original image is deleted.
 *
 * @param event
 * @param context
 */
export const deleted: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  const s3 = new S3Service()

  return Promise.all(
    event.Records.map((record: S3EventRecord) =>
      deleteProcessedImages({
        s3,
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
      })
    )
  )
}

/**
 * To migrate legacy images, the incremental images should be processed by "newAdded" handler.
 *
 * @param event
 * @param context
 */
export const migrate: APIGatewayProxyHandler = async (event) => {
  const s3 = new S3Service()
  const bucket = process.env.BUCKET
  const data = JSON.parse(event.body) as { bucket: string; key: string }

  if (data.bucket !== bucket) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: '"bucket" is invalid.',
        },
        null,
        2
      ),
    }
  }

  if (!data.key) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: '"key" is required.',
        },
        null,
        2
      ),
    }
  }

  try {
    await processImage({
      s3,
      bucket,
      key: data.key,
    })
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: `Failed to process ${data.key}`,
        },
        null,
        2
      ),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2),
  }
}
