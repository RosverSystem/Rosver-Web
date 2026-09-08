import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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

export function publicUrlForKey(key: string) {
  if (config.r2.publicBaseUrl) {
    return `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${key}`
  }
  return `/api/media/${key}`
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
  return publicUrlForKey(input.key)
}

export async function getPublicObject(key: string) {
  return getClient().send(
    new GetObjectCommand({
      Bucket: config.r2.bucketPublic,
      Key: key,
    }),
  )
}

export type ListedObject = {
  key: string
  size: number
  lastModified: string | null
  url: string
}

export async function listPublicObjects(input: {
  prefix?: string
  continuationToken?: string
  maxKeys?: number
  /** Si true, agrupa por carpetas de primer nivel (solo útil sin prefix). */
  groupFolders?: boolean
}) {
  const res = await getClient().send(
    new ListObjectsV2Command({
      Bucket: config.r2.bucketPublic,
      Prefix: input.prefix || undefined,
      ContinuationToken: input.continuationToken || undefined,
      MaxKeys: input.maxKeys ?? 100,
      Delimiter: input.groupFolders ? '/' : undefined,
    }),
  )

  const folders = (res.CommonPrefixes ?? [])
    .map((p) => p.Prefix)
    .filter((p): p is string => Boolean(p))

  const objects: ListedObject[] = (res.Contents ?? [])
    .filter((o) => o.Key && !o.Key.endsWith('/'))
    .map((o) => ({
      key: o.Key as string,
      size: Number(o.Size ?? 0),
      lastModified: o.LastModified ? o.LastModified.toISOString() : null,
      url: publicUrlForKey(o.Key as string),
    }))

  return {
    folders,
    objects,
    truncated: Boolean(res.IsTruncated),
    nextToken: res.NextContinuationToken ?? null,
  }
}

export async function deletePublicObject(key: string) {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: config.r2.bucketPublic,
      Key: key,
    }),
  )
}
