import * as AWS from 'aws-sdk'

export class S3Service {
  s3: AWS.S3

  constructor({
    accessKeyId,
    secretAccessKey,
  }: {
    accessKeyId?: string
    secretAccessKey?: string
  } = {}) {
    if (accessKeyId && secretAccessKey) {
      this.s3 = new AWS.S3({ accessKeyId, secretAccessKey })
    } else {
      this.s3 = new AWS.S3()
    }
  }

  /**
   * List files
   */
  listFiles = async ({
    bucket,
    after,
    count = 100,
    prefix,
  }: {
    bucket: string
    after?: string
    count?: number
    prefix?: string
  }) => {
    console.log(
      `[LIST]: bucket:${bucket}, after:${after}, count:${count}, prefix:${prefix}`
    )

    const result = await this.s3
      .listObjectsV2({
        Bucket: bucket,
        ContinuationToken: after,
        MaxKeys: count,
        Prefix: prefix,
      })
      .promise()

    return {
      files: result.Contents,
      next: result.NextContinuationToken,
      hasNext: result.IsTruncated,
    }
  }

  /**
   * Read file by the given bucket and key
   */
  getFile = async ({ bucket, key }: { bucket: string; key: string }) => {
    console.log(`[GET]: ${key}`)

    return this.s3.getObject({ Bucket: bucket, Key: key }).promise()
  }

  /**
   * Get file tags
   */
  getFileTags = async ({ bucket, key }: { bucket: string; key: string }) => {
    console.log(`[GET:Tags]: ${key}`)

    return this.s3.getObjectTagging({ Bucket: bucket, Key: key }).promise()
  }

  /**
   * Upload file to AWS S3.
   */
  uploadFile = async ({
    body,
    bucket,
    contentType,
    key,
    tagging,
  }: {
    body: Buffer
    bucket: string
    contentType: string
    key: string
    tagging?: string
  }) => {
    console.log(`[UPLOAD]: ${key}`)

    return this.s3
      .upload({
        Body: body,
        Bucket: bucket,
        ContentType: contentType,
        Key: key,
        Tagging: tagging,
      })
      .promise()
  }

  /**
   * Copy file
   */
  copyFile = async ({
    srcBucket,
    srcKey,
    destBucket,
    destKey,
  }: {
    srcBucket: string
    srcKey: string
    destBucket: string
    destKey: string
  }) => {
    const src = `${srcBucket}/${srcKey}`

    console.log(`[COPY]: from ${src} to ${destBucket}/${destKey}`)

    return this.s3
      .copyObject({
        Bucket: destBucket,
        Key: destKey,
        CopySource: src,
        MetadataDirective: 'COPY',
        TaggingDirective: 'COPY',
      })
      .promise()
  }

  /**
   * Delete file from AWS S3 by a given path key.
   */
  deleteFile = async ({ bucket, key }: { bucket: string; key: string }) => {
    console.log(`[DELETE]: ${key}`)

    return this.s3
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise()
  }

  /**
   * Move file
   */
  moveFile = async ({
    srcBucket,
    srcKey,
    destBucket,
    destKey,
  }: {
    srcBucket: string
    srcKey: string
    destBucket: string
    destKey: string
  }) => {
    await this.copyFile({
      srcBucket,
      srcKey,
      destBucket,
      destKey,
    })
    await this.deleteFile({
      bucket: srcBucket,
      key: srcKey,
    })
  }
}
