import { S3EventRecord } from 'aws-lambda'
import * as mime from 'mime-types'

import { S3Service } from '../../services'

import { resize } from './resizer'
import { toFormat } from './format'
import {
  IMAGE_SIZES,
  IMAGE_TYPES,
  IMAGE_FORMATS,
  IMAGE_FOLDER_OUT,
} from '../../enum'

export const processImage = async (record: S3EventRecord) => {
  const s3 = new S3Service()
  const bucket = record.s3.bucket.name
  const key = record.s3.object.key

  const regexp = new RegExp(`(${Object.values(IMAGE_TYPES).join('|')})\/`)
  const type = key.match(regexp)[1]
  const sizes = IMAGE_SIZES[type]

  // skip if type isn't supported
  if (!sizes) {
    console.log(`[SKIP]: ${key}`)
    return
  }

  // get image file
  const getFileResult = await s3.getFile({ bucket, key })
  const file = getFileResult.Body as Buffer
  const contentType = getFileResult.ContentType
  const isRawWebP = mime.extension(contentType) === 'webp'

  // raw image in non-WebP format
  const rawImage = isRawWebP
    ? await toFormat({
        buffer: file,
        format: IMAGE_FORMATS.jpeg,
        options: { quality: 100 },
      })
    : file
  const rawImageContentType = isRawWebP ? 'image/jpeg' : contentType

  // raw image in WebP format
  const rawaImageWebP = isRawWebP
    ? rawImage
    : await toFormat({
        buffer: file,
        format: IMAGE_FORMATS.webp,
        options: { quality: 100 },
      })
  const rawImageWebPContentType = 'image/webp'

  // TODO: upload rawaImageWebP

  // resize & upload
  const toOutKey = (size, extension?) => {
    const list = key.split('.')
    const prefix = list.slice(0, list.length - 1).join('.')
    const ext = extension || list.slice(-1)
    return `${IMAGE_FOLDER_OUT}/${size}w/${prefix}${ext ? '.' + ext : ''}`
  }

  return Promise.all(
    sizes.map(async (size) => {
      // non-WebP
      const resizedImage = await resize({ buffer: rawImage, width: size })
      await s3.uploadFile({
        body: resizedImage,
        bucket,
        contentType: rawImageContentType,
        key: toOutKey(size),
      })

      // WebP
      const resizedImageWebP = await resize({
        buffer: rawaImageWebP,
        width: size,
      })
      await s3.uploadFile({
        body: resizedImageWebP,
        bucket,
        contentType: rawImageWebPContentType,
        key: toOutKey(size, 'webp'),
      })
    })
  )
}
