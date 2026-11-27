import { isAxiosError } from "axios";

export type CatalogErrorKind = "permanent" | "transient";
export type CatalogOperation = "search" | "list" | "detail";

export class CatalogError extends Error {
  readonly kind: CatalogErrorKind;
  readonly status?: number;

  constructor({
    message,
    kind,
    status,
  }: {
    message: string;
    kind: CatalogErrorKind;
    status?: number;
  }) {
    super(message);
    this.name = "CatalogError";
    this.kind = kind;
    this.status = status;
  }
}

function getCatalogErrorMessage(operation: CatalogOperation): string {
  const messages: Record<CatalogOperation, string> = {
    search: "Não foi possível buscar filmes. Tente novamente.",
    detail: "Não foi possível carregar os detalhes do filme. Tente novamente.",
    list: "Não foi possível carregar filmes. Tente novamente.",
  };

  return messages[operation];
}

export function isCatalogRequestCanceled(error: unknown): boolean {
  return isAxiosError(error) && error.code === "ERR_CANCELED";
}

export function toCatalogError(
  error: unknown,
  operation: CatalogOperation,
): CatalogError {
  if (error instanceof CatalogError) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status;
    return new CatalogError({
      message: getCatalogErrorMessage(operation),
      kind: status !== undefined && status < 500 ? "permanent" : "transient",
      status,
    });
  }

  return new CatalogError({
    message: getCatalogErrorMessage(operation),
    kind: "transient",
  });
}
