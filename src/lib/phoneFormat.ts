export function formatWhatsappPhone(input: string): string {
  if (!input) return "";
  const digits = input.replace(/\D+/g, "");

  // Brazil +55 (DDD + 9 digits)
  if (digits.startsWith("55") && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9, 13);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Brazil +55 (DDD + 8 digits)
  if (digits.startsWith("55") && digits.length === 12) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 8);
    const part2 = digits.slice(8, 12);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Generic fallback: keep + if present
  if (input.trim().startsWith("+")) return input.trim();
  return `+${digits}`;
}
