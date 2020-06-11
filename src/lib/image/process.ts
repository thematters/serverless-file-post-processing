import * as sharp from 'sharp'

import { IMAGE_FOLDER_OUT } from '../../enum'

export const process = async ({
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
  width,
  ext,
}: {
  key: string
  width: number
  ext?: string
}) => {
  const list = key.split('.')
  const prefix = list.slice(0, list.length - 1).join('.')
  const extension = ext || list.slice(-1)
  return `${IMAGE_FOLDER_OUT}/${width}w/${prefix}${
    extension ? '.' + extension : ''
  }`
}

export const toOriginalKey = ({ key, ext }: { key: string; ext?: string }) => {
  const list = key.split('.')
  const prefix = list.slice(0, list.length - 1).join('.')
  const extension = ext || list.slice(-1)
  return `${prefix}${extension ? '.' + extension : ''}`
}
