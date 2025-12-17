// Test contract with OLD OpenZeppelin v4 imports (should auto-fix)
const testContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GenContract is ERC20, Ownable, ReentrancyGuard {
    uint256 public rewardRate = 100;
    
    constructor() ERC20("GenToken", "GTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    receive() external payable {}
}`;

async function testCompile() {
  console.log("🧪 Testing OpenZeppelin v5 import auto-fix");
  console.log("─".repeat(80));
  console.log("\n📝 Contract has OLD import:");
  console.log('   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";');
  console.log("\n🔨 Compiling...\n");
  
  const response = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'compile',
      code: testContract,
      userAddress: '0xa4fa024fac779dbc7b99f146de68bff4a8c7bb32'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log("✅ COMPILATION SUCCESSFUL!");
    console.log(`   - Contract: ${result.contractName || 'GenContract'}`);
    console.log(`   - ABI entries: ${result.abi?.length || 0}`);
    console.log(`   - Bytecode size: ${result.contractSize || 0} bytes`);
    
    if (result.code) {
      console.log("\n✅ Auto-fix was applied!");
      console.log("   Old: @openzeppelin/contracts/security/ReentrancyGuard.sol");
      console.log("   New: @openzeppelin/contracts/utils/ReentrancyGuard.sol");
    }
    
    console.log("\n" + "═".repeat(80));
    console.log("🎉 TEST PASSED - Import auto-fix works!");
    console.log("═".repeat(80));
  } else {
    console.error("❌ COMPILATION FAILED");
    console.error("   Error:", result.message);
    if (result.errors) {
      result.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    console.log("\n" + "═".repeat(80));
    console.log("❌ TEST FAILED");
    console.log("═".repeat(80));
  }
}

testCompile().catch(console.error);
