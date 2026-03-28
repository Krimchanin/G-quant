# HCV Anchor Project (Draft v0)

This folder contains the first draft of the Solana Anchor program for HCV:
- `programs/hcv_control`: on-chain state for NAV and algorithm parameters
- no freeze/blacklist/pause logic
- admin actions are restricted to a multisig authority key

## What this program does

1. Stores transparent on-chain state (`HcvState`):
- `nav_microunits` (integer, 6 decimals implied)
- `algorithm_hash` (32-byte hash)
- `strategies_hash` (32-byte hash)
- `metadata_uri`
- authority keys and timestamps

2. Exposes restricted admin instructions:
- `update_nav`
- `update_metadata_uri`
- `rotate_multisig`

3. Emits events for every meaningful state change so updates are visible in explorers.

## What this program does NOT do

- It does not mint SPL tokens.
- It does not provide transfers (SPL token program already does).
- It does not implement staking, vesting, burn, fees, blacklist, or pause.

## Important security notes

- Final token mint must be created as SPL token mint with 6 decimals.
- After minting exactly 5,000,000 HCV, mint authority must be set to `None`.
- Metadata updates must be executed only by Squads multisig authority.
- Program ID in `lib.rs` is currently a placeholder and must be replaced before real deployment.

## Local start (when toolchain is ready)

```bash
cd blockchain/anchor-hcv
anchor build
anchor test
```
