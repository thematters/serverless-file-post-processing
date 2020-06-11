import { S3EventRecord } from 'aws-lambda'

import { S3Service } from '../../services'

import { process, toProcessedKey, toOriginalKey } from './process'
import {
  IMAGE_SIZES,
  IMAGE_TYPES,
  IMAGE_WIDTH_LIMIT,
  IMAGE_SIZE,
} from '../../enum'

export const processImage = async (record: S3EventRecord) => {
  const s3 = new S3Service()
  const bucket = record.s3.bucket.name
  const key = record.s3.object.key

  const regexp = new RegExp(`(${Object.values(IMAGE_TYPES).join('|')})\/`)
  const type = key.match(regexp)[1]
  const sizes = IMAGE_SIZES[type] as IMAGE_SIZE[]

  // skip if type isn't supported
  if (!sizes) {
    console.log(`[SKIP]: ${key}`)
    return
  }

  // get image file
  const getFileResult = await s3.getFile({ bucket, key })
  const file = getFileResult.Body as Buffer
  const contentType = getFileResult.ContentType

  console.log(`[PROCESSING]: ${key}@original`)

  /**
   * original image in non-WebP format
   */
  const isOriginalWebP = /webp/i.test(contentType)
  const originalContentType = isOriginalWebP ? 'image/jpeg' : contentType
  const original = await process({
    buffer: file,
    size: { width: IMAGE_WIDTH_LIMIT },
    force: {
      jpeg: isOriginalWebP, // force conver to JPEG if it's WebP
    },
  })
  await s3.uploadFile({
    body: original,
    bucket,
    contentType: originalContentType,
    key,
  })

  /**
   * original image in WebP format
   */
  const originalWebP = await process({
    buffer: file,
    size: { width: IMAGE_WIDTH_LIMIT },
    force: {
      webp: true, // force conver to WebP
    },
  })
  await s3.uploadFile({
    body: originalWebP,
    bucket,
    contentType: 'image/webp',
    key: toOriginalKey({ key, ext: 'webp' }),
  })

  /**
   * resize
   */
  return Promise.all(
    sizes.map(async (size) => {
      console.log(`[PROCESSING]: ${key}@${size.width}w`)

      // non-WebP
      const resizedImage = await process({
        buffer: original,
        size,
      })
      await s3.uploadFile({
        body: resizedImage,
        bucket,
        contentType: originalContentType,
        key: toProcessedKey({ key, width: size.width }),
      })

      // WebP
      const resizedImageWebP = await process({
        buffer: originalWebP,
        size,
      })
      await s3.uploadFile({
        body: resizedImageWebP,
        bucket,
        contentType: 'image/webp',
        key: toProcessedKey({ key, width: size.width, ext: 'webp' }),
      })
    })
  )
}
