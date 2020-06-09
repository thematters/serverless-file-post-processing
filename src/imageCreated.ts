import { S3Handler } from 'aws-lambda'
import 'source-map-support/register'

export const handler: S3Handler = async (event, context) => {
  // Fail on mising data
  if (event.Records === null) {
    context.fail('Error: Event has no records.')
    return
  }

  event.Records.forEach((record) => {
    // record.s3.bucket.name
    const filename = record.s3.object.key
    const filesize = record.s3.object.size
    console.log(
      `New image object has been created: ${filename} (${filesize} bytes)`
    )
  })
}
