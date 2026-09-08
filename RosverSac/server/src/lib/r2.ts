import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { config } from '../config.js'

let client: S3Client | null = null

export function r2Enabled() {
  return Boolean(
    config.r2.endpoint &&
      config.r2.accessKeyId &&
      config.r2.secretAccessKey &&
      config.r2.bucketPublic,
  )
}

function getClient() {
  if (!r2Enabled()) {
    throw new Error('R2 no configurado')
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
      forcePathStyle: true,
    })
  }
  return client
}

export async function putPublicObject(input: {
  key: string
  body: Buffer
  contentType: string
}) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.r2.bucketPublic,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  if (config.r2.publicBaseUrl) {
    return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${input.key}`
  }
  return `/api/media/${input.key}`
}

export async function getPublicObject(key: string) {
  return getClient().send(
    new GetObjectCommand({
      Bucket: config.r2.bucketPublic,
      Key: key,
    }),
  )
}
