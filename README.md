# Virtec Store

Landing page da Virtec Store: produtos Apple a pronta entrega e revenda autorizada DJI.

- `index.html`: a página inteira (HTML, CSS e JS sem dependências).
- `data/products.json`: vitrine de destaques, gerada a partir da loja WooCommerce em virtecstore.com.
- `scripts/update-products.mjs`: atualiza o JSON com os produtos da categoria "destaques" em estoque.
- `.github/workflows/update-products.yml`: roda o script a cada 6 horas e faz commit quando algo muda.

## Rodar localmente

```bash
python -m http.server 8123
```

Depois abra http://localhost:8123. A vitrine precisa de um servidor HTTP para ler o JSON; abrindo o arquivo direto, ela mostra os cartões fixos do HTML.

## Atualizar a vitrine à mão

```bash
node scripts/update-products.mjs
```

Para mudar os produtos em destaque, marque ou desmarque a categoria "destaques" no painel do WooCommerce.
