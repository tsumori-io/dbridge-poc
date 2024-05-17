#!/usr/bin/env node

/**
 * The script represents a bridging tx Base chain to Solana
 * It's an adaptation of the example from docs: https://docs.dln.trade/dln-api/quick-start-guide
 */

import { $ } from "bun";

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { createWalletClient, http } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ENV vars
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY as string
const SOLANA_CHAIN_ID = 7565164

// CONTRACT ADDRESSES
const USDC_BASE = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const BASE_RPC_URL = base.rpcUrls.default.http[0]
const evmAccount = privateKeyToAccount(PRIVATE_KEY) 
const evmClient = createWalletClient({ account: evmAccount, chain: base, transport: http() })

const keypair = Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY))

console.info(`caller address: ${evmAccount.address}`)

// Get quote for swap
const quoteURLParams = new URLSearchParams({
  srcChainId: base.id,
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: 1_500_000, // 1.5 USDC
  dstChainId: SOLANA_CHAIN_ID,
  dstChainTokenOut: USDC_SOLANA,
  prependOperatingExpenses: 'true',
} as any);
const quote = await fetch(`https://api.dln.trade/v1.0/dln/order/quote?${quoteURLParams.toString()}`).then(res => res.json())

// Get pre-constructed tx for bridging
const createTxURLParams = new URLSearchParams({
  srcChainId: base.id,
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: quote.estimation.srcChainTokenIn.amount,
  dstChainId: SOLANA_CHAIN_ID,
  dstChainTokenOut: USDC_SOLANA,
  dstChainTokenOutAmount: quote.estimation.dstChainTokenOut.recommendedAmount,
  dstChainTokenOutRecipient: keypair.publicKey,
  srcChainOrderAuthorityAddress: evmAccount.address,
  dstChainOrderAuthorityAddress: keypair.publicKey,
} as any);
const createTx = await fetch(`https://api.dln.trade/v1.0/dln/order/create-tx?${createTxURLParams.toString()}`).then(res => res.json())
// console.log(createTx)

// get allowance for the contract - using cast
console.log(`cast call ${USDC_BASE} "allowance(address,address)(uint256)" ${evmAccount.address} ${createTx.tx.to} --rpc-url ${BASE_RPC_URL}`)
const allowance = await $`cast call ${USDC_BASE} "allowance(address,address)(uint256)" ${evmAccount.address} ${createTx.tx.to} --rpc-url ${BASE_RPC_URL}`.text().then(a => +a.split(' ')[0]);
console.log('allowance:', allowance)

// increase allowance if not sufficient
if (allowance < Number(quote.estimation.srcChainTokenIn.amount)) {
  console.log(`approving ${USDC_BASE} for ${createTx.tx.to} for 1000000000...`)
  const data = await $`cast calldata "approve(address,uint256)" ${createTx.tx.to} 1000000000`.text().then(s => s.trim()) as `0x${string}`
  const hash = await evmClient.sendTransaction({ to: USDC_BASE, data })
  console.info(`approve tx hash: ${evmClient.chain.blockExplorers.default.url}/tx/${hash}`)
}

console.log('sending bridge tx...')
const response = await $`cast send ${createTx.tx.to} ${createTx.tx.data} --value ${createTx.tx.value} --rpc-url ${BASE_RPC_URL} --private-key ${PRIVATE_KEY}`.text().then(s => s.trim())
console.log(response)
// console.info(`bridge tx hash: ${evmClient.chain.blockExplorers.default.url}/tx/${bridgeHash}`)
