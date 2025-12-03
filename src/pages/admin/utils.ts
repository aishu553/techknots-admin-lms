// src/pages/admin/utils.ts
export function generateMentorCode(): string {
  const part = () => Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MNTR-${part()}${Math.floor(Math.random()*90+10)}`;
}
