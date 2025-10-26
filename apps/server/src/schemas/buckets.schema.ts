import { Type, Static } from "@sinclair/typebox";

// Schema for creating a new bucket
export const CreateBucketSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.String({ minLength: 1 }),
  riskMeasure: Type.String({ minLength: 1, maxLength: 255 }),
});

export type CreateBucketInput = Static<typeof CreateBucketSchema>;

// Schema for bucket response
export const BucketSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  riskMeasure: Type.String(),
  createdBy: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  creator: Type.Optional(
    Type.Object({
      fullName: Type.String(),
    })
  ),
});

export type BucketResponse = Static<typeof BucketSchema>;

// Schema for list buckets response
export const ListBucketsSchema = Type.Object({
  buckets: Type.Array(BucketSchema),
  total: Type.Number(),
});

export type ListBucketsResponse = Static<typeof ListBucketsSchema>;
