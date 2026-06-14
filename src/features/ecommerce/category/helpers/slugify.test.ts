import { describe, expect, it } from 'vitest';
import { slugify } from '@/features/ecommerce/category/helpers/slugify';

describe('slugify', () => {
  it('Türkçe karakterleri dönüştürür', () => {
    expect(slugify('Ev & Yaşam')).toBe('ev-yasam');
  });

  it('boş slug üretilemez', () => {
    expect(slugify('!!!')).toBe('');
  });
});
