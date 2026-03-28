# HCV Devnet: отчет о готовности

Дата: 28 марта 2026
Проект: G-Quant
Статус: готово к этапу `Mainnet Preflight`

## 1. Что уже готово

### 1.1 Токен HCV (SPL)

- Mint создан в сети devnet: `Eczz4PZSUe2i1rVJ9mNWBzAzdjGgjyPGBkrqMwPohKCw`
- Decimals: `6`
- Выпущено ровно: `5,000,000.000000 HCV` (raw supply: `5000000000000`)
- Mint authority: `(not set)`
- Freeze authority: `(not set)`

Итог: дополнительная эмиссия и заморозка адресов отключены.

### 1.2 Anchor программа управления (`hcv_control`)

- Program ID (devnet): `G9RToW2Ud4sgSQpfxGKP4zA1aqGmyw5GBtwoedtcfC4i`
- Код программы находится в:
  - `/Users/alex/Projects/G-quant/blockchain/anchor-hcv/programs/hcv_control/src/lib.rs`
- Реализованы инструкции:
  - `initialize`
  - `update_nav`
  - `update_metadata_uri`
  - `rotate_multisig`

Итог: логика управления NAV и метаданными вынесена в отдельный контракт, защищенный multisig.

### 1.3 Инициализация on-chain state

- State PDA: `EM6bZGRdropufCUEnQm3WgCdhviExKuAfKKGnomuWiVU`
- Tx инициализации: `2JJjmszx7xj3z7UG5HLe7xJFRAjmuii5EbwLdHcDaDCVmBuB2S28YN6cwZBEVBfnaeqtbWB4bce1q7ZYHcGcpc7J`
- Multisig authority в state: `GZyJL3eiqK4dQKmTh7Jg2rF8nqBHLBUcsSBRABWXv7fV`

### 1.4 Multisig-контроль подтвержден

- Создан Squads multisig `3/5`
- Попытка `update_nav` с обычного кошелька завершилась `Unauthorized` (ожидаемое поведение)
- `update_nav` через multisig выполнен успешно

Актуальные on-chain значения:
- `nav_microunits: 123456`
- `algorithm_hash: 1111111111111111111111111111111111111111111111111111111111111111`
- `strategies_hash: 2222222222222222222222222222222222222222222222222222222222222222`
- `metadata_uri: https://raw.githubusercontent.com/Krimchanin/G-quant/main/docs-public/metadata/hcv-devnet.json`

### 1.5 Публичные ссылки (devnet)

- Репозиторий: `https://github.com/Krimchanin/G-quant`
- Metadata JSON (public raw): `https://raw.githubusercontent.com/Krimchanin/G-quant/main/docs-public/metadata/hcv-devnet.json`
- Logo (public raw): `https://raw.githubusercontent.com/Krimchanin/G-quant/main/docs-public/metadata/hcv.svg`

## 2. Что подготовлено в репозитории

- Anchor проект: `/Users/alex/Projects/G-quant/blockchain/anchor-hcv`
- Скрипты:
  - `init_hcv_state.js`
  - `update_nav.js`
  - `read_state.js`
  - `build_instruction_data.js`
  - `preflight_check.js`
- Документация:
  - `hcv-token-tech-spec.md`
  - `hcv-start-checklist.md`
  - `hcv-local-setup.md`
  - `hcv-devnet-runbook.md`
  - `hcv-mainnet-checklist.md`
  - `dostup.md`

## 3. Что осталось до mainnet

1. Утвердить финальный metadata JSON (logo, description, external_url).
2. Подготовить и пройти внешний аудит (OtterSec / Sec3 / Halborn / Certik).
3. Повторить процедуру деплоя на mainnet по runbook.
4. Проверить post-deploy инварианты:
- supply = 5,000,000 HCV
- mint authority = none
- freeze authority = none
- update_nav доступен только multisig
5. Операционно закрепить регламент обновления NAV и публикации хэшей.

Примечание:
- В репозитории уже подготовлен public metadata JSON в `docs-public/metadata/hcv-devnet.json`.
- On-chain `metadata_uri` уже обновлен на GitHub raw URL через multisig.

## 4. Вывод

Devnet-реализация HCV по текущему ТЗ выполнена и рабочая:
- фиксированная эмиссия соблюдена,
- административные операции защищены multisig,
- on-chain прозрачность NAV и параметров подтверждена.
