# serverless-file-post-processing

Post processing files uploaded to S3

## Use Cases

### [Image Processing](https://github.com/thematters/matters-server/issues/1128)

- Resize & compress images uploaded to AWS S3
- Delete thumbnails when the original image is deleted

## Development

We use [The Serverless Framework](https://www.serverless.com/) to develop and deploy our AWS Lambda functions.

See [their docs](https://www.serverless.com/framework/docs/) for more details.

## Deployment

Serverless App will be deployed automatically by [GitHub Actions](./.github/workflows/deploy.yml).

## Migataion

To migrate legacy images that unprocessed by the current version of Lambda function, please run:

```bash
npm run migrate:images
```

## WARNING

From [Configuring Amazon S3 event notifications](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html):

> If your notification ends up writing to the bucket that triggers the notification, this could cause an execution loop. For example, if the bucket triggers a Lambda function each time an object is uploaded, and the function uploads an object to the bucket, then the function indirectly triggers itself. To avoid this, use two buckets, or configure the trigger to only apply to a prefix used for incoming objects.

## Troubleshooting

If you are facing the following error, try to [delete enabled S3 events](https://docs.aws.amazon.com/AmazonS3/latest/user-guide/enable-event-notifications.html) first.

```
An error occurred: *****CustomS31 - Failed to create resource. Unable to validate the following destination configurations
```
