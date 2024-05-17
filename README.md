# DBridge bridging example

In this POC we provide an example of bridging USDC from BASE to Arbitrum.

We use the 

### Pre-requisites

- [bun](https://bun.sh/docs/installation)
- ensure a minimum of $2 [USDC](https://basescan.org/address/0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA) in the BASE account wallet
- ensure a minimum of $2 [USDC](https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v) in the Solana account wallet
- ensure atleast `0.001 ETH` is in BASE address (pay bridging tx fee)
- ensure atleast `0.015 SOL` is in SOLANA address (pay bridging tx fee)

Note: TX fees info here https://docs.dln.trade/the-core-protocol/fees-and-supported-chains

### Steps

1. `bun install`
2. set private keys in [`.env`](.env) file
    - ethereum private key: `echo "PRIVATE_KEY=0x..." >> .env`
    - solana private key: `echo "SOLANA_PRIVATE_KEY=..." >> .env`
3. Run potential bridging scripts:
    - `bun run base-arbitrum.ts`
    - `bun run base-solana.ts`
    - `bun run solana-base.ts`

## Example transaction

### Bridge USDC from BASE to Arbitrum

Origin TX: https://basescan.org/tx/0xd5b82b971bfd5240f5521e80708cccac22a470b02b71efff950bbe80a8cfb571
Destination TX: https://arbiscan.io/tx/0xa51dc11b1a804785fc2279a64e85929d30975cc19fad0f843a88eb6f07727bfb

### Bridge USDC from BASE to Solana

Origin TX: https://basescan.org/tx/0x200c6111f46649b1b2a1555d5263a569e736e599605ad5746ad53c51c82fd43c
Destination TX: https://solana.fm/tx/2G6jkPnqiQ38SKpErmyPXKgWRTBECMnhcQvrCaUZZiSN6tVt2t3iXsDH3MH91AtdwtuWbcSJAKafRrVweDt5jKnX
    or Solscan: https://solscan.io/tx/2G6jkPnqiQ38SKpErmyPXKgWRTBECMnhcQvrCaUZZiSN6tVt2t3iXsDH3MH91AtdwtuWbcSJAKafRrVweDt5jKnX

### Bridge USDC from Solana to Base

Origin TX: https://solana.fm/tx/7zHj5TviDaE4TnmWHZGSwhfcR1d6J6og5hWaDjEQ7iummUSfDkyDssmm7Z6A2K77rN89SC9UosDHoVRCSLZ5nR2
    or Solscan: https://solscan.io/tx/4kDQNafJjktTsZMkDKfWik8x7yXRV2pb58tU2MpANPRF5rE5ucx6aNvQm2ADvv8S3DhdV7F2YQCd4P5UoNr83jio
Destination TX: https://basescan.org/tx/0x931ff127cc775b40cfe6c1931f947af1451a8a428166d36262fa4db1e50663c4
