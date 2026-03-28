# HCV Mainnet Token Launch Order (обязательно)

Дата: 28 марта 2026

Цель: гарантировать корректное отображение имени/иконки токена и сохранить фиксированную эмиссию.

## Обязательный порядок действий

1. Создать mint (`decimals = 6`) в mainnet.
2. Создать on-chain Metaplex metadata account для этого mint (name/symbol/uri).
3. Проверить metadata в explorer (name, symbol, image URL).
4. Выпустить ровно `5,000,000` токенов.
5. Отключить mint authority (`mint --disable`).
6. Инициализировать `HcvState` и назначить multisig authority.
7. Проверить, что `update_nav` и `update_metadata_uri` доступны только через multisig.

## Почему именно так

- Если отключить mint authority раньше, создание metadata может не пройти (authority mismatch).
- Metadata должна быть создана до финальной блокировки эмиссии.

## Команды (шаблон)

```bash
# 1) mint
spl-token create-token --decimals 6
export MINT_ADDRESS="<MAINNET_MINT>"

# 2) metadata JSON локально
cat > /tmp/hcv-mainnet-metaboss.json <<'JSON'
{
  "name": "HCV",
  "symbol": "HCV",
  "uri": "<FINAL_METADATA_URI>",
  "seller_fee_basis_points": 0,
  "creators": null,
  "collection": null,
  "uses": null
}
JSON

# 3) создать metadata account
metaboss create metadata \
  --rpc https://api.mainnet-beta.solana.com \
  --keypair ~/.config/solana/id.json \
  --mint "$MINT_ADDRESS" \
  --metadata /tmp/hcv-mainnet-metaboss.json

# 4) fixed supply
spl-token create-account "$MINT_ADDRESS"
spl-token mint "$MINT_ADDRESS" 5000000

# 5) disable mint
spl-token authorize "$MINT_ADDRESS" mint --disable
spl-token display "$MINT_ADDRESS"
```

## Валидация после запуска

- `spl-token display <MINT_ADDRESS>`:
  - supply = `5000000000000`
  - `Mint authority: (not set)`
  - `Freeze authority: (not set)`
- explorer показывает `HCV` и иконку
- `read:state` показывает корректный `multisig_authority`
