import { forEach } from 'p-iteration'

import { sharpProcess, toProcessedKey, changeExt } from './utils'
import {
  IMAGE_FOLDER_OUT,
  IMAGE_SIZES,
  IMAGE_TYPES,
  IMAGE_WIDTH_LIMIT,
  IMAGE_SIZE,
  IMAGE_EXTS,
  TAG_VERSION_KEY,
  TAG_VERSION_VALUE,
} from '../../enum'
import { S3Service } from '../../services'

/**
 * Process the original image to:
 *
 * 1) Compress
 * 2) Generate thumbnails include WebP versions
 */
export const processImage = async ({
  s3,
  bucket,
  key,
}: {
  s3: S3Service
  bucket: string
  key: string
}) => {
  console.log(`[PROCESSING]: ${key}`)

  const baseUploadProps = {
    bucket,
    tagging: `${TAG_VERSION_KEY}=${TAG_VERSION_VALUE}`, // mark as processed
  }

  /**
   * Check if it's supported
   *
   * 👌 `avatar/filename.png`
   * 👌 `avatar/filename-png`
   * 👌 `avatar/filename.PNG`
   */
  const isSupported = Object.values(IMAGE_EXTS).some((format) =>
    new RegExp(`[\-\.]${format}$`, 'i').test(key)
  )
  const regexp = new RegExp(`(${Object.values(IMAGE_TYPES).join('|')})\/`)
  const type = key.match(regexp)[1]
  const sizes = IMAGE_SIZES[type] as IMAGE_SIZE[]

  if (!sizes || !isSupported) {
    console.log(`[SKIP]: ${key} it's supported`)
    return
  }

  /**
   * Check if it's processed
   */
  const { TagSet: tags } = await s3.getFileTags({ bucket, key })
  const isProcessedByKey = key.indexOf(`${IMAGE_FOLDER_OUT}/`) >= 0
  const isProcessedByTag = tags.some(
    (tag) => tag.Key === TAG_VERSION_KEY && tag.Value === TAG_VERSION_VALUE
  )

  if (isProcessedByKey || isProcessedByTag) {
    console.log(`[SKIP]: ${key} already been processed`)
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
  const isOriginalGIF = /gif/i.test(contentType)
  const originalContentType = isOriginalWebP ? 'image/jpeg' : contentType
  const original = await sharpProcess({
    buffer: file,
    size: { width: IMAGE_WIDTH_LIMIT },
    force: {
      jpeg: isOriginalWebP, // force conver to JPEG if it's WebP
    },
  })

  /**
   * FIXME: stop overwrite original GIF
   * since sharp.js can't properly process animated GIFs.
   *
   * @see {@url https://github.com/lovell/sharp/issues/245}
   * */
  if (!isOriginalGIF) {
    // NOTE: To avoid execution loop,
    // we can't directly upload the image to the original folder
    const processedKey = toProcessedKey({ key, subFolder: '_temp' })
    await s3.uploadFile({
      ...baseUploadProps,
      body: original,
      contentType: originalContentType,
      key: processedKey,
    })
    await s3.moveFile({
      srcBucket: bucket,
      srcKey: processedKey,
      destBucket: bucket,
      destKey: key,
    })
  }

  /// WebP
  console.log(`[PROCESSING]: ${key}@original/webp`)
  const originalWebP = await sharpProcess({
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
    ext: IMAGE_EXTS.webp,
  })
  const originalKeyWebP = changeExt({
    key,
    ext: IMAGE_EXTS.webp,
  })
  await s3.uploadFile({
    ...baseUploadProps,
    body: originalWebP,
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
   * Thumbnails
   */
  return forEach(sizes, async (size) => {
    const subFolder = `${size.width}w`
    // non-WebP
    console.log(`[PROCESSING]: ${key}@${size.width}w`)
    const resizedImage = await sharpProcess({
      buffer: original,
      size,
    })
    await s3.uploadFile({
      ...baseUploadProps,
      body: resizedImage,
      contentType: originalContentType,
      key: toProcessedKey({ key, subFolder }),
    })

    // WebP
    console.log(`[PROCESSING]: ${key}@${size.width}w/webp`)
    const resizedImageWebP = await sharpProcess({
      buffer: originalWebP,
      size,
    })
    await s3.uploadFile({
      ...baseUploadProps,
      body: resizedImageWebP,
      contentType: 'image/webp',
      key: toProcessedKey({
        key,
        subFolder,
        ext: IMAGE_EXTS.webp,
      }),
    })
  })
}

/**
 * Delete thumbnails
 */
export const deleteProcessedImages = async ({
  s3,
  bucket,
  key,
}: {
  s3: S3Service
  bucket: string
  key: string
}) => {
  console.log(`[DELETING]: thumbnails of ${key}`)

  const regexp = new RegExp(`(${Object.values(IMAGE_TYPES).join('|')})\/`)
  const type = key.match(regexp)[1]
  const sizes = IMAGE_SIZES[type] as IMAGE_SIZE[]

  if (!sizes) {
    console.log(`[SKIP]: ${key} it's supported`)
    return
  }

  const originalKeyWebP = changeExt({
    key,
    ext: IMAGE_EXTS.webp,
  })
  const thumbnailKeys = sizes.map((size) =>
    toProcessedKey({ key, subFolder: `${size.width}w` })
  )
  const thumbnailKeysWebP = sizes.map((size) =>
    toProcessedKey({
      key,
      subFolder: `${size.width}w`,
      ext: IMAGE_EXTS.webp,
    })
  )
  const keys = [originalKeyWebP, ...thumbnailKeys, ...thumbnailKeysWebP]
    // To avoid execution loop
    .filter((k) => k !== key)

  return s3.deleteFiles({
    bucket,
    objects: keys.map((key) => ({ key })),
  })
}
