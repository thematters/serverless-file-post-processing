import 'source-map-support/register'
import { S3Handler } from 'aws-lambda'
import { S3EventRecord } from 'aws-lambda'
import { forEach } from 'p-iteration'

import { processImage, toProcessedKey, toOriginalKey } from './lib'
import {
  IMAGE_FOLDER_OUT,
  IMAGE_SIZES,
  IMAGE_TYPES,
  IMAGE_WIDTH_LIMIT,
  IMAGE_SIZE,
  IMAGE_FORMATS,
} from './enum'
import { S3Service } from './services'

export const handler: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  return forEach(event.Records, async (record: S3EventRecord) => {
    const s3 = new S3Service()
    const bucket = record.s3.bucket.name
    const key = record.s3.object.key

    /**
     * Checkers
     */
    const isProcessed = key.indexOf(`${IMAGE_FOLDER_OUT}/`) >= 0
    const isSupported =
      Object.values(IMAGE_FORMATS).indexOf(key.split('.').pop() as any) >= 0
    const regexp = new RegExp(`(${Object.values(IMAGE_TYPES).join('|')})\/`)
    const type = key.match(regexp)[1]
    const sizes = IMAGE_SIZES[type] as IMAGE_SIZE[]

    if (!sizes || isProcessed || !isSupported) {
      console.log(`[SKIP]: ${key}`)
      return
    }

    // TBC: check object size

    /**
     * Original Images
     */
    const getFileResult = await s3.getFile({ bucket, key })
    const file = getFileResult.Body as Buffer
    const contentType = getFileResult.ContentType

    // non-WebP
    console.log(`[PROCESSING]: ${key}@original`)
    const isOriginalWebP = /webp/i.test(contentType)
    const originalContentType = isOriginalWebP ? 'image/jpeg' : contentType
    const original = await processImage({
      buffer: file,
      size: { width: IMAGE_WIDTH_LIMIT },
      force: {
        jpeg: isOriginalWebP, // force conver to JPEG if it's WebP
      },
    })

    // NOTE: To avoid execution loop,
    // we can't directly upload the image to the original folder
    const processedKey = toProcessedKey({ key, subFolder: '_temp' })
    await s3.uploadFile({
      body: original,
      bucket,
      contentType: originalContentType,
      key: processedKey,
    })
    await s3.moveFile({
      srcBucket: bucket,
      srcKey: processedKey,
      destBucket: bucket,
      destKey: key,
    })

    /// WebP
    console.log(`[PROCESSING]: ${key}@original/webp`)
    const originalWebP = await processImage({
      buffer: file,
      size: { width: IMAGE_WIDTH_LIMIT },
      force: {
        webp: true, // force conver to WebP
      },
    })

    // NOTE: To avoid execution loop,
    // we can't directly upload the image to the original folder
    const processedKeyWebP = toProcessedKey({
      key,
      subFolder: '_temp',
      ext: IMAGE_FORMATS.webp,
    })
    const originalKeyWebP = toOriginalKey({
      key,
      ext: IMAGE_FORMATS.webp,
    })
    await s3.uploadFile({
      body: original,
      bucket,
      contentType: originalContentType,
      key: processedKeyWebP,
    })
    await s3.moveFile({
      srcBucket: bucket,
      srcKey: processedKeyWebP,
      destBucket: bucket,
      destKey: originalKeyWebP,
    })

    /**
     * Resizing Images
     */
    return forEach(sizes, async (size) => {
      const subFolder = `${size.width}w`
      // non-WebP
      console.log(`[PROCESSING]: ${key}@${size.width}w`)
      const resizedImage = await processImage({
        buffer: original,
        size,
      })
      await s3.uploadFile({
        body: resizedImage,
        bucket,
        contentType: originalContentType,
        key: toProcessedKey({ key, subFolder }),
      })

      // WebP
      console.log(`[PROCESSING]: ${key}@${size.width}w/webp`)
      const resizedImageWebP = await processImage({
        buffer: originalWebP,
        size,
      })
      await s3.uploadFile({
        body: resizedImageWebP,
        bucket,
        contentType: 'image/webp',
        key: toProcessedKey({
          key,
          subFolder,
          ext: IMAGE_FORMATS.webp,
        }),
      })
    })
  })
}
