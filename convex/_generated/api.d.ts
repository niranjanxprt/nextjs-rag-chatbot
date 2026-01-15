/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as auth_ResendMagicLink from "../auth/ResendMagicLink.js";
import type * as auth_ResendOTP from "../auth/ResendOTP.js";
import type * as mutations_conversations from "../mutations/conversations.js";
import type * as mutations_documents from "../mutations/documents.js";
import type * as mutations_preferences from "../mutations/preferences.js";
import type * as mutations_projects from "../mutations/projects.js";
import type * as mutations_prompts from "../mutations/prompts.js";
import type * as mutations_users from "../mutations/users.js";
import type * as queries_conversations from "../queries/conversations.js";
import type * as queries_documents from "../queries/documents.js";
import type * as queries_preferences from "../queries/preferences.js";
import type * as queries_projects from "../queries/projects.js";
import type * as queries_prompts from "../queries/prompts.js";
import type * as queries_users from "../queries/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "auth/ResendMagicLink": typeof auth_ResendMagicLink;
  "auth/ResendOTP": typeof auth_ResendOTP;
  "mutations/conversations": typeof mutations_conversations;
  "mutations/documents": typeof mutations_documents;
  "mutations/preferences": typeof mutations_preferences;
  "mutations/projects": typeof mutations_projects;
  "mutations/prompts": typeof mutations_prompts;
  "mutations/users": typeof mutations_users;
  "queries/conversations": typeof queries_conversations;
  "queries/documents": typeof queries_documents;
  "queries/preferences": typeof queries_preferences;
  "queries/projects": typeof queries_projects;
  "queries/prompts": typeof queries_prompts;
  "queries/users": typeof queries_users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
