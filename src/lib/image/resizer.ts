import * as sharp from 'sharp'

export const resize = async ({
  buffer,
  width,
}: {
  buffer: Buffer
  width: number
}) => {
  return sharp(buffer).resize(width, null).toBuffer()
}
