/**
 * Output folder
 */
export const IMAGE_FOLDER_OUT = 'processed'

/**
 * Support image types (same as folder name)
 */
export enum IMAGE_TYPES {
  avatar = 'avatar',
  profileCover = 'profileCover',
  embed = 'embed',
}

/**
 * Supported image formats
 */
export enum IMAGE_FORMATS {
  jpg = 'jpg',
  jpeg = 'jpeg',
  gif = 'gif',
  svg = 'svg',
  webp = 'webp',
  png = 'png',
}

/**
 * Maximum image size in width
 */
export const IMAGE_DIMENSION_LIMIT = 1400

/**
 * Target image sizes in width
 */
export const IMAGE_SIZES: { [key in IMAGE_TYPES]: number[] } = {
  avatar: [144],
  profileCover: [540, 1080],
  embed: [144, 360, 540, 1080],
}
