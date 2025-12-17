/**
 * AI Contract Generator Test Suite
 * Tests the quality and deployability of AI-generated contracts
 */

const testPrompts = [
  // ERC20 Token Tests
  {
    category: "ERC20",
    prompt: "Create an ERC20 token named 'TestToken' with symbol 'TEST' and 1 million initial supply",
    expectedFeatures: ["ERC20", "Ownable", "mint", "decimals", "totalSupply"],
    mustCompile: true
  },
  {
    category: "ERC20",
    prompt: "Build a burnable ERC20 token with 10 million supply and pausability",
    expectedFeatures: ["ERC20Burnable", "Pausable", "burn", "pause", "unpause"],
    mustCompile: true
  },
  
  // ERC721 NFT Tests
  {
    category: "ERC721",
    prompt: "Create an NFT collection with max supply of 1000 and metadata URI storage",
    expectedFeatures: ["ERC721", "safeMint", "tokenURI", "maxSupply"],
    mustCompile: true
  },
  
  // DeFi Tests
  {
    category: "DeFi",
    prompt: "Build a staking contract where users stake tokens and earn rewards over time",
    expectedFeatures: ["stake", "withdraw", "claimRewards", "ReentrancyGuard"],
    mustCompile: true
  },
  
  // DAO Tests
  {
    category: "Governance",
    prompt: "Create a simple DAO with proposal creation and voting mechanism",
    expectedFeatures: ["createProposal", "vote", "executeProposal"],
    mustCompile: true
  },
  
  // Complex Tests
  {
    category: "Advanced",
    prompt: "Build a token swap contract with liquidity pools and 0.3% trading fee",
    expectedFeatures: ["swap", "addLiquidity", "removeLiquidity"],
    mustCompile: true
  }
];

async function testContractGeneration(prompt, expectedFeatures = [], mustCompile = true) {
  console.log(`\n🧪 Testing: "${prompt}"`);
  console.log("─".repeat(80));
  
  try {
    // 1. Generate contract
    console.log("1️⃣ Generating contract...");
    const generateResponse = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prompt: prompt,
        userAddress: '0x1234567890123456789012345678901234567890' // Test address
      })
    });
    
    const generateResult = await generateResponse.json();
    
    if (!generateResult.success) {
      console.error("❌ Generation failed:", generateResult.error);
      return { success: false, stage: 'generate', error: generateResult.error };
    }
    
    const code = generateResult.code;
    console.log("✅ Contract generated");
    console.log(`   - Length: ${code.length} characters`);
    console.log(`   - Lines: ${code.split('\n').length}`);
    
    // 2. Validate contract name (extract it)
    console.log("\n2️⃣ Extracting contract name...");
    const contractMatch = code.match(/contract\s+(\w+)\s+/);
    if (!contractMatch) {
      console.error("❌ No contract declaration found");
      return { success: false, stage: 'validate_name', error: 'No contract found' };
    }
    const contractName = contractMatch[1];
    console.log(`✅ Contract name: ${contractName}`);
    
    // 3. Check expected features
    console.log("\n3️⃣ Checking expected features...");
    let missingFeatures = [];
    for (const feature of expectedFeatures) {
      if (!code.includes(feature)) {
        missingFeatures.push(feature);
      }
    }
    
    if (missingFeatures.length > 0) {
      console.warn(`⚠️  Missing features: ${missingFeatures.join(', ')}`);
    } else if (expectedFeatures.length > 0) {
      console.log("✅ All expected features present");
    }
    
    // 4. Check mandatory elements
    console.log("\n4️⃣ Checking mandatory elements...");
    const checks = [
      { name: 'SPDX License', regex: /\/\/\s*SPDX-License-Identifier/ },
      { name: 'Pragma version', regex: /pragma solidity \^0\.8/ },
      { name: 'Receive function', regex: /receive\s*\(\s*\)\s*external\s+payable/ },
      { name: 'OpenZeppelin imports', regex: /@openzeppelin\/contracts/ }
    ];
    
    let passed = 0;
    for (const check of checks) {
      if (check.regex.test(code)) {
        console.log(`   ✅ ${check.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${check.name}`);
      }
    }
    
    // 5. Compile contract
    console.log("\n5️⃣ Compiling contract...");
    const compileResponse = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'compile',
        code: code,
        userAddress: '0x1234567890123456789012345678901234567890'
      })
    });
    
    const compileResult = await compileResponse.json();
    
    if (!compileResult.success) {
      if (mustCompile) {
        console.error("❌ Compilation failed (CRITICAL)");
        console.error("   Errors:", compileResult.errors);
        return { success: false, stage: 'compile', error: compileResult.message, code };
      } else {
        console.warn("⚠️  Compilation failed (expected for complex contracts)");
        return { success: true, stage: 'compile', warning: 'Compilation issues', code };
      }
    }
    
    console.log("✅ Contract compiled successfully");
    console.log(`   - ABI entries: ${compileResult.abi.length}`);
    console.log(`   - Bytecode size: ${compileResult.contractSize} bytes`);
    
    if (compileResult.contractSize > 24576) {
      console.warn(`   ⚠️  Contract size exceeds 24KB limit (${(compileResult.contractSize / 1024).toFixed(2)}KB)`);
    }
    
    // 6. Security quick check
    console.log("\n6️⃣ Quick security scan...");
    const securityIssues = [];
    
    if (!code.includes('onlyOwner') && !code.includes('AccessControl')) {
      securityIssues.push('No access control');
    }
    if (code.includes('selfdestruct')) {
      securityIssues.push('Uses selfdestruct (risky)');
    }
    if (code.includes('.call{value:') && !code.includes('ReentrancyGuard')) {
      securityIssues.push('External calls without reentrancy guard');
    }
    
    if (securityIssues.length > 0) {
      console.warn(`   ⚠️  Potential issues: ${securityIssues.join(', ')}`);
    } else {
      console.log("   ✅ No obvious security issues");
    }
    
    // Success summary
    console.log("\n" + "═".repeat(80));
    console.log("🎉 TEST PASSED");
    console.log("═".repeat(80));
    
    return {
      success: true,
      code,
      abi: compileResult.abi,
      bytecode: compileResult.bytecode,
      stats: {
        codeLength: code.length,
        lines: code.split('\n').length,
        abiEntries: compileResult.abi.length,
        bytecodeSize: compileResult.contractSize,
        missingFeatures,
        securityIssues
      }
    };
    
  } catch (error) {
    console.error("❌ Test failed with exception:", error.message);
    return { success: false, stage: 'exception', error: error.message };
  }
}

async function runTestSuite() {
  console.log("🚀 AI Contract Generator Test Suite");
  console.log("═".repeat(80));
  console.log(`Testing ${testPrompts.length} contract generation scenarios`);
  console.log("═".repeat(80));
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of testPrompts) {
    const result = await testContractGeneration(
      test.prompt,
      test.expectedFeatures,
      test.mustCompile
    );
    
    results.push({
      category: test.category,
      prompt: test.prompt,
      ...result
    });
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final report
  console.log("\n\n");
  console.log("═".repeat(80));
  console.log("📊 FINAL REPORT");
  console.log("═".repeat(80));
  console.log(`Total Tests: ${testPrompts.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testPrompts.length) * 100).toFixed(1)}%`);
  console.log("═".repeat(80));
  
  // Category breakdown
  const categories = {};
  for (const result of results) {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, failed: 0 };
    }
    if (result.success) {
      categories[result.category].passed++;
    } else {
      categories[result.category].failed++;
    }
  }
  
  console.log("\n📋 Results by Category:");
  for (const [category, stats] of Object.entries(categories)) {
    const total = stats.passed + stats.failed;
    const rate = ((stats.passed / total) * 100).toFixed(0);
    console.log(`   ${category}: ${stats.passed}/${total} (${rate}%)`);
  }
  
  // Failed tests details
  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    for (const result of results) {
      if (!result.success) {
        console.log(`\n   Category: ${result.category}`);
        console.log(`   Prompt: "${result.prompt}"`);
        console.log(`   Failed at: ${result.stage}`);
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  console.log("\n" + "═".repeat(80));
  console.log("Test suite complete!");
  console.log("═".repeat(80));
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testContractGeneration, runTestSuite, testPrompts };
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTestSuite().catch(console.error);
}
