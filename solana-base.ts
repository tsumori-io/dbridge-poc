#!/usr/bin/env node

/**
 * The script represents a bridging tx Base chain to Arbitrum
 * It's an adaptation of the example from docs: https://docs.dln.trade/dln-api/quick-start-guide
 */

import { $ } from "bun";

import { Keypair, VersionedTransaction, Connection, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";
import { createWalletClient, http } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// NOTE: min bridge fee: 0.015 SOL
const SOLANA_CHAIN_ID = 7565164
const SOLANA_PROGRAMS = {
  DlnSource: 'src5qyZHqTqecJV4aY6Cb6zDZLMDzrDKKezs22MPHr4',
  DlnDestination: 'dst5MGcFPoBeREFAA5E3tU5ij8m5uVYwkzkSAbsLbNo'
}

// ENV vars
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY as string

// CONTRACT ADDRESSES
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDC_BASE = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'

const evmAccount = privateKeyToAccount(PRIVATE_KEY) 
const evmClient = createWalletClient({ account: evmAccount, chain: base, transport: http() })

const keypair = Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY))
const connection = new Connection(clusterApiUrl("mainnet-beta"));

console.info(`caller address: ${keypair.publicKey}`)

// Get quote for swap
const quoteURLParams = new URLSearchParams({
  srcChainId: SOLANA_CHAIN_ID,
  srcChainTokenIn: USDC_SOLANA,
  srcChainTokenInAmount: 1_500_000, // 1.5 USDC
  dstChainId: base.id,
  dstChainTokenOut: USDC_BASE,
  prependOperatingExpenses: 'true',
} as any);
const quote = await fetch(`https://api.dln.trade/v1.0/dln/order/quote?${quoteURLParams.toString()}`).then(res => res.json())
// console.info('quote:', quote)

// Get pre-constructed tx for bridging
const createTxURLParams = new URLSearchParams({
  srcChainId: SOLANA_CHAIN_ID,
  srcChainTokenIn: USDC_SOLANA,
  srcChainTokenInAmount: quote.estimation.srcChainTokenIn.amount,
  dstChainId: base.id,
  dstChainTokenOut: USDC_BASE,
  dstChainTokenOutAmount: quote.estimation.dstChainTokenOut.recommendedAmount,
  dstChainTokenOutRecipient: evmAccount.address,
  srcChainOrderAuthorityAddress: keypair.publicKey,
  dstChainOrderAuthorityAddress: evmAccount.address,
} as any);
const createTx = await fetch(`https://api.dln.trade/v1.0/dln/order/create-tx?${createTxURLParams.toString()}`).then(res => res.json())
// console.info('createTx:', createTx)

// const usdcBalanceBefore = await $`cast call ${USDC_BASE} "balanceOf(address)(uint256)" ${evmAccount.address} --rpc-url ${base.rpcUrls.default.http[0]}`.text()
// console.log(`USDC balance before ${evmAccount.address}: ${usdcBalanceBefore}`)

console.log('sending bridge tx...')
const tx = VersionedTransaction.deserialize(Buffer.from(createTx.tx.data.slice(2), "hex"));
const { blockhash } = await connection.getLatestBlockhash();
tx.message.recentBlockhash = blockhash; // Update blockhash!
tx.sign([keypair]); // Sign the tx with wallet
const bridgeHash = await connection.sendTransaction(tx);
console.info(`bridge tx hash: https://solana.fm/tx/${bridgeHash}`)
