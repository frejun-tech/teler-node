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
import { AuthenticationType, Transport } from '@/types/sip';
import type { CreateSipTrunkPayload, UpdateSipTrunkPayload, SipTrunkResponse } from '@/types/sip';

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
    const body = (await request.json().catch(() => ({}))) as CreateSipTrunkPayload;

    if (body.transport !== undefined && body.secure !== undefined) {
      return HttpResponse.json(
        {
          success: false,
          message:
            "Provide either 'secure' or 'transport', not both; 'transport' supersedes 'secure'",
        },
        { status: 422 }
      );
    }

    let transport: Transport;
    let secure: boolean;
    if (body.transport) {
      transport = body.transport;
      secure = transport === Transport.TLS;
    } else if (body.secure !== undefined) {
      secure = body.secure;
      transport = secure ? Transport.TLS : Transport.TCP;
    } else {
      secure = true;
      transport = Transport.TLS;
    }

    const authType = body.authentication_type || AuthenticationType.IP;
    if (transport === Transport.UDP && authType !== AuthenticationType.CREDENTIAL) {
      return HttpResponse.json(
        {
          success: false,
          message:
            'UDP transport requires credential (digest) authentication. IP/ACL-based authentication over UDP is not permitted.',
        },
        { status: 422 }
      );
    }

    return HttpResponse.json(
      sipTrunkFixture({
        name: body.name || 'Primary Trunk',
        secure,
        transport,
        authentication_type: authType,
      }),
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
    const body = (await request.json().catch(() => ({}))) as UpdateSipTrunkPayload;

    if (body.transport !== undefined && body.secure !== undefined) {
      return HttpResponse.json(
        {
          success: false,
          message:
            "Provide either 'secure' or 'transport', not both; 'transport' supersedes 'secure'",
        },
        { status: 422 }
      );
    }

    let transportOverrides: Partial<SipTrunkResponse> = {};
    let targetTransport: Transport | undefined = body.transport;

    if (body.transport) {
      targetTransport = body.transport;
      transportOverrides = {
        transport: body.transport,
        secure: body.transport === Transport.TLS,
      };
    } else if (body.secure !== undefined) {
      targetTransport = body.secure ? Transport.TLS : Transport.TCP;
      transportOverrides = {
        secure: body.secure,
        transport: targetTransport,
      };
    }

    if (
      targetTransport === Transport.UDP &&
      body.authentication_type &&
      body.authentication_type !== AuthenticationType.CREDENTIAL
    ) {
      return HttpResponse.json(
        {
          success: false,
          message:
            'UDP transport requires credential (digest) authentication. IP/ACL-based authentication over UDP is not permitted.',
        },
        { status: 422 }
      );
    }

    return HttpResponse.json(
      sipTrunkFixture({
        id: params.id as string,
        ...body,
        ...transportOverrides,
      })
    );
  }),

  http.delete(url('/sip/trunks/:id'), () =>
    HttpResponse.json({
      success: true,
      message: 'Trunk deleted successfully.',
    })
  ),
];
