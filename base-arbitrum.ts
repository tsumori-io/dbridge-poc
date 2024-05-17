#!/usr/bin/env node

/**
 * The script represents a bridging tx Base chain to Arbitrum
 * It's an adaptation of the example from docs: https://docs.dln.trade/dln-api/quick-start-guide
 */

import { $ } from "bun";

import { createWalletClient, http } from 'viem'
import { arbitrum, base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ENV vars
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`

// CONTRACT ADDRESSES
const USDCE_ARBITRUM = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
const USDC_BASE = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'

const BASE_RPC_URL = base.rpcUrls.default.http[0]
const evmAccount = privateKeyToAccount(PRIVATE_KEY) 
const client = createWalletClient({ account: evmAccount, chain: base, transport: http()})

console.info(`caller address: ${evmAccount.address}`)

// Get quote for swap
const quoteURLParams = new URLSearchParams({
  srcChainId: base.id,
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: 1_500_000, // 1.5 USDC
  dstChainId: arbitrum.id,
  dstChainTokenOut: USDCE_ARBITRUM,
  prependOperatingExpenses: 'true',
} as any);
const quote = await fetch(`https://api.dln.trade/v1.0/dln/order/quote?${quoteURLParams.toString()}`).then(res => res.json())

// Get pre-constructed tx for bridging
const createTxURLParams = new URLSearchParams({
  srcChainId: base.id,
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: quote.estimation.srcChainTokenIn.amount,
  dstChainId: arbitrum.id,
  dstChainTokenOut: USDCE_ARBITRUM,
  dstChainTokenOutAmount: quote.estimation.dstChainTokenOut.recommendedAmount,
  dstChainTokenOutRecipient: evmAccount.address,
  srcChainOrderAuthorityAddress: evmAccount.address,
  dstChainOrderAuthorityAddress: evmAccount.address,
} as any);
const createTx = await fetch(`https://api.dln.trade/v1.0/dln/order/create-tx?${createTxURLParams.toString()}`).then(res => res.json())

// get allowance for the contract - using cast
const allowance = await $`cast call ${USDC_BASE} "allowance(address,address)(uint256)" ${evmAccount.address} ${createTx.tx.to} --rpc-url ${BASE_RPC_URL}`.text().then(a => +a.split(' ')[0]);
console.log('allowance:', allowance)

if (allowance < Number(quote.estimation.srcChainTokenIn.amount)) {
  console.log(`approving ${USDC_BASE} for ${createTx.tx.to} for 1000000000...`)
  const data = await $`cast calldata "approve(address,uint256)" ${createTx.tx.to} 1000000000`.text().then(s => s.trim()) as `0x${string}`
  const hash = await client.sendTransaction({ to: USDC_BASE, data })
  console.info(`approve tx hash: ${client.chain.blockExplorers.default.url}/tx/${hash}`)
}

console.log('sending bridge tx...')
const bridgeHash = await client.sendTransaction(createTx.tx)
console.info(`bridge tx hash: ${client.chain.blockExplorers.default.url}/tx/${bridgeHash}`)
