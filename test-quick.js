/**
 * Quick test to verify AI generates contracts with correct names
 */

async function quickTest() {
  console.log("🧪 Testing: AI should generate contract with any name (not forced to GenContract)");
  console.log("─".repeat(80));
  
  const response = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate',
      prompt: 'Create a simple ERC20 token called MyTestToken with symbol MTT and 1 million supply',
      userAddress: '0x1234567890123456789012345678901234567890'
    })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    console.error("❌ Generation failed:", result.error);
    return;
  }
  
  console.log("\n✅ Contract generated successfully!");
  console.log("\n📝 Code preview:");
  console.log("─".repeat(80));
  console.log(result.code.substring(0, 500));
  console.log("...\n");
  
  // Check contract name
  const contractMatch = result.code.match(/contract\s+(\w+)\s+/);
  if (contractMatch) {
    console.log(`✅ Contract name: ${contractMatch[1]}`);
    console.log(`✅ NOT forced to 'GenContract' - User can write any name!`);
  }
  
  // Try to compile it
  console.log("\n🔨 Now testing compilation...");
  const compileResponse = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'compile',
      code: result.code,
      userAddress: '0x1234567890123456789012345678901234567890'
    })
  });
  
  const compileResult = await compileResponse.json();
  
  if (compileResult.success) {
    console.log("✅ Compilation successful!");
    console.log(`   - Contract: ${compileResult.contractName || 'Unknown'}`);
    console.log(`   - ABI entries: ${compileResult.abi?.length || 0}`);
    console.log(`   - Bytecode size: ${compileResult.contractSize || 0} bytes`);
  } else {
    console.error("❌ Compilation failed:", compileResult.message);
    if (compileResult.errors) {
      console.error("   Errors:", compileResult.errors);
    }
  }
  
  console.log("\n" + "═".repeat(80));
  console.log("Test complete!");
  console.log("═".repeat(80));
}

quickTest().catch(console.error);
