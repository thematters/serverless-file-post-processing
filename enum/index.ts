/**
 * Tagging
 *
 * @see {@url https://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html}
 */
export const TAG_VERSION_KEY = 'PostProcessingVersion'
export const TAG_VERSION_VALUE = 'v1'

/**
 * Output folder
 */
export const IMAGE_FOLDER_OUT = 'processed'

/**
 * Support image types (same as folder name)
 */
export enum IMAGE_TYPES {
  avatar = 'avatar',
  circleAvatar = 'circleAvatar',
  embed = 'embed',
  cover = 'cover',
  announcementCover = 'announcementCover',
  tagCover = 'tagCover',
  circleCover = 'circleCover',
  profileCover = 'profileCover',
  topicCover = 'topicCover',
}

/**
 * Supported image filename extension
 */
export enum IMAGE_EXTS {
  jpg = 'jpg',
  jpeg = 'jpeg',
  gif = 'gif',
  webp = 'webp',
  png = 'png',
}

/**
 * Maximum image size in width
 */
export const IMAGE_WIDTH_LIMIT = 1400

/**
 * Target image sizes
 */
export type IMAGE_SIZE = { width: number; height?: number }
export const IMAGE_SIZES: {
  [key in IMAGE_TYPES]: IMAGE_SIZE[]
} = {
  avatar: [{ width: 144, height: 144 }],
  circleAvatar: [{ width: 144, height: 144 }],
  embed: [
    { width: 144, height: 144 },
    { width: 360, height: null },
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  cover: [
    { width: 144, height: 144 },
    { width: 360, height: null },
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  announcementCover: [
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  tagCover: [
    { width: 144, height: 144 },
    { width: 360, height: null },
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  circleCover: [
    { width: 144, height: 144 },
    { width: 360, height: null },
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  profileCover: [
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
  topicCover: [
    { width: 144, height: 144 },
    { width: 360, height: null },
    { width: 540, height: null },
    { width: 1080, height: null },
  ],
}
