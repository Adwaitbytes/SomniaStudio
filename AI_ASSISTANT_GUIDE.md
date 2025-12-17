# 🤖 SomniaStudio AI Assistant - Complete Guide

## Overview

SomniaStudio's AI Assistant is a **Senior Smart Contract Architect** that generates 100% production-ready, deployable Solidity contracts directly from natural language instructions.

---

## 🎯 Core Capabilities

### 1. **Contract Generation** (`action: "generate"`)
Generates complete, deployable smart contracts from user descriptions.

**Features:**
- ✅ 100% compilable code (auto-validated)
- ✅ OpenZeppelin best practices
- ✅ Security-first approach
- ✅ Gas-optimized patterns
- ✅ Comprehensive documentation
- ✅ No constructor parameters (deployment-ready)

**Example Prompts:**
```
"Create an ERC20 token named 'GameCoin' with symbol 'GAME' and 1 million initial supply"
"Build a staking contract where users earn 10% APY on locked tokens"
"Make an NFT marketplace with royalty support and listing fees"
"Create a DAO with proposal voting and time-locked execution"
```

**Response:**
```json
{
  "success": true,
  "code": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n...",
  "autoFixed": true,
  "warnings": [] // optional compilation warnings
}
```

---

### 2. **Security Audit** (`action: "audit"`)
Comprehensive security analysis of any smart contract.

**Audit Coverage:**
- 🔴 Critical vulnerabilities (reentrancy, access control, overflow)
- 🟠 High severity issues
- 🟡 Medium severity issues  
- 🟢 Low severity / informational
- ⛽ Gas optimization opportunities
- 🎯 Security score (X/10)
- ✅ Production readiness checklist

**Example Request:**
```javascript
POST /api/agent
{
  "action": "audit",
  "code": "pragma solidity ^0.8.24; contract MyToken { ... }",
  "userAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "report": "## 🔴 CRITICAL ISSUES\n- Reentrancy vulnerability in withdraw()..."
}
```

---

### 3. **Gas Optimization** (`action: "optimize"`)
Automatically optimizes contracts for gas efficiency while maintaining functionality.

**Optimizations Applied:**
- Storage packing
- `external` vs `public` visibility
- Loop optimizations
- Cached array lengths
- Immutable/constant variables
- Custom errors (vs string errors)
- Batch operations

**Example Request:**
```javascript
POST /api/agent
{
  "action": "optimize",
  "code": "contract GenContract { ... }",
  "userAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "code": "// Optimized contract code...",
  "message": "Contract optimized for gas efficiency and security"
}
```

---

### 4. **Auto-Fix Errors** (`action: "fix"`)
Automatically repairs broken contracts with compilation errors.

**Fixes Applied:**
- Missing imports
- Syntax errors
- Type mismatches
- Undeclared identifiers
- Visibility issues
- Pragma version problems
- Constructor issues

**Example Request:**
```javascript
POST /api/agent
{
  "action": "fix",
  "code": "contract broken code...",
  "errors": [
    { "message": "ParserError: Expected ';' but got 'function'" }
  ],
  "userAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "code": "// Fixed contract code...",
  "message": "All errors fixed! Contract now compiles successfully."
}
```

---

### 5. **Error Explanation** (`action: "explain_error"`)
Educational AI that explains compilation errors and teaches how to fix them.

**Response Format:**
```json
{
  "success": true,
  "explanation": "This error occurs because...",
  "fix": "// Corrected code snippet",
  "teachMode": {
    "title": "Understanding Solidity Inheritance",
    "steps": [
      "Step 1: Parent constructors must be called explicitly",
      "Step 2: Use constructor() ERC20(...) Ownable(...)",
      "Step 3: Order matters for multiple inheritance"
    ]
  }
}
```

---

### 6. **Smart Research** (`action: "research"`)
Blockchain and Web3 knowledge base for technical questions.

**Example Prompts:**
```
"What is EIP-2612 and how do I implement it?"
"Explain the difference between call, delegatecall, and staticcall"
"What are the best practices for upgradeable contracts?"
```

---

## 🛡️ Auto-Fix & Validation Engine

Every generated contract goes through **9 automatic validation steps**:

1. **Markdown Cleanup** - Removes code block artifacts
2. **SPDX Formatting** - Ensures proper comment syntax
3. **Line Break Normalization** - Fixes stuck tokens
4. **Contract Name Enforcement** - Always 'GenContract'
5. **Pragma Version Check** - Ensures ^0.8.24
6. **Receive Function Injection** - Adds if missing
7. **Import Path Correction** - Fixes OpenZeppelin imports
8. **NatSpec Documentation** - Adds if completely missing
9. **Compilation Verification** - Tests before returning

---

## 🎓 Smart Contract Generation Prompts

### **Token Contracts**
```
✅ "Create an ERC20 token named 'UtilityToken' with 10M supply and burn function"
✅ "Build a deflationary token that burns 2% on every transfer"
✅ "Make a governance token with vote delegation and snapshot support"
```

### **NFT Contracts**
```
✅ "Create an ERC721 NFT collection with 10k max supply and whitelist minting"
✅ "Build a generative art NFT with on-chain metadata and reveal mechanism"
✅ "Make an upgradeable NFT with staking rewards for holders"
```

### **DeFi Contracts**
```
✅ "Create a liquidity mining contract with time-based rewards"
✅ "Build an AMM swap with 0.3% fee and liquidity provider tokens"
✅ "Make a lending protocol with collateralization and liquidation"
```

### **DAO Contracts**
```
✅ "Create a DAO with token-weighted voting and 3-day timelock"
✅ "Build a multi-sig treasury with proposal execution"
✅ "Make a quadratic voting DAO with Sybil resistance"
```

### **Gaming Contracts**
```
✅ "Create a play-to-earn game with in-game currency and item trading"
✅ "Build a battle pass NFT with progressive unlock stages"
✅ "Make a tournament contract with prize pools and leaderboards"
```

---

## 🔧 Integration Example (Frontend)

```typescript
// Generate a new contract
const generateContract = async (userPrompt: string) => {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payment': paymentSignature // If required by Q402
    },
    body: JSON.stringify({
      action: 'generate',
      prompt: userPrompt,
      userAddress: walletAddress
    })
  });

  const { success, code, warnings } = await response.json();
  
  if (success) {
    setEditorCode(code); // Display in Monaco Editor
    if (warnings?.length > 0) {
      showWarnings(warnings); // Show non-critical issues
    }
  }
};

// Compile the contract
const compileContract = async (sourceCode: string) => {
  const response = await fetch('/api/agent', {
    method: 'POST',
    body: JSON.stringify({
      action: 'compile',
      code: sourceCode,
      userAddress: walletAddress
    })
  });

  const { success, abi, bytecode, errors } = await response.json();
  
  if (success) {
    setCompiledData({ abi, bytecode });
  } else {
    // Auto-fix errors
    const fixResponse = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({
        action: 'fix',
        code: sourceCode,
        errors: errors,
        userAddress: walletAddress
      })
    });
    
    const { code: fixedCode } = await fixResponse.json();
    setEditorCode(fixedCode);
  }
};

// Deploy the contract
const deployContract = async () => {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'x-payment': paymentSignature },
    body: JSON.stringify({
      action: 'deploy',
      code: compiledCode,
      userAddress: walletAddress,
      network: 'testnet' // or 'mainnet'
    })
  });

  const { success, address, txHash } = await response.json();
  
  if (success) {
    console.log(`Contract deployed at: ${address}`);
    console.log(`Transaction: ${txHash}`);
  }
};
```

---

## 💰 Payment Integration (Q402)

The AI agent uses **Q402 EIP-7702 delegated payments** for premium features:

### **Free Actions:**
- ✅ `generate` - Contract generation
- ✅ `compile` - Code compilation
- ✅ `research` - Technical questions
- ✅ `explain_error` - Error explanations

### **Paid Actions (0.0001 STT):**
- 💰 `audit` - Security audits
- 💰 `deploy` - Contract deployment

### **Payment Flow:**
1. User triggers paid action
2. Server returns 402 with payment details
3. Frontend signs EIP-712 witness
4. Retry request with `x-payment` header
5. Server verifies and executes

---

## 🚀 Best Practices

### **For Users:**
1. **Be specific** - "ERC20 token with 1M supply" > "make a token"
2. **Include details** - Token names, symbols, supply amounts
3. **Specify features** - "with pausability" "with burning" "with staking"
4. **Test on testnet** - Always deploy to testnet first
5. **Review code** - AI is smart, but you're responsible

### **For Developers:**
1. **Always validate** - Check compilation before deployment
2. **Use error handling** - Handle AI failures gracefully
3. **Implement retries** - AI APIs can be flaky
4. **Cache results** - Save generated contracts
5. **Monitor usage** - Track AI API costs

---

## 🔍 Troubleshooting

### **"Contract won't compile"**
→ Use `action: "fix"` to auto-repair

### **"Generated contract is wrong"**
→ Be more specific in prompt, include exact requirements

### **"Deployment failed"**
→ Check network, gas limits, and wallet balance

### **"AI response is slow"**
→ Normal - complex contracts take 10-30 seconds

### **"Payment required error"**
→ Sign the EIP-712 witness and retry with header

---

## 📊 AI Model Configuration

**Primary Model:** Groq (Llama 3.3 70B)
- ✅ Fast inference (~5-10 seconds)
- ✅ High code quality
- ✅ Cost-effective

**Fallback Model:** ChainGPT
- ✅ Blockchain-specialized
- ✅ Training on Web3 codebases
- ✅ Reliable alternative

**Auto-Switching Logic:**
```typescript
if (GROQ_API_KEY) {
  try { result = await callGroqAPI(...) }
  catch { fallback to ChainGPT }
} else if (CHAINGPT_API_KEY) {
  result = await callChainGPTAPI(...)
}
```

---

## 🎯 Success Metrics

Track these KPIs for AI performance:

- **Compilation Success Rate** - % of generated contracts that compile
- **Deployment Success Rate** - % of contracts deployed without issues
- **User Satisfaction** - Thumbs up/down on generated code
- **Error Fix Rate** - % of auto-fixed contracts that work
- **Average Generation Time** - Latency metrics

---

## 🔮 Future Enhancements

**Planned Features:**
- [ ] Multi-file contract generation (interfaces, libraries)
- [ ] Interactive contract builder (step-by-step)
- [ ] Test case generation (Hardhat tests)
- [ ] Gas simulation before deployment
- [ ] Contract verification on block explorers
- [ ] AI-powered debugging (runtime errors)
- [ ] Code diff viewer (before/after optimization)
- [ ] Template customization learning

---

## 📚 Resources

- **OpenZeppelin Docs:** https://docs.openzeppelin.com/
- **Solidity Docs:** https://docs.soliditylang.org/
- **Somnia Network:** https://somnia.network/
- **Hardhat Docs:** https://hardhat.org/docs

---

## 🤝 Support

For issues with the AI Assistant:
1. Check browser console for errors
2. Verify API keys in `.env`
3. Test with simple prompts first
4. Review this guide for proper usage

**Need help?** Open an issue on GitHub or contact the SomniaStudio team.

---

**Built with ❤️ for the Somnia Network community**
