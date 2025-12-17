// SPDX-License-Identifier: MIT
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
