# serverless-file-post-processing

Post processing files uploaded to S3

## Use Cases

### Image Processing

- Resize & compress images uploaded to AWS S3
- TODO: Delete (versioned) thumbnails after original image is deleted from AWS S3

## Development

We use [The Serverless Framework](https://www.serverless.com/) to develop and deploy our AWS Lambda functions.

See [their docs](https://www.serverless.com/framework/docs/) for more details.

## Deployment

Serverless App will be deployed automatically by [GitHub Actions](./.github/workflows/deploy.yml).

## WARNING

From [Configuring Amazon S3 event notifications](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html):

> If your notification ends up writing to the bucket that triggers the notification, this could cause an execution loop. For example, if the bucket triggers a Lambda function each time an object is uploaded, and the function uploads an object to the bucket, then the function indirectly triggers itself. To avoid this, use two buckets, or configure the trigger to only apply to a prefix used for incoming objects.
