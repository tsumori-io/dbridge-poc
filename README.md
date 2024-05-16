# DBridge bridging example

In this POC we provide an example of bridging USDC from BASE to Arbitrum.

We use the 

### Pre-requisites

- [bun](https://bun.sh/docs/installation)
- ensure a minimum of $2 [USDC](https://basescan.org/address/0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA) in the BASE account wallet

### Steps

1. `bun install`
2. set `PRIVATE_KEY` var in [`.env`](.env) file
3. `bun run index.ts`

## Example transaction

### Bridge USDC from BASE to Arbitrum

Origin TX: https://basescan.org/tx/0xd5b82b971bfd5240f5521e80708cccac22a470b02b71efff950bbe80a8cfb571
Destination TX: https://arbiscan.io/tx/0xa51dc11b1a804785fc2279a64e85929d30975cc19fad0f843a88eb6f07727bfb
