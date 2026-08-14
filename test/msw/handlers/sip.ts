import { http, HttpResponse } from 'msw';
import { TEST_CONFIG } from '../../support/env';
import {
  sipCallFixture,
  sipCallListFixture,
  ipAclFixture,
  ipAclListFixture,
  sipTrunkFixture,
  sipTrunkListFixture,
} from '../../support/fixtures/sip';
import { virtualNumberListFixture } from '../../support/fixtures/vns';

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const sipHandlers = [
  // SIP Calls
  http.get(url('/sip/calls'), () => HttpResponse.json(sipCallListFixture())),

  http.get(url('/sip/calls/:id'), ({ params }) =>
    HttpResponse.json(sipCallFixture({ id: params.id as string }))
  ),

  // SIP IP ACLs
  http.post(url('/sip/ip-acls'), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return HttpResponse.json(
      ipAclFixture({ name: body.name || 'Office IP ACL' }),
      { status: 201 }
    );
  }),

  http.get(url('/sip/ip-acls'), () => HttpResponse.json(ipAclListFixture())),

  http.get(url('/sip/ip-acls/:id'), ({ params }) =>
    HttpResponse.json(ipAclFixture({ id: params.id as string }))
  ),

  http.patch(url('/sip/ip-acls/:id'), async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ReturnType<typeof ipAclFixture>
    >;
    return HttpResponse.json(
      ipAclFixture({ id: params.id as string, ...body })
    );
  }),

  http.delete(url('/sip/ip-acls/:id'), () =>
    HttpResponse.json({
      success: true,
      message: 'IP ACL deleted successfully.',
    })
  ),

  // SIP Trunks
  http.post(url('/sip/trunks'), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return HttpResponse.json(
      sipTrunkFixture({ name: body.name || 'Primary Trunk' }),
      { status: 201 }
    );
  }),

  http.get(url('/sip/trunks'), () => HttpResponse.json(sipTrunkListFixture())),

  http.get(url('/sip/trunks/:id/virtual-numbers'), () =>
    HttpResponse.json(virtualNumberListFixture())
  ),

  http.get(url('/sip/trunks/:id'), ({ params }) =>
    HttpResponse.json(sipTrunkFixture({ id: params.id as string }))
  ),

  http.patch(url('/sip/trunks/:id'), async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ReturnType<typeof sipTrunkFixture>
    >;
    return HttpResponse.json(
      sipTrunkFixture({ id: params.id as string, ...body })
    );
  }),

  http.delete(url('/sip/trunks/:id'), () =>
    HttpResponse.json({
      success: true,
      message: 'Trunk deleted successfully.',
    })
  ),
];
