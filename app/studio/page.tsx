"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Play,
  Rocket,
  Shield,
  Brain,
  Terminal,
  FileCode,
  FolderOpen,
  Plus,
  Save,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Zap,
  Bug,
  Code2,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowLeft,
  Trash2,
  Edit3,
  Coins,
  Image,
  Users,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { useThemeStore, useUserStore, useProjectStore, useIDEStore } from "@/lib/store";
import { analytics } from "@/lib/supabase";
import { createPaymentHeader } from "@/utils/q402";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="animate-spin text-purple-500" size={32} />
    </div>
  ),
});

// ============= CONTRACT TEMPLATES =============
const TEMPLATES = {
  erc20: {
    name: "ERC20 Token",
    icon: "Coins",
    description: "Standard fungible token with mint/burn",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev ERC20 token with mint and burn capabilities
 * @notice Built with SomniStudio for Somnia Network
 */
contract MyToken is ERC20, ERC20Burnable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    receive() external payable {}
}
`,
  },
  nft: {
    name: "NFT Collection",
    icon: "Image",
    description: "ERC721 NFT with metadata & minting",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyNFT
 * @dev NFT collection with metadata management
 * @notice Built with SomniStudio for Somnia Network
 */
contract MyNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxSupply = 10000;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT (owner only, free)
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Public mint with payment
     */
    function publicMint(string memory uri) public payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
`,
  },
  dao: {
    name: "Simple DAO",
    icon: "Users",
    description: "Governance with proposals & voting",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDAO
 * @dev Basic DAO with proposal creation and voting
 * @notice Built with SomniStudio for Somnia Network
 */
contract SimpleDAO is Ownable {
    struct Proposal {
        uint256 id;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public memberVotingPower;
    
    uint256 public proposalCount;
    uint256 public totalMembers;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MEMBERSHIP_FEE = 0.01 ether;

    event MemberJoined(address indexed member, uint256 votingPower);
    event ProposalCreated(uint256 indexed id, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed id, bool passed);

    constructor() Ownable(msg.sender) {
        // Owner is first member with 10 voting power
        memberVotingPower[msg.sender] = 10;
        totalMembers = 1;
    }

    /**
     * @dev Join the DAO by paying membership fee
     */
    function join() external payable {
        require(msg.value >= MEMBERSHIP_FEE, "Insufficient membership fee");
        require(memberVotingPower[msg.sender] == 0, "Already a member");
        
        memberVotingPower[msg.sender] = 1;
        totalMembers++;
        
        emit MemberJoined(msg.sender, 1);
    }

    /**
     * @dev Create a new proposal (members only)
     */
    function createProposal(string memory description) external returns (uint256) {
        require(memberVotingPower[msg.sender] > 0, "Not a member");
        
        uint256 proposalId = proposalCount++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.description = description;
        p.deadline = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(proposalId, description);
        return proposalId;
    }

    /**
     * @dev Vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external {
        require(memberVotingPower[msg.sender] > 0, "Not a member");
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.deadline, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        
        p.hasVoted[msg.sender] = true;
        uint256 power = memberVotingPower[msg.sender];
        
        if (support) {
            p.forVotes += power;
        } else {
            p.againstVotes += power;
        }
        
        emit Voted(proposalId, msg.sender, support);
    }

    /**
     * @dev Execute a proposal after voting ends
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        
        p.executed = true;
        bool passed = p.forVotes > p.againstVotes;
        
        emit ProposalExecuted(proposalId, passed);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
`,
  },
  staking: {
    name: "Staking",
    icon: "Landmark",
    description: "Stake tokens & earn rewards",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingRewards
 * @dev Stake tokens and earn rewards over time
 * @notice Built with SomniStudio for Somnia Network
 */
contract StakingRewards is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate = 100; // rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + 
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        return ((balances[account] * 
            (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
    }

    /**
     * @dev Stake tokens
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalStaked += amount;
        balances[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Withdraw staked tokens
     */
    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        totalStaked -= amount;
        balances[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /**
     * @dev Exit: withdraw all and claim rewards
     */
    function exit() external {
        withdraw(balances[msg.sender]);
        claimReward();
    }

    function setRewardRate(uint256 _rate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rate;
        emit RewardRateUpdated(_rate);
    }

    receive() external payable {}
}
`,
  },
};

// Default contract template
const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev A simple ERC20 token with minting capability
 * @notice Built with SomniStudio for Somnia Network
 */
contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Somnia Token", "MST") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
`;

export default function StudioPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { walletAddress, isConnected, network, setUser, disconnect, setNetwork } = useUserStore();
  const { files, activeFileId, updateFileContent, setActiveFile, addFile, removeFile } = useProjectStore();
  const { 
    isCompiling, 
    isDeploying, 
    compileResult, 
    consoleOutput,
    terminalOpen,
    sidebarOpen,
    aiPanelOpen,
    setCompiling,
    setDeploying,
    setCompileResult,
    addConsoleOutput,
    clearConsole,
    toggleTerminal,
    toggleSidebar,
    toggleAIPanel
  } = useIDEStore();

  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState(DEFAULT_CONTRACT);
  const [currentFileName, setCurrentFileName] = useState("MyToken.sol");
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiResponse, setAIResponse] = useState<string | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [teachModeContent, setTeachModeContent] = useState<any>(null);
  const [aiMode, setAIMode] = useState<"architect" | "researcher">("architect");
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [userFiles, setUserFiles] = useState<{name: string, code: string}[]>([
    { name: "MyToken.sol", code: DEFAULT_CONTRACT }
  ]);
  const [userUUID, setUserUUID] = useState<string | null>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
    // Initialize with a default file
    if (files.length === 0) {
      addFile({
        id: "main",
        path: "contracts/MyToken.sol",
        content: DEFAULT_CONTRACT,
        language: "solidity",
        isModified: false,
      });
      setActiveFile("main");
    }
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];
        setUser({ walletAddress: address });
        addConsoleOutput(`✅ Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        
        // Track in Supabase - get or create user and store UUID
        const user = await analytics.getOrCreateUser(address);
        if (user) {
          setUserUUID(user.id);
          console.log('✅ User UUID stored:', user.id);
          
          analytics.trackAction({
            user_id: user.id,
            action_type: "wallet_connect",
            action_category: "auth",
          });
          console.log('✅ Wallet connect tracked');
        } else {
          console.warn('⚠️ Failed to get user UUID');
        }
      } catch (err: any) {
        addConsoleOutput(`❌ Wallet connection failed: ${err.message}`);
      }
    } else {
      addConsoleOutput("❌ Please install MetaMask");
    }
  };

  // Compile contract
  const handleCompile = async () => {
    if (!isConnected) {
      addConsoleOutput("⚠️ Please connect wallet first");
      return;
    }

    setCompiling(true);
    clearConsole();
    addConsoleOutput("🔨 Compiling contract...");

    const startTime = Date.now();

    try {
      let res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compile",
          userAddress: walletAddress,
          code,
        }),
      });

      // Handle payment if required
      if (res.status === 402) {
        const data = await res.json();
        addConsoleOutput("💳 Signature required for compilation...");
        const xPaymentHeader = await createPaymentHeader(walletAddress!, data.paymentDetails);
        
        res = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PAYMENT": xPaymentHeader,
          },
          body: JSON.stringify({
            action: "compile",
            userAddress: walletAddress,
            code,
          }),
        });
      }

      const result = await res.json();
      const compileTime = Date.now() - startTime;

      if (result.success) {
        addConsoleOutput(`✅ Compiled successfully in ${compileTime}ms`);
        addConsoleOutput(`📦 Bytecode size: ${(result.bytecode?.length || 0) / 2} bytes`);
        setCompileResult({
          success: true,
          bytecode: result.bytecode,
          abi: result.abi,
        });
        
        // Track success
        if (userUUID) {
          analytics.trackCompilation({
            userId: userUUID,
            status: "success",
            sourceCode: code,
            compileTimeMs: compileTime,
          });
          console.log('✅ Compilation tracked (success)');
        }
      } else {
        addConsoleOutput(`❌ Compilation failed`);
        if (result.errors) {
          result.errors.forEach((err: any) => {
            addConsoleOutput(`   Line ${err.line || "?"}: ${err.message}`);
          });
        }
        setCompileResult({
          success: false,
          errors: result.errors,
        });

        // Generate AI explanation for errors
        if (result.errors?.length > 0) {
          await generateErrorExplanation(result.errors);
        }

        // Track failure
        if (userUUID) {
          analytics.trackCompilation({
            userId: userUUID,
            status: "error",
            sourceCode: code,
            errors: result.errors,
            compileTimeMs: compileTime,
          });
          console.log('✅ Compilation tracked (error)');
        }
      }
    } catch (err: any) {
      addConsoleOutput(`❌ Error: ${err.message}`);
      setCompileResult({ success: false, errors: [{ message: err.message }] });
    } finally {
      setCompiling(false);
    }
  };

  // Generate AI explanation for errors
  const generateErrorExplanation = async (errors: any[]) => {
    setAILoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain_error",
          userAddress: walletAddress,
          code,
          errors,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAIResponse(data.explanation);
        setTeachModeContent(data.teachMode);
        toggleAIPanel();
      }
    } catch (err) {
      console.error("Failed to get AI explanation:", err);
    } finally {
      setAILoading(false);
    }
  };

  // Deploy contract
  const handleDeploy = async () => {
    if (!compileResult?.success) {
      addConsoleOutput("⚠️ Please compile successfully first");
      return;
    }

    setDeploying(true);
    addConsoleOutput(`🚀 Deploying to Somnia ${network}...`);

    try {
      let res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deploy",
          userAddress: walletAddress,
          network,
          code,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        addConsoleOutput("💳 Signature required for deployment...");
        const xPaymentHeader = await createPaymentHeader(walletAddress!, data.paymentDetails);
        
        res = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PAYMENT": xPaymentHeader,
          },
          body: JSON.stringify({
            action: "deploy",
            userAddress: walletAddress,
            network,
            code,
          }),
        });
      }

      const result = await res.json();

      if (result.success) {
        addConsoleOutput(`✅ Contract deployed!`);
        addConsoleOutput(`📍 Address: ${result.address}`);
        addConsoleOutput(`🔗 TX: ${result.txHash}`);
        setDeployedAddress(result.address);
        setShowDeployModal(true);

        // Track deployment
        if (userUUID) {
          analytics.trackDeployment({
            userId: userUUID,
            contractAddress: result.address,
            network: network as "testnet" | "mainnet",
            transactionHash: result.txHash,
            deployerAddress: walletAddress!,
          });
          console.log('✅ Deployment tracked');
        }
      } else {
        addConsoleOutput(`❌ Deployment failed: ${result.error}`);
      }
    } catch (err: any) {
      addConsoleOutput(`❌ Error: ${err.message}`);
    } finally {
      setDeploying(false);
    }
  };

  // AI Generate
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setAILoading(true);
    
    // Determine action based on mode
    const action = aiMode === "architect" ? "generate" : "research";
    addConsoleOutput(`🤖 ${aiMode === "architect" ? "Generating contract" : "Researching"}: "${aiPrompt.slice(0, 50)}..."`);

    try {
      let res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userAddress: walletAddress || "anonymous",
          prompt: aiPrompt,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        const xPaymentHeader = await createPaymentHeader(walletAddress!, data.paymentDetails);
        
        res = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PAYMENT": xPaymentHeader,
          },
          body: JSON.stringify({
            action: "generate",
            userAddress: walletAddress || "anonymous",
            prompt: aiPrompt,
          }),
        });
      }

      const result = await res.json();

      if (result.success) {
        if (aiMode === "architect") {
          // Architect mode: Generate contract code
          setCode(result.code);
          addConsoleOutput(`✅ Contract generated successfully`);
          setAIResponse("✅ Contract generated! Review the code and compile when ready.");
          
          // Track AI usage
          if (userUUID) {
            analytics.trackAIPrompt({
              userId: userUUID,
              promptType: "generate",
              promptText: aiPrompt,
              responseText: result.code,
            });
            console.log('✅ AI prompt tracked (generate)');
          }
        } else {
          // Researcher mode: Show answer
          const answer = result.result || result.answer || result.response || "No answer received";
          setAIResponse(answer);
          addConsoleOutput(`✅ Research complete`);
          
          // Track research query
          if (userUUID) {
            analytics.trackAIPrompt({
              userId: userUUID,
              promptType: "research",
              promptText: aiPrompt,
              responseText: answer,
            });
            console.log('✅ AI prompt tracked (research)');
          }
        }
      } else {
        addConsoleOutput(`❌ ${aiMode === "architect" ? "Generation" : "Research"} failed: ${result.error}`);
        setAIResponse(`❌ Error: ${result.error || "Unknown error"}`);
      }
    } catch (err: any) {
      addConsoleOutput(`❌ Error: ${err.message}`);
    } finally {
      setAILoading(false);
      setAIPrompt("");
    }
  };

  // Security Audit
  const handleAudit = async () => {
    setAILoading(true);
    addConsoleOutput("🔒 Running security audit...");

    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const result = await res.json();

      if (result.success) {
        const { riskLevel, issues, score } = result.analysis;
        addConsoleOutput(`🛡️ Security Score: ${100 - score}/100`);
        addConsoleOutput(`⚠️ Risk Level: ${riskLevel.toUpperCase()}`);
        addConsoleOutput(`📋 Issues found: ${issues.length}`);
        
        setAIResponse(`## Security Audit Report\n\n**Risk Level:** ${riskLevel}\n**Score:** ${100 - score}/100\n\n### Issues Found:\n${
          issues.map((i: any) => `- **${i.severity}**: ${i.title}\n  ${i.description}`).join("\n\n")
        }`);
        
        if (!aiPanelOpen) toggleAIPanel();

        // Track audit
        if (userUUID) {
          analytics.trackSecurityAudit({
            userId: userUUID,
            sourceCode: code,
            riskScore: score,
            riskLevel,
            issues,
          });
          console.log('✅ Security audit tracked');
        }
      }
    } catch (err: any) {
      addConsoleOutput(`❌ Audit failed: ${err.message}`);
    } finally {
      setAILoading(false);
    }
  };

  // ============= TEMPLATE LOADING =============
  const loadTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    setCode(template.code);
    const fileName = `${template.name.replace(/\s+/g, '')}.sol`;
    setCurrentFileName(fileName);
    addConsoleOutput(`📄 Loaded template: ${template.name}`);
    
    // Add to files list if not exists
    if (!userFiles.find(f => f.name === fileName)) {
      setUserFiles(prev => [...prev, { name: fileName, code: template.code }]);
    }
  };

  // ============= FILE MANAGEMENT =============
  const createNewFile = () => {
    if (!newFileName.trim()) return;
    
    let fileName = newFileName.trim();
    if (!fileName.endsWith('.sol')) {
      fileName += '.sol';
    }
    
    // Check if file already exists
    if (userFiles.find(f => f.name === fileName)) {
      addConsoleOutput(`❌ File "${fileName}" already exists`);
      return;
    }
    
    const newCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ${fileName.replace('.sol', '')}
 * @dev Your contract description here
 * @notice Built with SomniStudio for Somnia Network
 */
contract ${fileName.replace('.sol', '')} {
    // Your code here
    
    constructor() {
        // Initialize your contract
    }
}
`;
    
    setUserFiles(prev => [...prev, { name: fileName, code: newCode }]);
    setCurrentFileName(fileName);
    setCode(newCode);
    setNewFileName("");
    setShowNewFileModal(false);
    addConsoleOutput(`✅ Created new file: ${fileName}`);
  };

  const switchFile = (fileName: string) => {
    // Save current file
    setUserFiles(prev => prev.map(f => 
      f.name === currentFileName ? { ...f, code } : f
    ));
    
    // Switch to new file
    const file = userFiles.find(f => f.name === fileName);
    if (file) {
      setCurrentFileName(fileName);
      setCode(file.code);
      addConsoleOutput(`📂 Opened: ${fileName}`);
    }
  };

  const deleteFile = (fileName: string) => {
    if (userFiles.length <= 1) {
      addConsoleOutput(`❌ Cannot delete the last file`);
      return;
    }
    
    setUserFiles(prev => prev.filter(f => f.name !== fileName));
    
    // If deleting current file, switch to first available
    if (currentFileName === fileName) {
      const remaining = userFiles.filter(f => f.name !== fileName);
      if (remaining.length > 0) {
        setCurrentFileName(remaining[0].name);
        setCode(remaining[0].code);
      }
    }
    
    addConsoleOutput(`🗑️ Deleted: ${fileName}`);
  };

  // ============= QUICK ACTIONS =============
  const handleQuickAction = async (action: string) => {
    if (!code.trim()) {
      addConsoleOutput("⚠️ No code to analyze");
      return;
    }

    setAILoading(true);
    if (!aiPanelOpen) toggleAIPanel();

    const prompts: Record<string, string> = {
      explain: `Explain this Solidity contract in simple terms. What does it do? What are the main functions? 

CONTRACT:
${code}

Provide a clear, beginner-friendly explanation with:
1. Overview (what the contract does)
2. Key functions and their purpose
3. How to use it
4. Any important notes`,

      optimize: `Analyze this Solidity contract for gas optimization opportunities:

CONTRACT:
${code}

Provide:
1. Current gas-heavy patterns found
2. Specific optimization suggestions with code examples
3. Estimated gas savings for each suggestion
4. Optimized version of critical functions`,

      secure: `Review this Solidity contract for security vulnerabilities and suggest improvements:

CONTRACT:
${code}

Provide:
1. Security vulnerabilities found (with severity)
2. Missing security patterns that should be added
3. Specific code additions for each suggestion
4. A summary of recommended security improvements`,

      debug: `Analyze this Solidity contract for potential bugs and issues:

CONTRACT:
${code}

Look for:
1. Logic errors
2. Edge cases not handled
3. Potential runtime errors
4. Best practice violations
5. Provide fixes for each issue found`,
    };

    try {
      addConsoleOutput(`🤖 Running ${action} analysis...`);

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "research",
          userAddress: walletAddress || "anonymous",
          prompt: prompts[action],
        }),
      });

      const result = await res.json();

      if (result.success) {
        const response = result.result || result.answer || result.response || "Analysis complete";
        setAIResponse(response);
        addConsoleOutput(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} analysis complete`);
        
        // Track the analysis
        if (userUUID) {
          analytics.trackAIPrompt({
            userId: userUUID,
            promptType: action,
            promptText: prompts[action],
            responseText: response,
          });
          console.log(`✅ AI prompt tracked (${action})`);
        }
        
        // Ensure AI panel is visible
        if (!aiPanelOpen) {
          toggleAIPanel();
        }
        
        if (userUUID) {
          analytics.trackAIPrompt({
            userId: userUUID,
            promptType: action as any,
            promptText: prompts[action],
            responseText: response,
          });
          console.log(`✅ AI prompt tracked (${action})`);
        }
      } else {
        const errorMsg = result.error || "Unknown error";
        setAIResponse(`❌ Analysis failed: ${errorMsg}`);
        addConsoleOutput(`❌ Analysis failed: ${errorMsg}`);
        if (!aiPanelOpen) {
          toggleAIPanel();
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || "Request failed";
      setAIResponse(`❌ Error: ${errorMsg}`);
      addConsoleOutput(`❌ Error: ${errorMsg}`);
      if (!aiPanelOpen) {
        toggleAIPanel();
      }
    } finally {
      setAILoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`h-screen flex flex-col ${isDark ? "bg-[#0d0d12] text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Top Bar */}
      <div className={`h-12 flex items-center justify-between px-4 border-b ${
        isDark ? "bg-[#16161d] border-white/5" : "bg-white border-gray-200"
      }`}>
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              S
            </div>
          </Link>
          <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>|</div>
          <span className="text-sm font-medium">{currentFileName}</span>
        </div>

        {/* Center - Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleCompile}
            disabled={isCompiling}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              isCompiling
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {isCompiling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Compile
          </motion.button>

          <motion.button
            onClick={handleAudit}
            disabled={aiLoading}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <Shield size={14} />
            Audit
          </motion.button>

          <motion.button
            onClick={handleDeploy}
            disabled={isDeploying || !compileResult?.success}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              isDeploying || !compileResult?.success
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {isDeploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
            Deploy
          </motion.button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Network Toggle */}
          <button
            onClick={() => setNetwork(network === "testnet" ? "mainnet" : "testnet")}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              network === "mainnet"
                ? "border-red-500/50 text-red-400 bg-red-500/10"
                : "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
            }`}
          >
            {network.toUpperCase()}
          </button>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
            whileTap={{ scale: 0.95 }}
          >
            {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-purple-600" />}
          </motion.button>

          {/* Terminal Toggle */}
          <motion.button
            onClick={toggleTerminal}
            className={`p-2 rounded-lg ${terminalOpen ? "bg-green-600 text-white" : isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
            whileTap={{ scale: 0.95 }}
            title="Toggle Terminal"
          >
            <Terminal size={16} />
          </motion.button>

          {/* AI Panel Toggle */}
          <motion.button
            onClick={toggleAIPanel}
            className={`p-2 rounded-lg ${aiPanelOpen ? "bg-purple-600 text-white" : isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
            whileTap={{ scale: 0.95 }}
          >
            <Brain size={16} />
          </motion.button>

          {/* Wallet */}
          {!isConnected ? (
            <motion.button
              onClick={connectWallet}
              className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-gray-200"
              whileTap={{ scale: 0.98 }}
            >
              Connect Wallet
            </motion.button>
          ) : (
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              </div>
              
              {/* Disconnect Dropdown */}
              <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <motion.button
                  onClick={() => {
                    disconnect();
                    addConsoleOutput("👋 Wallet disconnected");
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-2 ${
                    isDark ? "bg-[#16161d] hover:bg-red-500/10 text-red-400" : "bg-white hover:bg-red-50 text-red-600"
                  } border ${isDark ? "border-white/10" : "border-gray-200"} shadow-lg`}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={14} />
                  Disconnect
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-r flex flex-col min-w-0 max-w-[200px] flex-shrink-0 overflow-hidden ${isDark ? "bg-[#111116] border-white/5" : "bg-white border-gray-200"}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Explorer
                  </span>
                  <button
                    onClick={() => setShowNewFileModal(true)}
                    className={`p-1 rounded hover:bg-white/10 transition-colors`}
                    title="New File"
                  >
                    <Plus size={14} className="text-purple-400" />
                  </button>
                </div>
                
                {/* File Tree */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ChevronDown size={14} />
                    <FolderOpen size={14} className="text-yellow-500" />
                    <span>contracts</span>
                  </div>
                  
                  {/* Dynamic file list */}
                  {userFiles.map((file) => (
                    <div
                      key={file.name}
                      className={`ml-6 flex items-center justify-between group text-sm py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                        currentFileName === file.name
                          ? isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"
                          : isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => switchFile(file.name)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileCode size={14} className="flex-shrink-0" />
                        <span className="truncate text-xs">{file.name}</span>
                      </div>
                      {userFiles.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div className="p-4 border-t border-white/5">
                <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Templates
                </div>
                <div className="space-y-1">
                  {[
                    { key: "erc20", icon: <Coins size={14} className="text-yellow-400" />, name: "ERC20 Token" },
                    { key: "nft", icon: <Image size={14} className="text-pink-400" />, name: "NFT Collection" },
                    { key: "dao", icon: <Users size={14} className="text-blue-400" />, name: "Simple DAO" },
                    { key: "staking", icon: <Landmark size={14} className="text-green-400" />, name: "Staking" },
                  ].map((template) => (
                    <button
                      key={template.key}
                      onClick={() => loadTemplate(template.key as keyof typeof TEMPLATES)}
                      className={`w-full flex items-center gap-2 text-xs py-2 px-3 rounded-lg transition-colors ${
                        isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      {template.icon}
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Monaco Editor */}
          <div className={`${terminalOpen ? "flex-1" : "h-full"} min-h-0`}>
            <MonacoEditor
              height="100%"
              language="sol"
              theme={isDark ? "vs-dark" : "light"}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div
              className={`h-[180px] flex-shrink-0 border-t ${isDark ? "bg-[#0a0a0f] border-white/5" : "bg-gray-900 border-gray-700"}`}
            >
              <div className="h-8 px-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-green-500" />
                  <span className="text-xs font-mono text-gray-400">Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearConsole} className="text-gray-500 hover:text-white">
                    <RefreshCw size={12} />
                  </button>
                  <button onClick={toggleTerminal} className="text-gray-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4 h-[calc(100%-32px)] overflow-y-auto font-mono text-xs space-y-1">
                {consoleOutput.map((line: string, i: number) => (
                  <div key={i} className={
                    line.startsWith("✅") ? "text-green-400" :
                    line.startsWith("❌") ? "text-red-400" :
                    line.startsWith("⚠️") ? "text-yellow-400" :
                    line.startsWith("🔨") || line.startsWith("🚀") || line.startsWith("🤖") ? "text-purple-400" :
                    line.startsWith("💳") ? "text-cyan-400" :
                    "text-gray-400"
                  }>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {aiPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l flex flex-col min-w-0 max-w-[320px] flex-shrink-0 overflow-hidden ${isDark ? "bg-[#111116] border-white/5" : "bg-white border-gray-200"}`}
            >
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="text-purple-500" size={18} />
                    <span className="font-bold">AI Assistant</span>
                  </div>
                  <button onClick={toggleAIPanel} className="text-gray-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className={`flex gap-2 mb-4 p-1 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                  <button
                    onClick={() => setAIMode("architect")}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      aiMode === "architect"
                        ? "bg-purple-600 text-white shadow-lg"
                        : isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Code2 size={14} className="inline mr-2" />
                    Architect
                  </button>
                  <button
                    onClick={() => setAIMode("researcher")}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      aiMode === "researcher"
                        ? "bg-purple-600 text-white shadow-lg"
                        : isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <BookOpen size={14} className="inline mr-2" />
                    Researcher
                  </button>
                </div>

                {/* AI Input */}
                <div className="flex gap-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
                    placeholder={aiMode === "architect" ? "Describe your contract..." : "Ask anything about Web3, Solidity..."}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      isDark 
                        ? "bg-white/5 border border-white/10 focus:border-purple-500" 
                        : "bg-gray-100 border border-gray-200 focus:border-purple-500"
                    } outline-none transition-colors`}
                  />
                  <motion.button
                    onClick={handleAIGenerate}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </motion.button>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex-1 overflow-y-auto p-4">
                {aiResponse ? (
                  <div className={`p-4 rounded-xl text-sm ${
                    isDark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-100"
                  }`}>
                    <div className="whitespace-pre-wrap">{aiResponse}</div>
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    <Brain size={32} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Ask me to generate, explain, or fix your code</p>
                  </div>
                )}

                {/* Teach Mode */}
                {teachModeContent && (
                  <div className={`mt-4 p-4 rounded-xl ${
                    isDark ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-cyan-50 border border-cyan-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="text-cyan-500" size={16} />
                      <span className="font-bold text-sm">Teach Me Mode</span>
                    </div>
                    <div className="text-sm space-y-2">
                      {teachModeContent.steps?.map((step: string, i: number) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-cyan-500 font-bold">{i + 1}.</span>
                          <span className={isDark ? "text-gray-300" : "text-gray-700"}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Quick Actions
                  </p>
                  {[
                    { icon: <Code2 size={14} />, label: "Explain this contract", action: "explain" },
                    { icon: <Zap size={14} />, label: "Optimize gas usage", action: "optimize" },
                    { icon: <Shield size={14} />, label: "Add security checks", action: "secure" },
                    { icon: <Bug size={14} />, label: "Find potential bugs", action: "debug" },
                  ].map((item) => (
                    <button
                      key={item.action}
                      onClick={() => handleQuickAction(item.action)}
                      disabled={aiLoading}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors disabled:opacity-50 ${
                        isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Deploy Success Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeployModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-[480px] rounded-3xl p-8 ${isDark ? "bg-[#16161d]" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Contract Deployed! 🎉</h2>
                <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Your contract is now live on Somnia {network}
                </p>
                
                <div className={`p-4 rounded-xl font-mono text-sm mb-6 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                  {deployedAddress}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(deployedAddress || "")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                      isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Copy size={16} />
                    Copy Address
                  </button>
                  <a
                    href={`https://${network === "mainnet" ? "explorer" : "shannon-explorer"}.somnia.network/address/${deployedAddress}`}
                    target="_blank"
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View on Explorer
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Modal */}
      <AnimatePresence>
        {showNewFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowNewFileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-[400px] rounded-2xl p-6 ${isDark ? "bg-[#16161d]" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Create New File</h3>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Add a new Solidity contract
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    File Name
                  </label>
                  <input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createNewFile()}
                    placeholder="MyContract.sol"
                    className={`w-full px-4 py-3 rounded-xl text-sm ${
                      isDark 
                        ? "bg-white/5 border border-white/10 focus:border-purple-500" 
                        : "bg-gray-100 border border-gray-200 focus:border-purple-500"
                    } outline-none transition-colors`}
                    autoFocus
                  />
                  <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    .sol extension will be added automatically
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowNewFileModal(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                      isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewFile}
                    disabled={!newFileName.trim()}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Create File
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
