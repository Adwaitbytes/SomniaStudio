// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MyToken (Optimized & Secured)
 * @dev Mintable ERC20 token with security enhancements:
 * - Supply cap to prevent unlimited inflation
 * - Role-based access control for decentralized governance
 * - Pausability for emergency stops
 * - Gas optimizations applied
 * @notice Built with SomniaStudio for Somnia Network
 */
contract MyTokenOptimized is ERC20Capped, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Custom errors (gas optimization)
    error InvalidMintAmount();
    error MintToZeroAddress();
    
    /**
     * @dev Constructor mints initial supply and sets up roles
     * @notice Max supply capped at 10M tokens
     */
    constructor() 
        ERC20("My Somnia Token", "MST")
        ERC20Capped(10_000_000e18) // 10M max supply
    {
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        // Mint initial supply: 1M tokens (gas optimized)
        _mint(msg.sender, 1_000_000e18);
    }
    
    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert MintToZeroAddress();
        if (amount == 0) revert InvalidMintAmount();
        _mint(to, amount);
    }
    
    /**
     * @dev Pause all token transfers (only PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers (only PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, amount);
    }
}
