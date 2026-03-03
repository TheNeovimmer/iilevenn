import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, //bucket.s3.amazonaws.co , localhost:9000/bucket, iileven-audio.local
})

const BUCKET = process.env.MINIO_BUCKET || 'iileven-audio'

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  )
}

export async function getPresignedUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn },
  )
}
