# HCV Mainnet Checklist

Дата: 28 марта 2026

Статус:
- `[x]` = уже сделано в devnet
- `[ ]` = еще не сделано для mainnet

## 1. Preflight (до запуска)

- [x] Код в `blockchain/anchor-hcv` зафиксирован (devnet реализация готова)
- [ ] Пройден внешний аудит (или получен финальный отчет с критическими правками)
- [ ] Финальный metadata JSON утвержден (сейчас используется devnet URI)
- [ ] Финальный metadata URI (Arweave/IPFS) утвержден
- [ ] Определены 5 владельцев mainnet multisig (на devnet 5 owners уже есть)
- [ ] Создан mainnet Squads multisig `3/5` (devnet multisig уже создан)
- [ ] У mainnet multisig есть SOL на комиссии
- [ ] Deployer wallet для mainnet отдельный и безопасно хранится (devnet deployer уже есть)
- [ ] Backup seed/keys оформлен по внутреннему регламенту

## 2. Mainnet переменные

```bash
export CLUSTER_URL="https://api.mainnet-beta.solana.com"
export ANCHOR_PROVIDER_URL="$CLUSTER_URL"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"

# заполнить перед запуском
export MAINNET_MULTISIG_VAULT="<MAINNET_SQUADS_VAULT>"
export METADATA_URI="<FINAL_METADATA_URI>"
```

## 3. Выпуск токена HCV в mainnet

Статус: `[x]` выполнено на devnet, `[ ]` не выполнено на mainnet.

Важно:
- Соблюдать порядок из `hcv-mainnet-token-launch-order.md` (metadata до `mint --disable`).

```bash
solana config set --url "$CLUSTER_URL"
solana config set --keypair "$ANCHOR_WALLET"

spl-token create-token --decimals 6
# сохранить mint
export MINT_ADDRESS="<MAINNET_HCV_MINT>"

# создать on-chain metadata account (metaboss) до отключения mint authority
# см. hcv-mainnet-token-launch-order.md

spl-token create-account $MINT_ADDRESS
spl-token mint $MINT_ADDRESS 5000000
spl-token supply $MINT_ADDRESS
```

Ожидаемо:
- supply = `5000000`

Отключить mint authority:

```bash
spl-token authorize $MINT_ADDRESS mint --disable
spl-token display $MINT_ADDRESS
```

Проверить:
- `Mint authority: (not set)`
- `Freeze authority: (not set)`

## 4. Деплой программы в mainnet

Статус: `[x]` выполнено на devnet, `[ ]` не выполнено на mainnet.

```bash
cd /Users/alex/Projects/G-quant/blockchain/anchor-hcv
anchor build
anchor deploy --provider.cluster mainnet --provider.wallet "$ANCHOR_WALLET"
```

Сохранить:
- Program ID
- deploy signature

## 5. Инициализация HcvState (mainnet)

Статус: `[x]` выполнено на devnet, `[ ]` не выполнено на mainnet.

```bash
cd /Users/alex/Projects/G-quant/blockchain/anchor-hcv

export MINT_ADDRESS="<MAINNET_HCV_MINT>"
export MULTISIG_VAULT="$MAINNET_MULTISIG_VAULT"
export METADATA_URI="$METADATA_URI"
export INITIAL_NAV_MICROUNITS="0"

npm run init:state
```

Сохранить:
- State PDA
- initialize signature

## 6. Проверки доступа

1. Проверка запрета для обычного кошелька:

```bash
npm run update:nav
```

Ожидаемо: `Unauthorized`.
Статус: `[x]` выполнено на devnet.

2. Проверка обновления через multisig (Squads TX Builder):
- Program ID: `<MAINNET_PROGRAM_ID>`
- Account 1 (state PDA): writable ON, signer OFF
- Account 2 (vault): writable OFF, signer ON
- Data: сформировать через локальный helper-скрипт:

```bash
cd /Users/alex/Projects/G-quant/blockchain/anchor-hcv

IX_TYPE=update_nav \
NEW_NAV_MICROUNITS="<VALUE>" \
NEW_ALGORITHM_HASH_HEX="<64_HEX>" \
NEW_STRATEGIES_HASH_HEX="<64_HEX>" \
npm run build:ix
```

Использовать в Squads поле `Data` значение `base58` из вывода.

3. После execute:

```bash
npm run read:state
```

Ожидаемо: `nav_microunits` изменился.
Статус: `[x]` выполнено на devnet.

## 7. Операционные действия после запуска

- [ ] Перевести `3068 HCV` команде
- [ ] Опубликовать mainnet адреса:
  - Mint
  - Program ID
  - State PDA
  - Multisig vault
- [ ] Опубликовать tx-ссылки запуска (mint, disable authority, initialize)
- [ ] Опубликовать первый NAV update tx

Примечание:
- На devnet токен, программа, state и update_nav уже выполнены и проверены.

## 8. Инварианты (обязательно)

- [ ] Total supply ровно `5,000,000 HCV`
- [ ] Допэмиссия невозможна (`mint authority = none`)
- [ ] Заморозка невозможна (`freeze authority = none`)
- [ ] `update_nav` и `update_metadata_uri` доступны только через multisig
- [ ] Все ключевые обновления подтверждаются on-chain транзакциями

## 9. Preflight run command (рекомендовано перед запуском)

```bash
cd /Users/alex/Projects/G-quant/blockchain/anchor-hcv
export ANCHOR_PROVIDER_URL="$CLUSTER_URL"
export ANCHOR_WALLET="$ANCHOR_WALLET"
export MINT_ADDRESS="$MINT_ADDRESS"
npm run preflight:check
```

Проверяет:
- mint decimals
- raw supply
- mint/freeze authority
- соответствие state.mint и state.multisig_authority

## 10. Rollback/incident notes

- Если ошибка до `mint --disable`: остановить процесс, исправить конфиг, повторить.
- Если ошибка после `mint --disable`: supply уже фиксирован, действовать только через новую согласованную процедуру и аудит.
- Любые изменения прав доступа только через согласованный multisig proposal.
