import * as AWS from 'aws-sdk'

export class S3Service {
  s3: AWS.S3

  constructor() {
    this.s3 = new AWS.S3()
  }

  /**
   * Read file by the given bucket and key
   */
  getFile = async ({ bucket, key }: { bucket: string; key: string }) => {
    console.log(`[GET]: ${key}`)

    return this.s3.getObject({ Bucket: bucket, Key: key }).promise()
  }

  /**
   * Upload file to AWS S3.
   */
  uploadFile = async ({
    body,
    bucket,
    contentType,
    key,
  }: {
    body: Buffer
    bucket: string
    contentType: string
    key: string
  }) => {
    console.log(`[UPLOAD]: ${key}`)

    return this.s3
      .upload({
        Body: body,
        Bucket: bucket,
        ContentType: contentType,
        Key: key,
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
