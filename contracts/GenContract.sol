// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GenContract is ERC20, Ownable, ReentrancyGuard {
    uint256 public rewardRate = 100;
    
    constructor() ERC20("GenToken", "GTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    receive() external payable {}
}