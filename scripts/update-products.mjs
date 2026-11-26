#!/usr/bin/env node
// Atualiza data/products.json com os produtos da vitrine, direto da loja WooCommerce.
// Uso: node scripts/update-products.mjs
// Fonte: Store API pública (sem chave). A vitrine segue a categoria "destaques" da loja,
// só com o que está em estoque; se houver menos de MIN itens, completa com os mais recentes.

import { writeFile, readFile, mkdir } from 'node:fs/promises';

const STORE = 'https://virtecstore.com';
const API = `${STORE}/wp-json/wc/store/v1/products`;
const OUT = new URL('../data/products.json', import.meta.url);
const MAX = 5;
const MIN = 3;

const decode = s => s
  .replace(/&#8243;/g, '″').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

async function get(params) {
  const url = `${API}?${new URLSearchParams({ stock_status: 'instock', per_page: '20', orderby: 'date', order: 'desc', ...params })}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} em ${url}`);
  return res.json();
}

function shape(p) {
  const minor = p.prices.currency_minor_unit ?? 2;
  const price = Number(p.prices.price) / 10 ** minor;
  // "iPhone 18 Pro | 256GB | Tela de 6.3″" -> nome + especificação
  const [name, ...rest] = decode(p.name).split(/\s*[|–]\s*/).filter(Boolean);
  const img = p.images?.[0];
  return {
    id: p.id,
    name: name.trim(),
    spec: rest.join(' · ').replace(/Tela de /i, 'tela de ').trim(),
    price,
    url: p.permalink,
    image: img?.src || '',
    thumb: img?.thumbnail || img?.src || '',
    alt: decode(img?.alt || p.name),
  };
}

const destaques = (await get({ category: 'destaques' })).filter(p => p.is_in_stock);
let list = destaques;
if (list.length < MIN) {
  const recent = (await get({})).filter(p => p.is_in_stock && !list.some(d => d.id === p.id));
  list = [...list, ...recent];
}
const products = list.slice(0, MAX).map(shape);
if (!products.length) throw new Error('A loja não devolveu nenhum produto em estoque; o arquivo antigo foi mantido.');

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
// Não regrava o arquivo se os produtos não mudaram, para não gerar commits vazios.
const old = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null);
if (old && JSON.stringify(old.products) === JSON.stringify(products)) {
  console.log('products.json: sem mudanças');
  process.exit(0);
}
await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), source: STORE, products }, null, 2) + '\n');
console.log(`products.json: ${products.length} produtos (${destaques.length} da categoria destaques)`);
products.forEach(p => console.log(`  ${p.name} | ${p.spec} | R$ ${p.price.toLocaleString('pt-BR')}`));
