import * as sharp from 'sharp'

import { IMAGE_FOLDER_OUT, IMAGE_FORMATS } from '../enum'

export const sharpProcess = async ({
  buffer,
  size = {},
  force = {},
}: {
  buffer: Buffer
  size?: { width?: number; height?: number }
  force?: {
    jpeg?: boolean
    png?: boolean
    webp?: boolean
  }
}) => {
  return (
    sharp(buffer)
      // convert format & compress
      .jpeg({
        quality: 80,
        progressive: true,
        force: force.jpeg || false,
      })
      .png({
        compressionLevel: 9,
        progressive: true,
        force: force.png || false,
      })
      .webp({
        quality: 80,
        alphaQuality: 100,
        lossless: false,
        force: force.webp || false,
      })
      // resize
      .resize({
        width: size.width,
        height: size.height,
        withoutEnlargement: true,
      })
      .toBuffer()
  )
}

export const toProcessedKey = ({
  key,
  subFolder,
  ext,
}: {
  key: string
  subFolder: number | string
  ext?: IMAGE_FORMATS
}) => {
  const list = key.split('.')
  const extension = ext || list.slice(-1)
  const prefix = list.slice(0, list.length - 1).join('.')
  const suffix = extension ? '.' + extension : ''

  return `${IMAGE_FOLDER_OUT}/${subFolder}/${prefix}${suffix}`
}

export const toOriginalKey = ({
  key,
  ext,
}: {
  key: string
  ext?: IMAGE_FORMATS
}) => {
  const list = key.split('.')
  const extension = ext || list.slice(-1)
  const prefix = list.slice(0, list.length - 1).join('.')
  const suffix = extension ? '.' + extension : ''

  return `${prefix}${suffix}`
}
