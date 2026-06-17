# E2E Testler (ileride)

Bu klasör **henüz aktif değil**. Mevcut testler `src/**/*.test.ts` ve `src/**/*.integration.test.ts` altında in-process HTTP (Fastify inject) ile çalışır.

E2E aşamasında burada akış bazlı testler tutulacak:

```
tests/e2e/flows/
  buyer-checkout.e2e.test.ts
  seller-onboarding.e2e.test.ts
```

Integration testler feature yanında kalır; E2E testler bu klasörde toplanır. Ayrı `npm run test:e2e` komutu eklenecek.

Detay: `docs/test-strategy.md`
