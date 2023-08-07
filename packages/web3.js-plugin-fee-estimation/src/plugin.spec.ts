import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'
import Web3, { Contract, FMT_BYTES, FMT_NUMBER } from 'web3'
import {
  l2StandardBridgeABI,
  l2StandardBridgeAddress,
  optimistABI,
  optimistAddress,
} from '@eth-optimism/contracts-ts'

import { OptimismFeeEstimationPlugin } from './plugin'

const defaultProvider = 'https://mainnet.optimism.io'
const provider = z.string().url().default(defaultProvider).parse(process.env['VITE_L2_RPC_URL'])
if (provider === defaultProvider) console.warn('Warning: Using default public provider, this could cause tests to fail due to rate limits. Set the VITE_L2_RPC_URL env to override default provider')

describe('OptimismFeeEstimationPlugin', () => {
  let web3: Web3

  beforeAll(() => {
    web3 = new Web3(provider)
    web3.registerPlugin(new OptimismFeeEstimationPlugin())
  })

  test('should be registered under .op namespace', () =>
    expect(web3.op).toBeDefined())

  describe('should return a bigint by default', () => {
    test('getBaseFee', async () =>
      expect(typeof (await web3.op.getBaseFee())).toBe('bigint'))

    test('getDecimals should return 6n', async () =>
      expect(await web3.op.getDecimals()).toBe(BigInt(6)))

    test('getGasPrice', async () =>
      expect(typeof (await web3.op.getGasPrice())).toBe('bigint'))

    test('getL1BaseFee', async () =>
      expect(typeof (await web3.op.getL1BaseFee())).toBe('bigint'))

    test('getOverhead should return 188n', async () =>
      expect(await web3.op.getOverhead()).toBe(BigInt(188)))

    test('getScalar should return 684000n', async () =>
      expect(await web3.op.getScalar()).toBe(BigInt(684000)))
  })

  describe('should return a number', () => {
    const numberFormat = { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX }

    test('getBaseFee', async () =>
      expect(typeof (await web3.op.getBaseFee(numberFormat))).toBe('number'))

    test('getDecimals should return 6', async () =>
      expect(await web3.op.getDecimals(numberFormat)).toBe(6))

    test('getGasPrice', async () =>
      expect(typeof (await web3.op.getGasPrice(numberFormat))).toBe('number'))

    test('getL1BaseFee', async () =>
      expect(typeof (await web3.op.getL1BaseFee(numberFormat))).toBe('number'))

    test('getOverhead should return 188', async () =>
      expect(await web3.op.getOverhead(numberFormat)).toBe(188))

    test('getScalar should return 684000', async () =>
      expect(await web3.op.getScalar(numberFormat)).toBe(684000))
  })

  test('getVersion should return the string 1.0.0', async () =>
    expect(await web3.op.getVersion()).toBe('1.0.0'))

  describe('Contract transaction gas estimates - optimistABI.burn', () => {
    let optimistContract: Contract<typeof optimistABI>
    let encodedBurnMethod: string

    beforeAll(() => {
      optimistContract = new web3.eth.Contract(optimistABI)
      encodedBurnMethod = optimistContract.methods
        .burn('0x77194aa25a06f932c10c0f25090f3046af2c85a6')
        .encodeABI()
    })

    describe('should return a bigint by default', () => {
      test('getL1Fee', async () => {
        expect(
          typeof (await web3.op.getL1Fee({
            chainId: '0xa',
            data: encodedBurnMethod,
            type: '0x2',
          }))
        ).toBe('bigint')
      })

      test('getL1GasUsed should return 1884n', async () =>
        expect(
          await web3.op.getL1GasUsed({
            chainId: '0xa',
            data: encodedBurnMethod,
            type: '0x2',
          })
        ).toBe(BigInt(1884)))

      test('estimateFees', async () =>
        expect(
          typeof (await web3.op.estimateFees({
            chainId: 10,
            data: encodedBurnMethod,
            type: 2,
            to: optimistAddress[10],
            from: '0x77194aa25a06f932c10c0f25090f3046af2c85a6',
          }))
        ).toBe('bigint'))

      test('getL2Fee', async () => {
        expect(
          typeof (await web3.op.getL2Fee({
            chainId: '0xa',
            data: encodedBurnMethod,
            type: '0x2',
            to: optimistAddress[10],
            from: '0x77194aa25a06f932c10c0f25090f3046af2c85a6',
          }))
        ).toBe('bigint')
      })

      test('estimateFees', async () =>
        expect(
          typeof (await web3.op.estimateFees(
            {
              chainId: 10,
              data: encodedBurnMethod,
              type: 2,
              to: optimistAddress[10],
              from: '0x77194aa25a06f932c10c0f25090f3046af2c85a6',
            },
            { blockNumber: 107028270 }
          ))
        ).toBe('bigint'))
    })

    describe('should return a hexString', () => {
      const hexStringFormat = { number: FMT_NUMBER.HEX, bytes: FMT_BYTES.HEX }

      test('getL1Fee', async () => {
        expect(
          typeof (await web3.op.getL1Fee(
            {
              chainId: '0xa',
              data: encodedBurnMethod,
              type: '0x2',
            },
            hexStringFormat
          ))
        ).toBe('string')
      })

      test('getL1GasUsed should return 0x75c', async () =>
        expect(
          await web3.op.getL1GasUsed(
            {
              chainId: '0xa',
              data: encodedBurnMethod,
              type: '0x2',
            },
            hexStringFormat
          )
        ).toBe('0x75c'))

      test('estimateFees', async () =>
        expect(
          typeof (await web3.op.estimateFees(
            {
              chainId: 10,
              data: encodedBurnMethod,
              type: 2,
              to: optimistAddress[10],
              from: '0x77194aa25a06f932c10c0f25090f3046af2c85a6',
            },
            { returnFormat: hexStringFormat }
          ))
        ).toBe('string'))
    })
  })

  describe('Contract transaction gas estimates - l2StandardBridgeABI.withdraw', () => {
    let l2BridgeContract: Contract<typeof l2StandardBridgeABI>
    let encodedWithdrawMethod: string

    beforeAll(() => {
      l2BridgeContract = new Contract(
        l2StandardBridgeABI,
        l2StandardBridgeAddress[420]
      )
      encodedWithdrawMethod = l2BridgeContract.methods
        .withdraw(
          // l2 token address
          '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
          // amount
          Web3.utils.toWei('0.00000001', 'ether'),
          // l1 gas
          0,
          // extra data
          '0x00'
        )
        .encodeABI()
    })

    describe('should return a bigint by default', () => {
      test('getL1Fee', async () => {
        expect(
          typeof (await web3.op.getL1Fee({
            chainId: '0xa',
            data: encodedWithdrawMethod,
            type: '0x2',
          }))
        ).toBe('bigint')
      })

      test('getL1GasUsed should return 2592n', async () =>
        expect(
          await web3.op.getL1GasUsed({
            chainId: '0xa',
            data: encodedWithdrawMethod,
            type: '0x2',
          })
        ).toBe(BigInt(2592)))

      test('estimateFees', async () =>
        expect(
          typeof (await web3.op.estimateFees({
            chainId: 10,
            data: encodedWithdrawMethod,
            value: Web3.utils.toWei('0.00000001', 'ether'),
            type: 2,
            to: l2StandardBridgeAddress[420],
            from: '0x6387a88a199120aD52Dd9742C7430847d3cB2CD4',
            maxFeePerGas: Web3.utils.toWei('0.2', 'gwei'),
            maxPriorityFeePerGas: Web3.utils.toWei('0.1', 'gwei'),
          }))
        ).toBe('bigint'))
    })
  })
})
