import * as sharp from 'sharp'

import { IMAGE_FOLDER_OUT, IMAGE_EXTS } from '../../enum'

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
    sharp(buffer, {
      pages: -1, // for all pages; of animated GIF/webp
    })
      // auto-orient based on the EXIF `Orientation` tag
      .rotate()
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

export const changeExt = ({ key, ext }: { key: string; ext?: IMAGE_EXTS }) => {
  const list = key.split('.')
  const hasExt = list.length > 1
  const newExt = ext || list.slice(-1)[0] || ''

  if (hasExt) {
    return key.replace(/\.[^.]+$/, `.${newExt}`)
  }

  return `${key}${ext ? '.' + ext : ''}`
}

export const toProcessedKey = ({
  key,
  subFolder,
  ext,
}: {
  key: string
  subFolder: number | string
  ext?: IMAGE_EXTS
}) => `${IMAGE_FOLDER_OUT}/${subFolder}/` + changeExt({ key, ext })
