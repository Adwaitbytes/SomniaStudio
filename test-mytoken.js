// Test that MyToken.sol compiles correctly
async function testMyToken() {
  console.log("🧪 Testing MyToken.sol compilation");
  console.log("─".repeat(80));
  
  const myTokenCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Somnia Token", "MST") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}`;

  console.log("\n🔨 Compiling MyToken.sol...\n");
  
  const response = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'compile',
      code: myTokenCode,
      userAddress: '0xa4fa024fac779dbc7b99f146de68bff4a8c7bb32'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log("✅ COMPILATION SUCCESSFUL!");
    console.log(`   - Contract: ${result.contractName || 'MyToken'}`);
    console.log(`   - ABI entries: ${result.abi?.length || 0}`);
    console.log(`   - Bytecode size: ${result.contractSize || 0} bytes`);
    console.log("\n" + "═".repeat(80));
    console.log("🎉 LOCALHOST WORKS PERFECTLY!");
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

testMyToken().catch(console.error);
