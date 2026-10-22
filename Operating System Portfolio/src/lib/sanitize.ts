// Visitor text is stored as plain text and rendered by React, which escapes
// it. This only tidies it: control characters out, whitespace collapsed,
// links replaced so the guestbook cannot be used for spam.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|dev|app|xyz|ru|cn|info|biz|co|me|ly|gg|link|site|online|top)\b\S*/gi;

export function cleanText(input: string, { stripLinks = true } = {}): string {
  let text = input.normalize("NFC").replace(CONTROL, "");
  if (stripLinks) text = text.replace(LINK, "[link removed]");
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
