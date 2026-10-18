export async function copyShareLink(
 url: string,
 clipboard?: Pick<Clipboard, 'writeText'>,
): Promise<boolean> {
 if (!clipboard) return false;
 try {
  await clipboard.writeText(url);
  return true;
 } catch {
  return false;
 }
}
