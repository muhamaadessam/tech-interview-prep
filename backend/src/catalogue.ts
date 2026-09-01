import { createDatabaseQuestionReader, DatabaseQuestionNotFound, type DatabaseQuestion } from "../../src/questions/database.ts";
import { fetchUpstream } from "./upstream.ts";

export class CatalogueError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "CatalogueError"; this.code = code; this.status = status; }
}

export type CatalogueStore = { getQuestion: (slug: string, locale: "ar" | "en") => Promise<DatabaseQuestion> };

export function createSupabaseCatalogueStore({ url, serviceRoleKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): CatalogueStore {
  const read = createDatabaseQuestionReader({ url, key: serviceRoleKey, fetchImpl: (input, init) => fetchUpstream(fetchImpl, input, init) });
  return {
    async getQuestion(slug, locale) {
      try { return await read(slug, locale); }
      catch (error) {
        if (error instanceof DatabaseQuestionNotFound) throw new CatalogueError("question_not_found", 404);
        throw new CatalogueError("catalogue_unavailable", 503);
      }
    },
  };
}
