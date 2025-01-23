import type { JSONSchema } from "json-schema-to-ts";

/**
 * JSON schema for validating a workspace object.
 * This schema describes a workspace entity with:
 * - A `path` string property.
 * - A `doc` object property (mapping arbitrary string keys to string values).
 * - A `meta` object describing creation and modification metadata.
 */
export const workspaceSchema = {
  $id: "workspace.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Workspace",
  type: "object",
  required: ["path", "doc", "meta"],
  properties: {
    path: { type: "string" },
    doc: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    meta: {
      type: "object",
      required: ["createdBy", "createdAt", "lastModifiedBy", "lastModifiedAt"],
      properties: {
        createdBy: { type: "string" },
        createdAt: { type: "number" },
        lastModifiedBy: { type: "string" },
        lastModifiedAt: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

/**
 * JSON schema for validating a channel object.
 * This schema closely resembles the workspace schema, but is intended for channel entities.
 * Properties:
 * - `path`: A string representing the channel path.
 * - `doc`: An object that stores arbitrary string properties.
 * - `meta`: Metadata about creation and modification, including timestamps and user IDs.
 */
export const channelSchema = {
  $id: "channel.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Channel",
  type: "object",
  required: ["path", "doc", "meta"],
  properties: {
    path: { type: "string" },
    doc: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    meta: {
      type: "object",
      required: ["createdBy", "createdAt", "lastModifiedBy", "lastModifiedAt"],
      properties: {
        createdBy: { type: "string" },
        createdAt: { type: "number" },
        lastModifiedBy: { type: "string" },
        lastModifiedAt: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

/**
 * JSON schema for validating a post object.
 * This schema is more detailed, requiring certain fields related to message content, parent-post references, and reactions.
 * Properties:
 * - `path`: A string identifying the post path.
 * - `doc`: An object containing:
 *    - `msg` (required string): The message text of the post.
 *    - `parent` (optional string): A reference to a parent post.
 *    - `reactions`: An object mapping reaction types (strings) to arrays of user IDs (strings).
 *    - `extensions`: Arbitrary string properties for extensibility.
 * - `meta`: Standard metadata about creation and modification.
 */
export const postSchema = {
  // $id: "post.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Post",
  type: "object",
  required: ["path", "doc", "meta"],
  properties: {
    path: { type: "string" },
    doc: {
      type: "object",
      required: ["msg"],
      properties: {
        msg: { type: "string" },
        parent: { type: "string" },
        reactions: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: { type: "string" },
          },
        },
        extensions: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
      additionalProperties: false,
    },
    meta: {
      type: "object",
      required: ["createdBy", "createdAt", "lastModifiedBy", "lastModifiedAt"],
      properties: {
        createdBy: { type: "string" },
        createdAt: { type: "number" },
        lastModifiedBy: { type: "string" },
        lastModifiedAt: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

/**
 * JSON schema for validating responses after creating or deleting a resource.
 * Properties:
 * - `uri` (string): The URI of the created or deleted resource.
 */
export const creationDeletionResponse = {
  $id: "CreationDeletionResponse.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CreationDeletionResponse",
  type: "object",
  required: ["uri"],
  properties: {
    uri: { type: "string" },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

/**
 * JSON schema for validating responses after applying a patch.
 * Properties:
 * - `uri` (string): The URI of the patched resource.
 * - `patchFailed` (boolean): Indicates whether the patch operation failed.
 * - `message` (string): A message providing additional context.
 */
export const patchResponseSchema = {
  $id: "PatchResponse.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "PatchResponse",
  type: "object",
  required: ["uri", "patchFailed", "message"],
  properties: {
    uri: { type: "string" },
    patchFailed: { type: "boolean" },
    message: { type: "string" },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;
