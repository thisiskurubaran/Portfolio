// Server configuration. Every external service is optional: when its keys are
// missing the feature says it is not connected instead of pretending to work.
export const env = {
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  ipSalt: process.env.IP_HASH_SALT,
  adminSecret: process.env.ADMIN_SECRET,
  resendKey: process.env.RESEND_API_KEY,
  contactTo: process.env.CONTACT_TO_EMAIL,
  contactFrom: process.env.CONTACT_FROM_EMAIL ?? "kbOS contact <onboarding@resend.dev>",
  dev: process.env.NODE_ENV === "development",
};

export const hasRedis = () => Boolean(env.redisUrl && env.redisToken);
