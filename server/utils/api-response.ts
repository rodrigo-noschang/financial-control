import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Dados invalidos.",
        details: error.flatten(),
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details,
      },
      { status: error.status },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      message: "Erro inesperado ao processar a requisicao.",
    },
    { status: 500 },
  );
}
