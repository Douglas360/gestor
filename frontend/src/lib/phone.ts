// Very small helper to normalize WhatsApp phone numbers into E.164-like format.
// MVP assumptions: Brazil default (+55) when user types 10/11 digits.

export function normalizeWhatsappPhone(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const raw = (input || '').trim();
  if (!raw) return { ok: false, error: 'WhatsApp é obrigatório' };

  // keep digits only
  let digits = raw.replace(/\D+/g, '');

  // common: leading 00 (international)
  if (digits.startsWith('00')) digits = digits.slice(2);

  // if user pasted with leading 55 already, keep
  // if looks like BR local (10/11 digits), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  // basic sanity: country(1-3) + subscriber(6-12) => total 10-15
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, error: 'Número inválido. Use DDD + número. Ex: +55 11 99999-9999' };
  }

  return { ok: true, value: `+${digits}` };
}
