import { PayOS } from '@payos/node';

let _payos: PayOS | null = null;

export function getPayOS(): PayOS {
  if (!_payos) {
    _payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID!,
      apiKey: process.env.PAYOS_API_KEY!,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    });
  }
  return _payos;
}
