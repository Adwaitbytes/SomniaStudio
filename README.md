# 🟣 SomniStudio

**AI-Powered Smart Contract IDE for Somnia Network**

Build, compile, audit, and deploy smart contracts with AI assistance - all in your browser.

[![Live Demo](https://img.shields.io/badge/Live-Demo-purple)](https://somnistudio.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-45%2F45%20passing-success)](https://github.com/Adwaitbytes/SomniStudio)

---

## ✨ What is SomniStudio?

SomniStudio is a complete browser-based IDE for smart contract development on Somnia Network. It combines the power of AI with professional development tools to make blockchain development accessible to everyone.

### 🎯 Key Features

- **🤖 AI Code Generation** - Describe your contract in plain English, get production-ready Solidity
- **💻 Monaco Editor** - VS Code's editor engine with full Solidity syntax highlighting
- **🔨 Smart Compilation** - Hardhat-powered with automatic OpenZeppelin import resolution
- **🛡️ Security Auditing** - Built-in analysis to catch vulnerabilities before deployment
- **🚀 One-Click Deploy** - Deploy to Somnia Testnet or Mainnet instantly
- **📚 Template Library** - Pre-built templates for ERC20, NFT, DAO, and Staking contracts
- **🎓 AI Teaching Mode** - Learn from errors with AI-powered explanations
- **⚡ Quick Actions** - Explain, Optimize, Secure, and Debug your contracts with one click
- **📁 Multi-File Support** - Create and manage multiple contract files
- **📊 Analytics Dashboard** - Track deployments and usage (optional Supabase integration)
- **🌓 Dark/Light Mode** - Choose your preferred theme
- **🔗 Web3 Integration** - Connect with MetaMask and other Web3 wallets

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- At least one AI API key:
  - **Groq** (Recommended - Free) - [Get API Key](https://console.groq.com/)
  - **ChainGPT** (Alternative) - [Get API Key](https://app.chaingpt.org/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adwaitbytes/SomniStudio.git
   cd SomniStudio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Add your API keys to `.env.local`**
   ```env
   # Required: At least one AI API key
   GROQ_API_KEY=gsk_your_groq_key_here
   
   # Optional: For analytics
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 🔑 Getting API Keys

### Groq API (Free & Fast - Recommended)
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Create an API key
4. Add to `.env.local`

### ChainGPT (Alternative)
1. Visit [app.chaingpt.org](https://app.chaingpt.org)
2. Sign up and get API key
3. Add to `.env.local`

### Supabase (Optional - For Analytics)
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Copy Project URL and anon key
4. Run `supabase/schema.sql` in SQL Editor
5. Add credentials to `.env.local`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

---

## 🧪 Test AI Generator Quality

Run the automated test suite to verify AI-generated contracts:

```bash
# Make sure dev server is running first
npm run dev

# In another terminal, run tests
node scripts/test-ai-generator.js
```

The test suite validates:
- ✅ Contract generation from prompts
- ✅ Compilation success rate
- ✅ Contract name compliance
- ✅ Mandatory element presence
- ✅ Security best practices
- ✅ Gas optimization

**Expected Results:** 95%+ success rate on standard prompts

---

## 📖 How to Use

### 1. **Create or Load a Contract**
   - Start with a template (ERC20, NFT, DAO, Staking)
   - Generate with AI by describing what you want
   - Create a new file and write from scratch

### 2. **Code with Assistance**
   - Use the Monaco editor with full Solidity support
   - Click **Quick Actions** for AI help:
     - **Explain** - Understand what your contract does
     - **Optimize** - Get gas optimization suggestions
     - **Secure** - Add security improvements
     - **Debug** - Find and fix potential bugs

### 3. **AI Contract Generation**
   - Click the **AI Generate** button
   - Describe your contract in natural language
   - Examples:
     - "Create an ERC20 token named 'GameCoin' with 1M supply"
     - "Build a staking contract with 10% APY rewards"
     - "Make an NFT collection with whitelist minting"
   - AI generates production-ready, deployable code
   - See [AI_QUICK_REFERENCE.md](AI_QUICK_REFERENCE.md) for prompt examples

### 4. **Compile & Validate**
   - Click **Compile** to build your contract
   - AI automatically validates code quality
   - See errors with AI-powered explanations
   - Click **Fix** to auto-repair issues

### 5. **Audit Security** (Premium)
   - Click **Audit** for comprehensive security analysis
   - Review vulnerabilities by severity
   - Get security score (X/10)
   - Apply recommended security patterns
   - Requires Q402 micropayment (0.0001 STT)

### 6. **Deploy to Blockchain** (Premium)
   - Connect your MetaMask wallet
   - Choose Testnet (free) or Mainnet
   - Click **Deploy** after successful compilation
   - Requires Q402 micropayment for mainnet
   - Get contract address and explorer link

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor (VS Code)
- **Animation**: Framer Motion
- **State**: Zustand with persistence
- **Blockchain**: Viem, Ethers.js, Hardhat
- **Compilation**: Hardhat with OpenZeppelin
- **Testing**: Mocha, Chai (45/45 tests passing)
- **AI**: Groq API, ChainGPT
- **Analytics**: Supabase (optional)
- **Icons**: Lucide React

---

## 🌐 Somnia Network

Built for Somnia - a high-performance EVM-compatible blockchain.

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| **Testnet** | 50312 | https://dream-rpc.somnia.network | [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |
| **Mainnet** | 5031 | https://api.infra.mainnet.somnia.network/ | [explorer.somnia.network](https://explorer.somnia.network) |

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adwaitbytes/SomniStudio)

1. Click "Deploy" button above
2. Add environment variables
3. Deploy!

---

## 🧪 Testing

### Smart Contract Tests
Run Hardhat contract tests:

```bash
npm test
```

All 45 tests should pass, covering:
- ERC20 token functionality
- NFT minting and transfers
- DEX pool operations
- Gas optimizations

### AI Generator Quality Tests
Validate AI-generated contract quality:

```bash
# Start dev server first
npm run dev

# In another terminal
node scripts/test-ai-generator.js
```

Tests 6 contract types:
- ✅ ERC20 tokens (basic & advanced)
- ✅ ERC721 NFTs
- ✅ DeFi staking
- ✅ DAO governance
- ✅ Complex contracts

**Target:** 95%+ compilation success rate

---

## 📁 Project Structure

```
├── app/
│   ├── landing/          # Landing page
│   ├── studio/           # Main IDE
│   └── api/              # Backend endpoints
├── contracts/
│   └── templates/        # Pre-built templates
├── lib/
│   ├── store.ts          # State management
│   ├── supabase.ts       # Analytics
│   └── q402.ts           # Payment verification
├── supabase/
│   └── schema.sql        # Database schema
└── test/                 # Contract tests
```

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run contract tests
npm run compile      # Compile contracts
npm run type-check   # Check TypeScript
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional | Groq API for AI (recommended) |
| `CHAINGPT_API_KEY` | Optional | ChainGPT API (fallback) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase URL for analytics |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `PRIVATE_KEY` | Optional | Wallet key for backend deploys |

**Note**: At least one AI API key is required for full functionality.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for [Somnia Network](https://somnia.network)
- Powered by [OpenZeppelin](https://openzeppelin.com) contracts
- AI by [Groq](https://groq.com) and [ChainGPT](https://chaingpt.org)
- Editor by [Monaco](https://microsoft.github.io/monaco-editor/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Adwaitbytes/SomniStudio/issues)
- **Twitter**: [@Adwaitbytes](https://twitter.com/Adwaitbytes)
- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md) | [CHECKLIST.md](CHECKLIST.md)

---

**Made with 💜 for the Somnia ecosystem by [@Adwaitbytes](https://github.com/Adwaitbytes)**

4.  **Run the App**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

---

**Powered by Somnia Network**