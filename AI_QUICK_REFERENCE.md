# 🎨 AI Assistant Quick Reference

## 💬 Smart Prompts for Better Results

### 🪙 **Token Generation**

**Basic ERC20:**
```
"Create an ERC20 token named 'MyToken' with symbol 'MTK' and 1 million supply"
```

**Advanced Token:**
```
"Build a deflationary ERC20 token named 'BurnToken' (symbol BTK) with:
- 10 million initial supply
- 2% burn on every transfer
- Minting disabled after deployment
- Pausability for emergencies"
```

**Governance Token:**
```
"Create a governance token with vote delegation and snapshot capabilities"
```

---

### 🖼️ **NFT Generation**

**Simple NFT:**
```
"Create an ERC721 NFT collection with max supply of 10,000"
```

**Advanced NFT:**
```
"Build an NFT collection with:
- Max supply: 5000
- Whitelist minting (300 max per wallet)
- Public minting (5 max per wallet)
- Reveal mechanism (initially all show placeholder)
- Metadata stored on IPFS"
```

**Gaming NFT:**
```
"Create a game asset NFT where each token has on-chain stats (strength, speed, rarity)"
```

---

### 💰 **DeFi Contracts**

**Staking:**
```
"Build a staking contract where users:
- Stake TOKEN_A to earn TOKEN_B
- Earn 10% APY
- Can withdraw anytime
- Rewards calculated per second"
```

**Liquidity Pool:**
```
"Create an AMM liquidity pool for TOKEN_A/TOKEN_B with:
- 0.3% swap fee
- LP tokens for providers
- Price oracle using time-weighted average"
```

**Lending:**
```
"Build a lending protocol where users can deposit collateral and borrow up to 75% LTV"
```

---

### 🏛️ **DAO & Governance**

**Simple DAO:**
```
"Create a DAO where token holders can:
- Create proposals (requires 1000 tokens)
- Vote (1 token = 1 vote)
- Execute after 3 days if >50% approval"
```

**Advanced DAO:**
```
"Build a multi-sig DAO with:
- 5 council members
- 3/5 signatures required
- Time-locked execution (2 days)
- Emergency stop function"
```

---

### 🎮 **Gaming Contracts**

**Game Currency:**
```
"Create an in-game currency where players earn tokens by winning battles"
```

**Item Marketplace:**
```
"Build a game item marketplace where players can list, buy, and sell NFT items with a 5% platform fee"
```

---

## 🛠️ **Action Commands**

### Generate Contract
```javascript
{
  "action": "generate",
  "prompt": "Your detailed description here",
  "userAddress": "0x..."
}
```

### Compile Code
```javascript
{
  "action": "compile",
  "code": "pragma solidity ^0.8.24; ...",
  "userAddress": "0x..."
}
```

### Audit Security
```javascript
{
  "action": "audit",
  "code": "Your contract code",
  "userAddress": "0x..."
}
// ⚠️ Requires payment
```

### Optimize Gas
```javascript
{
  "action": "optimize",
  "code": "Your contract code",
  "userAddress": "0x..."
}
```

### Fix Errors
```javascript
{
  "action": "fix",
  "code": "Broken contract code",
  "errors": [{ "message": "Error description" }],
  "userAddress": "0x..."
}
```

### Deploy Contract
```javascript
{
  "action": "deploy",
  "code": "Compiled contract code",
  "network": "testnet", // or "mainnet"
  "userAddress": "0x..."
}
// ⚠️ Requires payment
```

---

## ✨ **Pro Tips**

### 1. Be Specific
❌ "Make a token"
✅ "Create an ERC20 token named 'GameCoin' with symbol 'GAME' and 5 million initial supply"

### 2. Include Details
Always specify:
- Token name and symbol
- Initial supply amounts
- Access control (who can mint, pause, etc.)
- Special features (burning, staking, etc.)

### 3. Use Natural Language
The AI understands:
- "Users can stake tokens and earn rewards"
- "Only the owner can mint new tokens"
- "Implement a 2% fee on transfers"
- "Add emergency pause functionality"

### 4. Complex Features
Break down complex requests:
```
"Create a staking contract with:
- Stake/unstake anytime
- Rewards calculated per block
- Penalty for early withdrawal (before 7 days)
- Owner can adjust APY rate"
```

### 5. Test First
Always deploy to testnet first:
```javascript
network: "testnet" // Somnia Testnet
```

---

## 🚫 **Common Mistakes**

### ❌ DON'T:
```
"Make a token" // Too vague
"Create a contract" // No details
"Build something like Uniswap" // Too complex
```

### ✅ DO:
```
"Create an ERC20 token named 'Test' with 1M supply"
"Build a simple staking contract with fixed 10% APY"
"Create a basic token swap with 0.3% fee"
```

---

## 🔧 **Troubleshooting**

### Contract Won't Compile?
1. Click "Fix Errors" button
2. Or use action: "fix"
3. Review the error messages carefully

### Generated Contract is Wrong?
1. Rephrase your prompt with more details
2. Try breaking it into simpler parts
3. Specify exact features you need

### Deployment Failed?
1. Check your wallet has enough STT
2. Verify you're on the right network
3. Ensure contract size < 24KB

---

## 📝 **Example Workflows**

### Workflow 1: Simple Token
1. Prompt: "Create ERC20 token 'MyToken' (MTK) with 1M supply"
2. AI generates code
3. Click "Compile"
4. Review output
5. Click "Deploy to Testnet"
6. Confirm transaction

### Workflow 2: Complex Contract
1. Prompt: "Create staking contract..."
2. AI generates code
3. Click "Audit" to check security
4. Review audit report
5. Click "Optimize" for gas savings
6. Compile optimized version
7. Deploy to testnet
8. Test thoroughly
9. Deploy to mainnet

### Workflow 3: Fix Broken Code
1. Write or paste broken contract
2. Click "Compile" (shows errors)
3. Click "Fix Errors"
4. AI repairs the code
5. Compile again
6. Deploy when ready

---

## 🎯 **Best Practices**

### Security
- ✅ Always audit before mainnet deployment
- ✅ Test all functions on testnet
- ✅ Use OpenZeppelin contracts
- ✅ Implement access control
- ✅ Add emergency pause if handling funds

### Gas Optimization
- ✅ Use "Optimize" action before deployment
- ✅ Review gas estimates
- ✅ Consider external vs public functions
- ✅ Minimize storage writes

### Development
- ✅ Start simple, add complexity gradually
- ✅ Test each feature independently
- ✅ Keep contracts under 24KB
- ✅ Document all functions
- ✅ Version your contracts

---

## 💡 **Feature Ideas**

Want to build something unique? Try these:

- **NFT Raffle System** - "Create an NFT raffle where users buy tickets with tokens"
- **Vesting Contract** - "Build a token vesting schedule with cliff period"
- **Dutch Auction** - "Create a dutch auction for NFT sales with declining prices"
- **Reputation System** - "Build an on-chain reputation contract with upvote/downvote"
- **Escrow Service** - "Create a payment escrow with dispute resolution"
- **Time-locked Wallet** - "Build a wallet that unlocks tokens over time"

---

## 📚 **Learn More**

- [Full AI Assistant Guide](./AI_ASSISTANT_GUIDE.md)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Somnia Network Docs](https://somnia.network/)

---

**🚀 Ready to build? Start with a simple prompt and let the AI guide you!**
