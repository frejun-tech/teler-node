import { http, HttpResponse } from "msw";
import { TEST_CONFIG } from "../../support/env";
import {
  secretFixture,
  secretListFixture
} from "../../support/fixtures/secrets";

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const secretHandlers = [
  http.post(url("/secrets"), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return HttpResponse.json(
      secretFixture({ name: body.name ?? "New Secret" }),
      { status: 201 }
    );
  }),

  http.get(url("/secrets"), () => HttpResponse.json(secretListFixture())),

  http.get(url("/secrets/:id"), ({ params }) =>
    HttpResponse.json(secretFixture({ id: params.id as string }))
  ),

  http.patch(url("/secrets/:id"), async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ReturnType<typeof secretFixture>
    >;
    return HttpResponse.json(
      secretFixture({ id: params.id as string, ...body })
    );
  }),

  http.delete(url("/secrets/:id"), () =>
    HttpResponse.json({
      success: true,
      message: "Secret deleted successfully."
    })
  )
];
