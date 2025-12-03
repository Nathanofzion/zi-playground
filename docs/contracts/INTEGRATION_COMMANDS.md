# Game Reward Contract - Integration Commands

## Contract Information

```bash
# Contract ID (Use this in your application)
CONTRACT_ID="CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY"

# Token Contract ID (ZITOKEN SAC)
TOKEN_ID="CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC"

# Admin Account
ADMIN="GBNNJVN6SBUXH6UXPHFUPWSVSEYQBCAQL4BSXDCEVB3WXIX2NM4HMARP"

# Network
NETWORK="testnet"
```

---

## 1. Initialize Contract (One-time Setup)

**Note:** Only run this once when deploying a new contract.

```bash
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- initialize \
  --admin GBNNJVN6SBUXH6UXPHFUPWSVSEYQBCAQL4BSXDCEVB3WXIX2NM4HMARP \
  --token_id CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC
```

---

## 2. Add Game Type

**Purpose:** Configure a new game with its reward amount.

**Parameters:**
- `game_id` - Unique identifier for the game (u32)
- `reward_amount` - Reward in stroops (i128) - 1 ZITOKEN = 10,000,000 stroops

**Example: Add Game with 5 ZITOKEN reward**

```bash
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- add_game_type \
  --game_id 1 \
  --reward_amount 50000000
```

**Common Reward Amounts:**
```bash
# 1 ZITOKEN = 10000000 stroops
# 5 ZITOKEN = 50000000 stroops
# 10 ZITOKEN = 100000000 stroops
# 100 ZITOKEN = 1000000000 stroops
```

---

## 3. Distribute Reward

**Purpose:** Send rewards to a player who completed a game.

**Parameters:**
- `to` - Player's Stellar address
- `game_id` - Game ID they completed

**Example:**

```bash
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- distribute_reward \
  --to GBIYFHAKNJMQF3ZKVQZXW5BEBAOWPTAS4JC57UH5JTVGO5OEA3ZDUNQG \
  --game_id 1
```

**Important:** The player must have a trustline to ZITOKEN before receiving rewards.

---

## 4. Withdraw Tokens (Admin Only)

**Purpose:** Recover tokens from the contract (emergency or planned withdrawals).

**Parameters:**
- `to` - Destination address
- `amount` - Amount in stroops (i128)

**Example: Withdraw 10,000 ZITOKEN**

```bash
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- withdraw \
  --to GBNNJVN6SBUXH6UXPHFUPWSVSEYQBCAQL4BSXDCEVB3WXIX2NM4HMARP \
  --amount 100000000000
```

**Use Cases:**
- Recover accidentally sent tokens
- Emergency fund recovery
- Contract migration
- Planned withdrawals

---

## 5. Upgrade Contract (Admin Only)

**Purpose:** Upgrade contract to a new version while keeping the same address.

**Step 1: Build and Upload New WASM**

```bash
# Build the contract
stellar contract build

# Upload new WASM to network
stellar contract upload \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source ziplayground \
  --network testnet
```

This will return a WASM hash like: `93133a49e693537ce358e1ed57f19c837f39f85dd7f40185d7ab639faa1e041b`

**Step 2: Upgrade the Contract**

```bash
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- upgrade \
  --new_wasm_hash 93133a49e693537ce358e1ed57f19c837f39f85dd7f40185d7ab639faa1e041b
```

**Important:** Contract address stays the same after upgrade!

---

## 6. Fund Contract with Tokens

**Purpose:** Transfer ZITOKEN to the contract for reward distribution.

```bash
stellar contract invoke \
  --id CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC \
  --source ZITOKEN_MASTER_KEY \
  --network testnet \
  -- transfer \
  --from GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC \
  --to CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --amount 1000000000000
```

**Example Amounts:**
```bash
# 100 ZITOKEN = 1000000000 stroops
# 1,000 ZITOKEN = 10000000000 stroops
# 10,000 ZITOKEN = 100000000000 stroops
# 100,000 ZITOKEN = 1000000000000 stroops
```

---

## 7. Create Player Trustline (Required Before First Reward)

**Purpose:** Allow a player to receive ZITOKEN.

**Step 1: Player creates trustline**

```bash
stellar tx new change-trust \
  --source-account <PLAYER_IDENTITY> \
  --line ZITOKEN:GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC \
  --network testnet
```

**Example:**

```bash
stellar tx new change-trust \
  --source-account player1 \
  --line ZITOKEN:GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC \
  --network testnet
```

---

## Integration Examples

### Example 1: Complete Flow for New Player

```bash
# 1. Player creates account (if needed)
stellar keys generate player2 --network testnet
stellar keys fund player2 --network testnet

# 2. Player creates trustline for ZITOKEN
stellar tx new change-trust \
  --source-account player2 \
  --line ZITOKEN:GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC \
  --network testnet

# 3. Get player's address
stellar keys address player2

# 4. Player completes game, admin distributes reward
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- distribute_reward \
  --to <PLAYER2_ADDRESS> \
  --game_id 1
```

### Example 2: Add Multiple Games

```bash
# Game 1: Easy - 5 ZITOKEN
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- add_game_type \
  --game_id 1 \
  --reward_amount 50000000

# Game 2: Medium - 10 ZITOKEN
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- add_game_type \
  --game_id 2 \
  --reward_amount 100000000

# Game 3: Hard - 20 ZITOKEN
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- add_game_type \
  --game_id 3 \
  --reward_amount 200000000
```

### Example 3: Batch Reward Distribution

```bash
# Distribute to multiple players
stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- distribute_reward \
  --to GBIYFHAKNJMQF3ZKVQZXW5BEBAOWPTAS4JC57UH5JTVGO5OEA3ZDUNQG \
  --game_id 1

stellar contract invoke \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --source ziplayground \
  --network testnet \
  -- distribute_reward \
  --to GBNNJVN6SBUXH6UXPHFUPWSVSEYQBCAQL4BSXDCEVB3WXIX2NM4HMARP \
  --game_id 2
```

---

## Query Commands (Read-Only)

### Check Contract Interface

```bash
stellar contract info interface \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --network testnet
```

### Check Contract WASM Hash

```bash
stellar contract info wasm-hash \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY \
  --network testnet
```

### Check Token Balance

```bash
stellar contract invoke \
  --id CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC \
  --source ziplayground \
  --network testnet \
  -- balance \
  --id CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY
```

---

## SDK Integration (JavaScript/TypeScript)

### Install Dependencies

```bash
npm install @stellar/stellar-sdk
```

### Example: Distribute Reward via SDK

```javascript
import * as StellarSdk from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Initialize contract client
const contract = new StellarSdk.Contract(CONTRACT_ID);

// Build distribute_reward transaction
async function distributeReward(playerAddress, gameId) {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  
  // Load admin account
  const adminKeypair = StellarSdk.Keypair.fromSecret('YOUR_ADMIN_SECRET_KEY');
  const adminAccount = await server.getAccount(adminKeypair.publicKey());
  
  // Build transaction
  const transaction = new StellarSdk.TransactionBuilder(adminAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'distribute_reward',
        StellarSdk.Address.fromString(playerAddress).toScVal(),
        StellarSdk.nativeToScVal(gameId, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();
  
  // Simulate
  const simulatedTx = await server.simulateTransaction(transaction);
  
  // Prepare and sign
  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(
    transaction,
    simulatedTx
  ).build();
  
  preparedTx.sign(adminKeypair);
  
  // Submit
  const result = await server.sendTransaction(preparedTx);
  console.log('Transaction submitted:', result.hash);
  
  return result;
}

// Usage
distributeReward('GBIYFHAKNJMQF3ZKVQZXW5BEBAOWPTAS4JC57UH5JTVGO5OEA3ZDUNQG', 1);
```

### Example: Add Game Type via SDK

```javascript
async function addGameType(gameId, rewardAmount) {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  
  const adminKeypair = StellarSdk.Keypair.fromSecret('YOUR_ADMIN_SECRET_KEY');
  const adminAccount = await server.getAccount(adminKeypair.publicKey());
  
  const transaction = new StellarSdk.TransactionBuilder(adminAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'add_game_type',
        StellarSdk.nativeToScVal(gameId, { type: 'u32' }),
        StellarSdk.nativeToScVal(rewardAmount, { type: 'i128' })
      )
    )
    .setTimeout(30)
    .build();
  
  const simulatedTx = await server.simulateTransaction(transaction);
  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(
    transaction,
    simulatedTx
  ).build();
  
  preparedTx.sign(adminKeypair);
  
  const result = await server.sendTransaction(preparedTx);
  console.log('Game type added:', result.hash);
  
  return result;
}

// Usage: Add game with 5 ZITOKEN reward
addGameType(1, 50000000);
```

---

## Python Integration

### Install Dependencies

```bash
pip install stellar-sdk
```

### Example: Distribute Reward via Python

```python
from stellar_sdk import SorobanServer, Keypair, Network, TransactionBuilder, scval
from stellar_sdk.soroban_rpc import GetTransactionStatus

CONTRACT_ID = 'CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY'
RPC_URL = 'https://soroban-testnet.stellar.org'

def distribute_reward(player_address: str, game_id: int):
    # Initialize server and admin keypair
    server = SorobanServer(RPC_URL)
    admin_keypair = Keypair.from_secret('YOUR_ADMIN_SECRET_KEY')
    
    # Load admin account
    admin_account = server.load_account(admin_keypair.public_key)
    
    # Build transaction
    tx = (
        TransactionBuilder(
            source_account=admin_account,
            network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
            base_fee=100
        )
        .append_invoke_contract_function_op(
            contract_id=CONTRACT_ID,
            function_name='distribute_reward',
            parameters=[
                scval.to_address(player_address),
                scval.to_uint32(game_id)
            ]
        )
        .set_timeout(30)
        .build()
    )
    
    # Simulate
    simulated = server.simulate_transaction(tx)
    
    # Prepare and sign
    prepared_tx = server.prepare_transaction(tx, simulated)
    prepared_tx.sign(admin_keypair)
    
    # Submit
    result = server.send_transaction(prepared_tx)
    print(f"Transaction submitted: {result.hash}")
    
    return result

# Usage
distribute_reward('GBIYFHAKNJMQF3ZKVQZXW5BEBAOWPTAS4JC57UH5JTVGO5OEA3ZDUNQG', 1)
```

---

## Error Handling

### Common Errors

**Error: `AlreadyInitialized` (Error #1)**
- Contract has already been initialized
- Solution: Don't call initialize again

**Error: `NotAdmin` (Error #2)**
- Caller is not the admin
- Solution: Use the admin account to sign the transaction

**Error: `GameNotFound` (Error #3)**
- Game ID doesn't exist
- Solution: Add the game type first using `add_game_type`

**Error: `resulting balance is not within the allowed range`**
- Insufficient tokens in contract or sender account
- Solution: Fund the contract or check sender balance

**Error: `unrecognized subcommand`**
- Function name is incorrect
- Solution: Check function name spelling (use `info interface` to see available functions)

---

## Best Practices

### 1. Security
- ✅ Keep admin private key secure
- ✅ Use environment variables for sensitive data
- ✅ Test on testnet before mainnet
- ✅ Verify transaction hashes

### 2. Token Management
- ✅ Monitor contract balance regularly
- ✅ Fund contract before distributing rewards
- ✅ Use withdraw function for emergency recovery

### 3. Player Management
- ✅ Ensure players have trustlines before rewards
- ✅ Validate player addresses before distribution
- ✅ Handle errors gracefully

### 4. Testing
- ✅ Test all functions on testnet first
- ✅ Verify transaction results
- ✅ Monitor gas costs
- ✅ Test upgrade process before production

---

## Environment Variables (Recommended)

```bash
# .env file
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
CONTRACT_ID=CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY
TOKEN_ID=CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC
ADMIN_SECRET=YOUR_ADMIN_SECRET_KEY
TOKEN_ISSUER=GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC
```

---

## Quick Reference

| Function | Admin Required | Parameters | Purpose |
|----------|---------------|------------|---------|
| `initialize` | Yes | admin, token_id | Initialize contract (one-time) |
| `add_game_type` | Yes | game_id, reward_amount | Add new game type |
| `distribute_reward` | Yes | to, game_id | Send reward to player |
| `withdraw` | Yes | to, amount | Withdraw tokens from contract |
| `upgrade` | Yes | new_wasm_hash | Upgrade contract WASM |

---

## Support & Resources

- **Contract Explorer:** https://stellar.expert/explorer/testnet/contract/CCRZKHWOGLVOPNUC43I4PRSD3IG3G5BJH3TFCEUGGB2UYNVGUBOHEUKY
- **Stellar Docs:** https://developers.stellar.org/docs/smart-contracts
- **Soroban RPC:** https://soroban-testnet.stellar.org
- **Network Passphrase:** `Test SDF Network ; September 2015`

---

**Last Updated:** 2025-12-03  
**Contract Version:** V2 (with upgrade & withdraw)  
**Network:** Stellar Testnet
