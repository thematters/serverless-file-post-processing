import * as sharp from 'sharp'
import { IMAGE_FORMATS } from '../../enum'

export const toFormat = async ({
  buffer,
  format,
  options,
}: {
  buffer: Buffer
  format: IMAGE_FORMATS
  options?: any
}) => {
  return sharp(buffer).toFormat(format, options).toBuffer()
}
