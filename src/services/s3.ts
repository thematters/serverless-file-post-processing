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
   * Delete file from AWS S3 by a given path key.
   */
  // deleteFile = async (key: string) =>
  //   this.s3
  //     .deleteObject({
  //       Bucket: this.s3Bucket,
  //       Key: key,
  //     })
  //     .promise()
}
