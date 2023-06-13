import ethers from 'ethers'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { CrossChainMessenger } from '../src'
import { l1Provider, l2Provider } from './testUtils/ethersProviders'

/**
 * This test repros the bug where legacy withdrawals are not provable
 */
/*******
Cast results from runnning cast tx and cast receipt on the l2 tx hash

cast tx 0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81 --rpc-url https://goerli.optimism.io

blockHash            0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0
blockNumber          2337599
from                 0x1d86C2F5cc7fBEc35FEDbd3293b5004A841EA3F0
gas                  118190
gasPrice             1
hash                 0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81
input                0x32b7006d000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead000000000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000
nonce                10
r                    0x7e58c5dbb37f57303d936562d89a75a20be2a45f54c5d44dc73119453adf2e08
s                    0x1bc952bd048dd38668a0c3b4bac202945c5a150465b551dd2a768e54a746e2c4
to                   0x4200000000000000000000000000000000000010
transactionIndex     0
v                    875
value                0
index                2337598
l1BlockNumber        7850866
l1Timestamp          1666982083
queueOrigin          sequencer
rawTransaction       0xf901070a018301cdae94420000000000000000000000000000000000001080b8a432b7006d000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead000000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000082036ba07e58c5dbb37f57303d936562d89a75a20be2a45f54c5d44dc73119453adf2e08a01bc952bd048dd38668a0c3b4bac202945c5a150465b551dd2a768e54a746e2c4

cast tx 0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81 --rpc-url https://goerli.optimism.io

blockHash               0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0
blockNumber             2337599
contractAddress
cumulativeGasUsed       115390
effectiveGasPrice
gasUsed                 115390
logs                    [{"address":"0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x0000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f0","0x0000000000000000000000000000000000000000000000000000000000000000"],"data":"0x00000000000000000000000000000000000000000000000000005af3107a4000","blockHash":"0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0","blockNumber":"0x23ab3f","transactionHash":"0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81","transactionIndex":"0x0","logIndex":"0x0","removed":false},{"address":"0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000","topics":["0xcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5","0x0000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f0"],"data":"0x00000000000000000000000000000000000000000000000000005af3107a4000","blockHash":"0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0","blockNumber":"0x23ab3f","transactionHash":"0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81","transactionIndex":"0x0","logIndex":"0x1","removed":false},{"address":"0x4200000000000000000000000000000000000007","topics":["0xcb0f7ffd78f9aee47a248fae8db181db6eee833039123e026dcbff529522e52a","0x000000000000000000000000636af16bf2f682dd3109e60102b8e1a089fedaa8"],"data":"0x00000000000000000000000042000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000001a048000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a41532ec340000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f00000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f000000000000000000000000000000000000000000000000000005af3107a40000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","blockHash":"0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0","blockNumber":"0x23ab3f","transactionHash":"0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81","transactionIndex":"0x0","logIndex":"0x2","removed":false},{"address":"0x4200000000000000000000000000000000000010","topics":["0x73d170910aba9e6d50b102db522b1dbcd796216f5128b445aa2135272886497e","0x0000000000000000000000000000000000000000000000000000000000000000","0x000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead0000","0x0000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f0"],"data":"0x0000000000000000000000001d86c2f5cc7fbec35fedbd3293b5004a841ea3f000000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000","blockHash":"0x67956cee3de38d49206d34b77f560c4c371d77b36584047ade8bf7b67bf210c0","blockNumber":"0x23ab3f","transactionHash":"0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81","transactionIndex":"0x0","logIndex":"0x3","removed":false}]
logsBloom               0x00000000000000000010000000000000000000000000001000100000001000000000000000000080000000000000008000000800000000000000000000000240000000002000400040000008000000000000000000000000000000000000000100000000020000000000000000000800080000000040000000000010000000000000000000000000000000000000000000800000000000000020000000200000000000000000000001000000000000000000200000000000000000000000000000000002000000200000000400000000000002100000000000000000000020001000000000000000000000000000000000000000000000000000010000008000
root
status                  1
transactionHash         0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81
transactionIndex        0
type
 */

const E2E_PRIVATE_KEY = z
  .string()
  .describe('Private key')
  .parse(import.meta.env.VITE_E2E_PRIVATE_KEY)

const l1Wallet = new ethers.Wallet(E2E_PRIVATE_KEY, l1Provider)
const crossChainMessenger = new CrossChainMessenger({
  l1SignerOrProvider: l1Wallet,
  l2SignerOrProvider: l2Provider,
  l1ChainId: 5,
  l2ChainId: 420,
  bedrock: true,
})

// testing ci
describe('prove message', () => {
  it(`should prove a legacy tx
  `, async () => {
    /**
     * Tx hash of legacy withdrawal
     *
     * @see https://goerli-optimism.etherscan.io/tx/0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81
     */
    const txWithdrawalHash =
      '0xd66fda632b51a8b25a9d260d70da8be57b9930c4616370861526335c3e8eef81'

    const txReceipt = await l2Provider.getTransactionReceipt(txWithdrawalHash)

    expect(txReceipt).toBeDefined()

    const tx = await crossChainMessenger.proveMessage(txWithdrawalHash)
    const receipt = await tx.wait()

    // A 1 means the transaction was successful
    expect(receipt.status).toBe(1)
  }, 20_000)
})
