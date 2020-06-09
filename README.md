# serverless-file-post-processing
Post processing files uploaded to S3

## Use Cases

### Image Processing

* Resize & compress images uploaded to AWS S3
* TODO: Delete thumbnails after raw image is deleted from AWS S3

## Development
We use [The Serverless Framework](https://www.serverless.com/) to develop and deploy our AWS Lambda functions.

See [their docs](https://www.serverless.com/framework/docs/) for more details.

## Deployment

Serverless App will be deployed automatically by [GitHub Actions](./.github/workflows/deploy.yml).
