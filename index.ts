#!/usr/bin/env node

/**
 * The script represents a bridging tx Base chain to Arbitrum
 * It's an adaptation of the example from docs: https://docs.dln.trade/dln-api/quick-start-guide
 */

import { $ } from "bun";
import { JsonRpcApiProvider, ethers, getDefaultProvider, parseEther } from 'ethers'

const CHAIN_CONFIG = {
  Ethereum: {
    chainId: 1,
    flatFee: '0.001 ETH',
  },
  BNBChain: {
    chainId: 56,
    flatFee: '0.005 BNB',
  },
  Polygon: {
    chainId: 137,
    flatFee: '0.5 MATIC',
  },
  Arbitrum: {
    chainId: 42161,
    flatFee: '0.001 ETH',
  },
  Avalanche: {
    chainId: 43114,
    flatFee: '0.05 AVAX',
  },
  Solana: {
    chainId: 7565164,
    flatFee: '0.015 SOL',
  },
  Linea: {
    chainId: 59144,
    flatFee: '0.001 ETH',
  },
  Base: {
    chainId: 8453,
    flatFee: '0.001 ETH',
  },
  Optimism: {
    chainId: 10,
    flatFee: '0.001 ETH',
  },
}
const DLN_CONTRACTS = {
  solana: {
    dlnSource: 'src5qyZHqTqecJV4aY6Cb6zDZLMDzrDKKezs22MPHr4',
    dlnDestination: 'dst5MGcFPoBeREFAA5E3tU5ij8m5uVYwkzkSAbsLbNo',
  },
  evm: {
    dlnSource: '0xeF4fB24aD0916217251F553c0596F8Edc630EB66',
    dlnDestination: '0xe7351fd770a37282b91d153ee690b63579d6dd7f',
    crosschainForwarder: '0x663dc15d3c1ac63ff12e45ab68fea3f0a883c251',
    externalCallExecutor: '0xFC2CA4022d26AD4dCb3866ae30669669F6A28f19',
  },
}

// ENV vars
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

// CONTRACT ADDRESSES
const USDCE_ARBITRUM = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
const USDC_BASE = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'

const ARBITRUM_RPC_URL = 'https://arb1.arbitrum.io/rpc '
const BASE_RPC_URL = 'https://mainnet.base.org'
const provider = getDefaultProvider(BASE_RPC_URL)
const signer = new ethers.Wallet(PRIVATE_KEY, provider)

console.log(`Address: ${signer.address}`)

// Get quote for swap
const quoteURLParams = new URLSearchParams({
  srcChainId: CHAIN_CONFIG.Base.chainId,
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: 1_500_000, // 1.5 USDC
  dstChainId: CHAIN_CONFIG.Arbitrum.chainId,
  dstChainTokenOut: USDCE_ARBITRUM,
  prependOperatingExpenses: 'true',
} as any);
const quote = await fetch(`https://api.dln.trade/v1.0/dln/order/quote?${quoteURLParams.toString()}`).then(res => res.json())

const createTxURLParams = new URLSearchParams({
  srcChainId: CHAIN_CONFIG.Base.chainId.toString(),
  srcChainTokenIn: USDC_BASE,
  srcChainTokenInAmount: quote.estimation.srcChainTokenIn.amount,
  dstChainId: CHAIN_CONFIG.Arbitrum.chainId.toString(),
  dstChainTokenOut: USDCE_ARBITRUM,
  dstChainTokenOutAmount: quote.estimation.dstChainTokenOut.recommendedAmount,
  dstChainTokenOutRecipient: signer.address,
  srcChainOrderAuthorityAddress: signer.address,
  dstChainOrderAuthorityAddress: signer.address,
} as any);
const createTx = await fetch(`https://api.dln.trade/v1.0/dln/order/create-tx?${createTxURLParams.toString()}`).then(res => res.json())

// get allowance for the contract - using cast
const allowance = await $`cast call ${USDC_BASE} "allowance(address,address)(uint256)" ${signer.address} ${createTx.tx.to} --rpc-url ${BASE_RPC_URL}`.text();
console.log('Allowance:', allowance)

if (Number(allowance) < Number(quote.estimation.srcChainTokenIn.amount)) {
  const cmd = `cast send ${USDC_BASE} "approve(address,uint256)(bool)" ${createTx.tx.to} 1000000000 --rpc-url ${BASE_RPC_URL} --private-key ${PRIVATE_KEY}`
  console.log(`approving 1000 USDC:\n${cmd}`)
  const tx = await $`${cmd}`.text();
  console.log('Tx sent:', tx)
}

console.log('Sending tx...')
const tx = await signer.sendTransaction(createTx.tx)
console.log('Tx sent:', tx.hash)

const receipt = await tx.wait()
console.log(receipt)
