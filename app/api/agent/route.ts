import { NextResponse } from "next/server";
import { verifyPayment, settlePayment } from "../../../lib/q402";
import { createWalletClient, createPublicClient, http, defineChain, getAddress } from "viem";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { privateKeyToAccount } from "viem/accounts";

// --- CHAIN DEFINITIONS ---
const somniaTestnet = defineChain({
    id: 50312,
    name: 'Somnia Testnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
});

const somniaMainnet = defineChain({
    id: 5031,
    name: 'Somnia Mainnet',
    nativeCurrency: { name: 'SOMI', symbol: 'SOMI', decimals: 18 },
    rpcUrls: { default: { http: ['https://api.infra.mainnet.somnia.network/'] } },
});

// --- CONFIG ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHAINGPT_API_KEY = process.env.CHAINGPT_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const CHAINGPT_API_URL = "https://api.chaingpt.org/chat/stream";
const RPC_TESTNET = "https://dream-rpc.somnia.network";
const RPC_MAINNET = "https://api.infra.mainnet.somnia.network/";

// --- ADDRESS CHECKSUM FIXER ---
// Fixes incorrectly checksummed addresses in Solidity code
function fixAddressChecksums(sourceCode: string): string {
    // Match Ethereum addresses (0x followed by 40 hex characters)
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    
    return sourceCode.replace(addressRegex, (match) => {
        try {
            // getAddress from viem will return the properly checksummed address
            return getAddress(match);
        } catch {
            // If it's not a valid address, return as-is
            return match;
        }
    });
}

// --- SOLIDITY COMPILER HELPER (Serverless-compatible, no filesystem writes) ---
const execAsync = promisify(exec);
const solc = require('solc');

// Check if we're running in a serverless/read-only environment
const IS_SERVERLESS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

async function compileSolidityServerless(sourceCode: string): Promise<{ abi: any[]; bytecode: string }> {
    try {
        // Extract contract name
        const contractNameMatch = sourceCode.match(/contract\s+(\w+)\s+(?:is\s+)?/);
        const contractName = contractNameMatch ? contractNameMatch[1] : "GenContract";

        // Prepare input for solc compiler
        const input = {
            language: 'Solidity',
            sources: {
                'GenContract.sol': {
                    content: sourceCode
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                },
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        };

        // Import callback for OpenZeppelin and other dependencies
        function findImports(importPath: string) {
            // Handle OpenZeppelin imports
            if (importPath.startsWith('@openzeppelin/')) {
                try {
                    const ozPath = path.join(process.cwd(), 'node_modules', importPath);
                    if (fs.existsSync(ozPath)) {
                        return {
                            contents: fs.readFileSync(ozPath, 'utf8')
                        };
                    }
                } catch (e) {
                    // Fallback: return error
                }
            }
            return { error: `File not found: ${importPath}` };
        }

        // Compile the contract
        const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

        // Check for errors
        if (output.errors) {
            const errors = output.errors.filter((e: any) => e.severity === 'error');
            if (errors.length > 0) {
                throw new Error(errors.map((e: any) => e.formattedMessage).join('\n'));
            }
        }

        // Extract the compiled contract
        const contract = output.contracts['GenContract.sol'][contractName];
        
        if (!contract) {
            throw new Error(`Contract ${contractName} not found in compilation output`);
        }

        return {
            abi: contract.abi,
            bytecode: contract.evm.bytecode.object
        };
    } catch (error: any) {
        console.error('Serverless compilation error:', error);
        throw new Error(`Compilation failed: ${error.message}`);
    }
}

async function compileSolidity(sourceCode: string): Promise<{ abi: any[]; bytecode: string }> {
    // Fix any incorrectly checksummed addresses before compilation
    const fixedSourceCode = fixAddressChecksums(sourceCode);
    
    // Use serverless compilation if in read-only environment
    if (IS_SERVERLESS) {
        console.log('🚀 Using serverless compilation (solc-js)');
        return compileSolidityServerless(fixedSourceCode);
    }
    
    console.log('🔧 Using local Hardhat compilation');

    
    // Extract contract name from source
    const contractNameMatch = fixedSourceCode.match(/contract\s+(\w+)/); 
    const contractName = contractNameMatch ? contractNameMatch[1] : "GenContract";
    
    // Write source to contracts folder
    const contractPath = path.join(process.cwd(), "contracts", "GenContract.sol");
    fs.writeFileSync(contractPath, fixedSourceCode, "utf-8");
    
    try {
        // Run Hardhat compile
        const { stdout, stderr } = await execAsync("npx hardhat compile --force", {
            cwd: process.cwd(),
            timeout: 60000, // 60 second timeout
        });
        
        // Read compiled artifacts
        const artifactPath = path.join(
            process.cwd(), 
            "artifacts", 
            "contracts", 
            "GenContract.sol",
            `${contractName}.json`
        );
        
        if (!fs.existsSync(artifactPath)) {
            // Try to find any compiled artifact in the folder
            const artifactDir = path.join(process.cwd(), "artifacts", "contracts", "GenContract.sol");
            if (fs.existsSync(artifactDir)) {
                const files = fs.readdirSync(artifactDir).filter(f => f.endsWith(".json") && !f.includes(".dbg."));
                if (files.length > 0) {
                    const artifact = JSON.parse(fs.readFileSync(path.join(artifactDir, files[0]), "utf-8"));
                    return {
                        abi: artifact.abi,
                        bytecode: artifact.bytecode,
                    };
                }
            }
            throw new Error(`Compiled artifact not found for contract ${contractName}`);
        }
        
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
        
        return {
            abi: artifact.abi,
            bytecode: artifact.bytecode,
        };
    } catch (error: any) {
        // Parse Hardhat errors for better messages
        const errorMessage = error.stderr || error.message || "Unknown compilation error";
        
        // Extract the actual error from Hardhat output
        const errorMatch = errorMessage.match(/Error[^:]*:\s*(.+?)(?:\n|$)/s);
        const cleanError = errorMatch ? errorMatch[1].trim() : errorMessage;
        
        throw new Error(`Compilation failed: ${cleanError}`);
    }
}

function addressToUUID(address: string) {
    const clean = address.replace("0x", "").toLowerCase().padEnd(32, "0");
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
}

// --- GROQ API HELPER ---
async function callGroqAPI(prompt: string, systemRole: string = "You are a helpful AI assistant."): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemRole },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

// --- CHAINGPT API HELPER (Fallback) ---
async function callChainGPTAPI(model: string, question: string, userAddress?: string): Promise<string> {
    const response = await fetch(CHAINGPT_API_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${CHAINGPT_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            question,
            chatHistory: "on",
            sdkUniqueId: userAddress ? addressToUUID(userAddress) : undefined
        })
    });
    const raw = await response.text();
    try { return JSON.parse(raw).data?.bot || raw; } catch { return raw; }
}

export async function POST(req: Request) {
    try {
        // 1. READ BODY ONCE (Fixes "Body already read" error)
        const body = await req.json();
        const { action, prompt, code, userAddress, network, toAddress, amount } = body;

        console.log(`🔹 API Request Action: [${action}] from [${userAddress}]`);

        // 2. BASIC CHECKS - Now supports either Groq or ChainGPT
        if (!GROQ_API_KEY && !CHAINGPT_API_KEY) {
            return NextResponse.json({ error: "Server Error: Missing AI API Key (GROQ_API_KEY or CHAINGPT_API_KEY required)." }, { status: 500 });
        }
        if (!userAddress) return NextResponse.json({ error: "Policy Violation: No authenticated wallet." }, { status: 403 });

        // 3. 🛡️ POLICY CHECK: DENY LIST
        const incomingUser = userAddress.toLowerCase();
        const DENY_LIST = [
            "0xdead00000000000000000000000000000000beef",
            //"0x9dF95D6b0Fa0F09C6a90B60D1B7F79167195EDB1".toLowerCase()
        ];

        if (DENY_LIST.includes(incomingUser)) {
            console.log(`🛑 BLOCKED: User ${incomingUser} is on the Deny List.`);
            return NextResponse.json({ error: "❌ Policy Violation: Wallet Address is Denylisted." }, { status: 403 });
        }

        // =========================================================
        // 💰 Q402 PAYMENT GATE (The Cherry on Top)
        // =========================================================
        // We charge for 'audit' and 'deploy' actions
        const PAID_ACTIONS = ["audit", "deploy"];

        if (PAID_ACTIONS.includes(action)) {
            const paymentHeader = req.headers.get("x-payment");

            if (!paymentHeader) {
                console.log(`💰 Q402: Demand Payment for ${action}`);

                const witnessData = {
                    domain: {
                        name: "q402",
                        version: "1",
                        chainId: network === "mainnet" ? 5031 : 50312,
                        verifyingContract: "0x0000000000000000000000000000000000000000"
                    },
                    types: {
                        Witness: [
                            { name: "owner", type: "address" },
                            { name: "token", type: "address" },
                            { name: "amount", type: "uint256" },
                            { name: "to", type: "address" },
                            { name: "deadline", type: "uint256" },
                            { name: "paymentId", type: "bytes32" },
                            { name: "nonce", type: "uint256" }
                        ]
                    },
                    primaryType: "Witness",
                    message: {
                        owner: userAddress,
                        token: "0x0000000000000000000000000000000000000000", // Native Token
                        amount: "100000000000000", // 0.0001 BNB Cost (String required for BigInt)
                        to: "0x9dF95D6b0Fa0F09C6a90B60D1B7F79167195EDB1", // Agent Treasury
                        deadline: Math.floor(Date.now() / 1000) + 3600,
                        paymentId: "0x" + Math.random().toString(16).slice(2).padEnd(64, '0'),
                        nonce: Date.now().toString() // String required
                    }
                };

                return NextResponse.json({
                    error: "Payment Required",
                    paymentDetails: {
                        scheme: "evm/eip7702-delegated-payment",
                        networkId: network === "mainnet" ? "somnia-mainnet" : "somnia-testnet",
                        amount: witnessData.message.amount,
                        witness: witnessData
                    }
                }, { status: 402 });
            }

            // VERIFY HEADER IF PRESENT
            try {
                const buffer = Buffer.from(paymentHeader, 'base64');
                const payload = JSON.parse(buffer.toString('utf-8'));

                const isValid = await verifyPayment(payload);
                if (!isValid) throw new Error("Invalid Signature");

                await settlePayment(payload);
                console.log("✅ Q402: Payment Verified & Settled.");
            } catch (e) {
                console.error("❌ Payment Verification Failed:", e);
                return NextResponse.json({ error: "Invalid Payment Signature" }, { status: 403 });
            }
        }

        // =========================================================
        // EXECUTION LOGIC (Gemini Primary, ChainGPT Fallback)
        // =========================================================

        if (action === "research") {
            console.log(`🔍 Research query: ${prompt}`);
            let result = "";

            // Try Groq first
            if (GROQ_API_KEY) {
                try {
                    console.log("🤖 Using Groq API for research...");
                    result = await callGroqAPI(prompt, "You are a helpful Web3 and blockchain expert. Answer this question clearly and concisely.");
                } catch (error) {
                    console.log("⚠️ Groq failed, trying ChainGPT fallback...");
                }
            }

            // Fallback to ChainGPT
            if (!result && CHAINGPT_API_KEY) {
                try {
                    result = await callChainGPTAPI("general_assistant", prompt, userAddress);
                } catch (error) {
                    console.error("❌ ChainGPT also failed:", error);
                }
            }

            if (!result) {
                return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
            }

            return NextResponse.json({ success: true, result });
        }

        if (action === "generate") {
            console.log(`🧠 Generating code for: ${prompt}`);
            let generatedCode = "";

            const codePrompt = `You are a Senior Solidity Smart Contract Architect with expertise in OpenZeppelin, security patterns, and gas optimization.

Generate a PRODUCTION-READY, DEPLOYABLE Solidity smart contract that is 100% correct and will compile without errors.

═══════════════════════════════════════════════════════════════════
CRITICAL DEPLOYMENT REQUIREMENTS (FAILURE = REJECTED):
═══════════════════════════════════════════════════════════════════

1. CONTRACT NAME: MUST be exactly 'GenContract' (case-sensitive)
   ✅ CORRECT: contract GenContract is ERC20, Ownable {
   ❌ WRONG: contract MyToken, contract TokenContract, contract Token

2. SOLIDITY VERSION: Use pragma solidity ^0.8.24;

3. CONSTRUCTOR: 
   - NO constructor parameters - hardcode ALL values
   - If token: hardcode name, symbol, supply
   - If user specifies values in prompt, use those exact values
   - Example: constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {

4. OPENZEPPELIN IMPORTS:
   ✅ Use: import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
   ❌ Never use: import "https://...", import "../node_modules/..."

5. MANDATORY ELEMENTS:
   - SPDX License: // SPDX-License-Identifier: MIT
   - Receive function: receive() external payable {}
   - NatSpec documentation for all public/external functions
   - Proper error handling with require/revert

6. SECURITY REQUIREMENTS:
   - Use OpenZeppelin's latest patterns (Ownable, ReentrancyGuard, etc.)
   - Include access control (onlyOwner or AccessControl)
   - Validate all inputs (address != 0, amount > 0, etc.)
   - Use SafeMath patterns (built-in 0.8.x or explicit checks)

7. CODE QUALITY:
   - Follow Solidity style guide
   - Use meaningful variable names
   - Include inline comments for complex logic
   - Emit events for state changes
   - Make functions external when possible (gas optimization)

═══════════════════════════════════════════════════════════════════
USER REQUIREMENTS:
═══════════════════════════════════════════════════════════════════
${prompt}

═══════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS:
═══════════════════════════════════════════════════════════════════
- Output ONLY pure Solidity code
- NO markdown, NO code blocks, NO explanations
- Start with // SPDX-License-Identifier: MIT
- Must compile with Hardhat + OpenZeppelin v5.x
- Must be immediately deployable

Generate the complete GenContract now:`;

            // Try Groq first
            if (GROQ_API_KEY) {
                try {
                    console.log("🤖 Using Groq API for code generation...");
                    generatedCode = await callGroqAPI(codePrompt, "You are a Solidity smart contract expert. Generate ONLY pure Solidity code with NO markdown formatting, NO explanations, NO code blocks.");
                } catch (error: any) {
                    console.log(`⚠️ Groq failed: ${error.message}, trying ChainGPT fallback...`);
                }
            }

            // Fallback to ChainGPT
            if (!generatedCode && CHAINGPT_API_KEY) {
                try {
                    generatedCode = await callChainGPTAPI("smart_contract_generator", codePrompt, userAddress);
                } catch (error) {
                    console.error("❌ ChainGPT also failed:", error);
                }
            }

            if (!generatedCode) {
                return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
            }

            // ═══════════════════════════════════════════════════════════
            // AUTO-FIX & VALIDATION ENGINE
            // ═══════════════════════════════════════════════════════════
            console.log("🔧 Running auto-fix validation...");
            
            // 1. Clean markdown artifacts
            generatedCode = generatedCode.replace(/```solidity/gi, "").replace(/```/g, "").trim();
            
            // 2. Fix SPDX License (must be commented)
            if (generatedCode.startsWith("SPDX-License-Identifier")) {
                generatedCode = "// " + generatedCode;
            }
            
            // 3. Ensure proper line breaks
            generatedCode = generatedCode.replace(/MITpragma/g, "MIT\npragma");
            generatedCode = generatedCode.replace(/;import/g, ";\nimport");
            
            // 4. Fix contract name if AI didn't follow instructions
            const contractNameRegex = /contract\s+(\w+)\s+(?:is\s+)?/;
            const match = generatedCode.match(contractNameRegex);
            if (match && match[1] !== "GenContract") {
                console.log(`⚠️ Auto-fixing contract name from '${match[1]}' to 'GenContract'`);
                generatedCode = generatedCode.replace(
                    new RegExp(`contract\\s+${match[1]}\\s+`, 'g'),
                    'contract GenContract '
                );
            }
            
            // 5. Ensure pragma is correct version
            if (!generatedCode.includes("pragma solidity ^0.8")) {
                console.log("⚠️ Fixing pragma version to ^0.8.24");
                generatedCode = generatedCode.replace(
                    /pragma solidity [^;]+;/,
                    "pragma solidity ^0.8.24;"
                );
            }
            
            // 6. Add receive function if missing (for tokens/payable contracts)
            if (!generatedCode.includes("receive()") && !generatedCode.includes("receive ()")) {
                console.log("⚠️ Adding missing receive() function");
                // Insert before final closing brace
                const lastBraceIndex = generatedCode.lastIndexOf("}");
                generatedCode = generatedCode.slice(0, lastBraceIndex) +
                    "\n    receive() external payable {}\n" +
                    generatedCode.slice(lastBraceIndex);
            }
            
            // 7. Validate OpenZeppelin imports format
            generatedCode = generatedCode.replace(
                /import\s+['"]https:\/\/[^'"]+openzeppelin[^'"]+['"]/gi,
                (match) => {
                    const pathMatch = match.match(/contracts\/([^'"]+)/);
                    if (pathMatch) {
                        return `import "@openzeppelin/contracts/${pathMatch[1]}"`;
                    }
                    return match;
                }
            );
            
            // 8. Add NatSpec if completely missing
            if (!generatedCode.includes("/**") && !generatedCode.includes("@dev") && !generatedCode.includes("@notice")) {
                const contractLineIndex = generatedCode.indexOf("contract GenContract");
                if (contractLineIndex > 0) {
                    const beforeContract = generatedCode.slice(0, contractLineIndex);
                    const afterContract = generatedCode.slice(contractLineIndex);
                    const natspec = `/**
 * @title GenContract
 * @dev ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}
 * @notice Built with SomniaStudio for Somnia Network
 */
`;
                    generatedCode = beforeContract + natspec + afterContract;
                }
            }

            // 9. Try to compile and catch errors
            let compileErrors: any[] = [];
            try {
                await compileSolidityServerless(generatedCode);
                console.log("✅ Generated code compiles successfully!");
            } catch (error: any) {
                console.log("⚠️ Generated code has compilation errors:", error.message);
                compileErrors = [{
                    message: error.message,
                    severity: "warning",
                    type: "CompilerError"
                }];
                
                // Try to auto-fix common issues
                if (error.message.includes("undeclared identifier") && error.message.includes("Ownable")) {
                    console.log("🔧 Attempting to fix Ownable import...");
                    if (!generatedCode.includes('@openzeppelin/contracts/access/Ownable.sol')) {
                        const lastImport = generatedCode.lastIndexOf('import "@openzeppelin');
                        if (lastImport > 0) {
                            const endOfLine = generatedCode.indexOf(';', lastImport) + 1;
                            generatedCode = generatedCode.slice(0, endOfLine) +
                                '\nimport "@openzeppelin/contracts/access/Ownable.sol";' +
                                generatedCode.slice(endOfLine);
                        }
                    }
                }
            }

            return NextResponse.json({ 
                success: true, 
                code: generatedCode,
                warnings: compileErrors.length > 0 ? compileErrors : undefined,
                autoFixed: true
            });
        }

        if (action === "audit") {
            console.log("🛡️ Auditing contract code...");
            let report = "";

            const auditPrompt = `You are a Senior Smart Contract Security Auditor with expertise in Solidity, DeFi exploits, and gas optimization.

Perform a COMPREHENSIVE SECURITY AUDIT on this smart contract:

═══════════════════════════════════════════════════════════════════
CONTRACT CODE:
═══════════════════════════════════════════════════════════════════
${code}

═══════════════════════════════════════════════════════════════════
AUDIT REQUIREMENTS - OUTPUT THIS EXACT STRUCTURE:
═══════════════════════════════════════════════════════════════════

## 🔴 CRITICAL ISSUES
[List any critical security vulnerabilities that could lead to loss of funds]
- Issue 1: [Description, line number, exploit scenario]
- Fix: [Exact code fix]

## 🟠 HIGH SEVERITY ISSUES
[Significant issues that could impact contract functionality]

## 🟡 MEDIUM SEVERITY ISSUES
[Issues that should be addressed but aren't immediately exploitable]

## 🟢 LOW SEVERITY / INFORMATIONAL
[Code quality, style, and minor improvements]

## ⛽ GAS OPTIMIZATIONS
[Specific gas-saving opportunities with estimated savings]
1. [Optimization]: Estimated savings: X gas
2. ...

## 🎯 SECURITY SCORE: X/10

## ✅ PRODUCTION READINESS
- [ ] Access Control: [Assessment]
- [ ] Reentrancy Protection: [Assessment]
- [ ] Integer Safety: [Assessment]
- [ ] Input Validation: [Assessment]
- [ ] Event Emissions: [Assessment]

## 📋 FINAL VERDICT
[Is this contract safe to deploy? What audit level is needed?]

═══════════════════════════════════════════════════════════════════

Provide detailed, actionable recommendations with exact line numbers and code fixes.`;

            // Try Groq first
            if (GROQ_API_KEY) {
                try {
                    console.log("🤖 Using Groq API for audit...");
                    report = await callGroqAPI(auditPrompt, "You are a Senior Smart Contract Security Auditor. Provide detailed, professional audit reports with specific vulnerabilities and fixes.");
                } catch (error) {
                    console.log("⚠️ Groq failed, trying ChainGPT fallback...");
                }
            }

            // Fallback to ChainGPT
            if (!report && CHAINGPT_API_KEY) {
                try {
                    report = await callChainGPTAPI("smart_contract_auditor", `Audit this Solidity code for security flaws:\n\n${code}`);
                } catch (error) {
                    console.error("❌ ChainGPT also failed:", error);
                }
            }

            if (!report) {
                return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
            }

            return NextResponse.json({ success: true, report });
        }

        // =========================================================
        // OPTIMIZE ACTION - Improve existing contract
        // =========================================================
        if (action === "optimize") {
            console.log("⚡ Optimizing contract...");
            let optimizedCode = "";

            const optimizePrompt = `You are a Gas Optimization Expert and Solidity Architect.

OPTIMIZE this smart contract for:
1. Gas efficiency
2. Security improvements
3. Best practices
4. Code quality

ORIGINAL CONTRACT:
${code}

OPTIMIZATION REQUIREMENTS:
- Keep the EXACT same functionality
- Maintain contract name as 'GenContract'
- Apply all gas optimizations (storage packing, external vs public, etc.)
- Add missing security features (ReentrancyGuard, input validation, etc.)
- Improve code structure and readability
- Add comprehensive NatSpec documentation
- Use latest OpenZeppelin patterns

OUTPUT ONLY the optimized Solidity code. NO explanations, NO markdown.`;

            if (GROQ_API_KEY) {
                try {
                    optimizedCode = await callGroqAPI(optimizePrompt, "You are a Solidity optimization expert. Output ONLY pure Solidity code.");
                } catch (error) {
                    console.log("⚠️ Groq failed for optimization");
                }
            }

            if (!optimizedCode && CHAINGPT_API_KEY) {
                try {
                    optimizedCode = await callChainGPTAPI("smart_contract_generator", optimizePrompt);
                } catch (error) {
                    console.error("❌ ChainGPT also failed");
                }
            }

            if (!optimizedCode) {
                return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
            }

            // Clean up
            optimizedCode = optimizedCode.replace(/```solidity/gi, "").replace(/```/g, "").trim();
            
            // Ensure SPDX
            if (optimizedCode.startsWith("SPDX-License-Identifier")) {
                optimizedCode = "// " + optimizedCode;
            }

            return NextResponse.json({ 
                success: true, 
                code: optimizedCode,
                message: "Contract optimized for gas efficiency and security"
            });
        }

        // =========================================================
        // COMPILE ACTION - For IDE compilation
        // =========================================================
        if (action === "compile") {
            console.log("🔨 Compiling contract code...");
            
            try {
                const { abi, bytecode } = await compileSolidity(code);
                
                return NextResponse.json({
                    success: true,
                    abi,
                    bytecode,
                    contractSize: bytecode.length / 2
                });
            } catch (error: any) {
                console.error("❌ Compilation failed:", error.message);
                
                // Parse error details
                const errorMessage = error.message || "Unknown compilation error";
                const errors = [{
                    message: errorMessage,
                    severity: "error",
                    type: "CompilerError"
                }];
                
                return NextResponse.json({
                    success: false,
                    errors,
                    message: errorMessage
                });
            }
        }

        // =========================================================
        // FIX ACTION - Automatically repair broken contracts
        // =========================================================
        if (action === "fix") {
            console.log("🔧 Auto-fixing contract issues...");
            
            const { errors } = body;
            let fixedCode = "";
            
            const errorMessages = errors.map((e: any) => e.message).join("\n");
            
            const fixPrompt = `You are a Solidity Debugger and Fixer Expert.

FIX this broken smart contract. The code has compilation errors that must be resolved.

BROKEN CONTRACT:
${code}

COMPILATION ERRORS:
${errorMessages}

FIX REQUIREMENTS:
1. Resolve ALL compilation errors
2. Maintain the EXACT same functionality
3. Keep contract name as 'GenContract'
4. Use correct OpenZeppelin imports (@openzeppelin/contracts/...)
5. Ensure pragma solidity ^0.8.24
6. Add any missing imports or dependencies
7. Fix syntax errors, type mismatches, undeclared identifiers
8. Ensure all functions have proper visibility
9. Add receive() function if missing

OUTPUT ONLY the corrected Solidity code that compiles without errors. NO explanations, NO markdown.`;

            if (GROQ_API_KEY) {
                try {
                    fixedCode = await callGroqAPI(fixPrompt, "You are a Solidity error-fixing expert. Output ONLY pure, corrected Solidity code.");
                } catch (error) {
                    console.log("⚠️ Groq failed for fix");
                }
            }

            if (!fixedCode && CHAINGPT_API_KEY) {
                try {
                    fixedCode = await callChainGPTAPI("smart_contract_generator", fixPrompt);
                } catch (error) {
                    console.error("❌ ChainGPT also failed");
                }
            }

            if (!fixedCode) {
                return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
            }

            // Clean up
            fixedCode = fixedCode.replace(/```solidity/gi, "").replace(/```/g, "").trim();
            if (fixedCode.startsWith("SPDX-License-Identifier")) {
                fixedCode = "// " + fixedCode;
            }

            // Validate the fix
            try {
                await compileSolidityServerless(fixedCode);
                console.log("✅ Fixed code compiles successfully!");
                
                return NextResponse.json({ 
                    success: true, 
                    code: fixedCode,
                    message: "All errors fixed! Contract now compiles successfully."
                });
            } catch (error: any) {
                console.log("⚠️ Fixed code still has issues:", error.message);
                
                return NextResponse.json({ 
                    success: true, 
                    code: fixedCode,
                    message: "Attempted fixes applied, but some issues may remain. Please review.",
                    warnings: [{ message: error.message }]
                });
            }
        }

        // =========================================================
        // EXPLAIN ERROR ACTION - AI-powered error explanations
        // =========================================================
        if (action === "explain_error") {
            console.log("🤖 Generating error explanation...");
            
            const { errors } = body;
            const errorMessages = errors.map((e: any) => e.message).join("\n");
            
            const explainPrompt = `You are a Solidity expert teacher. A developer has the following compilation errors:

ERRORS:
${errorMessages}

CODE:
${code}

Provide:
1. A clear, friendly explanation of what went wrong (2-3 sentences)
2. The exact fix with code snippet
3. A brief lesson on why this error happens and how to avoid it

Format your response as JSON:
{
  "explanation": "...",
  "fix": "...",
  "teachMode": {
    "title": "...",
    "steps": ["step1", "step2", "step3"]
  }
}`;

            let result = "";
            
            if (GROQ_API_KEY) {
                try {
                    result = await callGroqAPI(explainPrompt, "You are a friendly Solidity teacher. Explain errors clearly and help developers learn. Always respond with valid JSON.");
                } catch (error) {
                    console.log("⚠️ Groq failed for error explanation");
                }
            }
            
            if (!result && CHAINGPT_API_KEY) {
                try {
                    result = await callChainGPTAPI("general_assistant", explainPrompt, userAddress);
                } catch (error) {
                    console.error("❌ ChainGPT also failed");
                }
            }
            
            if (!result) {
                return NextResponse.json({ 
                    success: true, 
                    explanation: "Unable to generate explanation. Please check the error message above.",
                    teachMode: null
                });
            }
            
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(result);
                return NextResponse.json({
                    success: true,
                    explanation: parsed.explanation,
                    fix: parsed.fix,
                    teachMode: parsed.teachMode
                });
            } catch {
                // If not valid JSON, return as plain text
                return NextResponse.json({
                    success: true,
                    explanation: result,
                    teachMode: null
                });
            }
        }

        if (action === "deploy") {
            const isMainnet = network === "mainnet";
            const targetRpc = isMainnet ? RPC_MAINNET : RPC_TESTNET;
            const chain = isMainnet ? somniaMainnet : somniaTestnet;

            console.log(`🚀 Preparing Deployment to ${chain.name}...`);

            // 🛡️ POLICY CHECK: SPEND CAP
            const SPEND_CAP_STT = 0.05;

            try {
                const gasPriceRes = await fetch(targetRpc, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 1 })
                });
                const gasJson = await gasPriceRes.json();
                const gasPriceWei = parseInt(gasJson.result, 16);
                const estimatedCostSTT = (gasPriceWei * 3000000) / 10 ** 18;

                console.log(`💰 Estimated Gas Cost: ${estimatedCostSTT.toFixed(5)} STT/SOMI`);

                if (estimatedCostSTT > SPEND_CAP_STT) {
                    return NextResponse.json({
                        error: `❌ Policy Violation: Spend Cap Exceeded. Cost: ${estimatedCostSTT.toFixed(4)} STT/SOMI.`
                    }, { status: 403 });
                }
            } catch (e) {
                console.error("Gas estimation failed, proceeding with caution.");
            }

            // SERVERLESS-COMPATIBLE DEPLOY using solc + viem
            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) {
                return NextResponse.json({ error: "Server Error: Missing PRIVATE_KEY" }, { status: 500 });
            }

            try {
                // 1. Run security analysis before deployment
                console.log("🛡️ Running security analysis...");
                const securityCheck = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/security`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code })
                });
                
                const securityResult = await securityCheck.json();
                
                if (securityResult.success && securityResult.analysis) {
                    const { riskLevel, summary } = securityResult.analysis;
                    
                    // Block deployment if critical issues found
                    if (summary.critical > 0) {
                        return NextResponse.json({
                            error: "🛑 Deployment blocked: Critical security vulnerabilities detected",
                            securityAnalysis: securityResult.analysis,
                            message: "Please fix critical issues before deploying"
                        }, { status: 403 });
                    }
                    
                    // Warn about high severity issues
                    if (summary.high > 0) {
                        console.log(`⚠️ Warning: ${summary.high} high severity issue(s) detected`);
                    }
                    
                    console.log(`✓ Security analysis complete: ${riskLevel}`);
                }
                
                // 2. Compile the contract using solc
                console.log("📦 Compiling contract...");
                const { abi, bytecode } = await compileSolidity(code);

                // 2. Create viem clients
                const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey as `0x${string}` : `0x${privateKey}`);
                
                const publicClient = createPublicClient({
                    chain,
                    transport: http(targetRpc),
                });

                const walletClient = createWalletClient({
                    account,
                    chain,
                    transport: http(targetRpc),
                });

                // 3. Deploy the contract
                console.log("🚀 Deploying contract...");
                const hash = await walletClient.deployContract({
                    abi,
                    bytecode: bytecode as `0x${string}`,
                    args: [],
                });

                console.log(`📝 Transaction hash: ${hash}`);

                // 4. Wait for transaction receipt
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                const address = receipt.contractAddress;

                console.log(`✅ Contract deployed to: ${address}`);

                // 5. Record deployment analytics
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/analytics`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            address,
                            contractName: "GenContract",
                            deployer: userAddress,
                            network: isMainnet ? "mainnet" : "testnet",
                            gasUsed: receipt.gasUsed?.toString(),
                            txHash: hash,
                            timestamp: new Date().toISOString()
                        })
                    });
                } catch (analyticsError) {
                    console.error("Failed to record analytics:", analyticsError);
                    // Don't fail deployment if analytics fails
                }

                return NextResponse.json({ 
                    success: true, 
                    address, 
                    logs: `Contract deployed to: ${address}\nTransaction hash: ${hash}`,
                    gasUsed: receipt.gasUsed?.toString()
                });
            } catch (error: any) {
                console.error("❌ Deployment failed:", error);
                return NextResponse.json({ error: error.message || "Deployment Failed" }, { status: 500 });
            }
        }

        if (action === "transfer") {
            console.log(`💸 Funding Contract: ${toAddress} with ${amount} STT/SOMI`);
            const isMainnet = network === "mainnet";
            const targetRpc = isMainnet ? RPC_MAINNET : RPC_TESTNET;
            const chain = isMainnet ? somniaMainnet : somniaTestnet;

            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) {
                return NextResponse.json({ error: "Server Error: Missing PRIVATE_KEY" }, { status: 500 });
            }

            try {
                const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey as `0x${string}` : `0x${privateKey}`);
                
                const publicClient = createPublicClient({
                    chain,
                    transport: http(targetRpc),
                });

                const walletClient = createWalletClient({
                    account,
                    chain,
                    transport: http(targetRpc),
                });

                const hash = await walletClient.sendTransaction({
                    to: toAddress as `0x${string}`,
                    value: BigInt(Math.floor(parseFloat(amount) * 10 ** 18)),
                });

                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                
                return NextResponse.json({ success: true, txHash: hash });
            } catch (error: any) {
                return NextResponse.json({ error: error.message || "Transfer Failed" }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}