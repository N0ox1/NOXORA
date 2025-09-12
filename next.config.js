const corsHeaders = [
  { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS?.trim() || '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'content-type, authorization, x-tenant-id' },
  { key: 'Access-Control-Max-Age', value: '86400' },
  { key: 'Vary', value: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers' }
];
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/instrumentation-pg',
    '@prisma/instrumentation'
  ],
  webpack: (config) => {
    // silencia warnings ruidosos de instrumentations opcionais
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation/ },
      { module: /@sentry\/node\/build\/cjs\/integrations/ }
    ];
    return config;
  },
  async headers() {
    return [
      { source: '/api/:path*', headers: [...corsHeaders, ...securityHeaders] },
      { source: '/:path*', headers: securityHeaders }
    ];
  }
};

module.exports = nextConfig;