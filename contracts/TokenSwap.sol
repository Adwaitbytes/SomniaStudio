// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenSwap is ERC20, Ownable, ReentrancyGuard, Pausable {
    mapping(address => mapping(address => uint256)) public liquidityPools;
    uint256 public constant TRADING_FEE = 3; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;

    event LiquidityAdded(address token, uint256 amount);
    event LiquidityRemoved(address token, uint256 amount);
    event Swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    constructor() ERC20("TokenSwap", "TSP") Ownable(msg.sender) {}

    /**
     * @notice Add liquidity to the pool
     * @param token The token to add liquidity for
     * @param amount The amount of liquidity to add
     */
    function addLiquidity(address token, uint256 amount) external whenNotPaused {
        require(token != address(0), "Token cannot be zero address");
        require(amount > 0, "Amount must be greater than zero");
        liquidityPools[msg.sender][token] += amount;
        emit LiquidityAdded(token, amount);
    }

    /**
     * @notice Remove liquidity from the pool
     * @param token The token to remove liquidity for
     * @param amount The amount of liquidity to remove
     */
    function removeLiquidity(address token, uint256 amount) external whenNotPaused {
        require(token != address(0), "Token cannot be zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(liquidityPools[msg.sender][token] >= amount, "Not enough liquidity");
        liquidityPools[msg.sender][token] -= amount;
        emit LiquidityRemoved(token, amount);
    }

    /**
     * @notice Swap tokens
     * @param tokenIn The token to swap from
     * @param tokenOut The token to swap to
     * @param amountIn The amount of tokens to swap
     * @return amountOut The amount of tokens received
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn) external whenNotPaused nonReentrant returns (uint256) {
        require(tokenIn != address(0), "TokenIn cannot be zero address");
        require(tokenOut != address(0), "TokenOut cannot be zero address");
        require(amountIn > 0, "AmountIn must be greater than zero");
        // Calculate the trading fee
        uint256 fee = (amountIn * TRADING_FEE) / FEE_DENOMINATOR;
        // Calculate the amount out
        uint256 amountOut = amountIn - fee;
        // Update the liquidity pool
        liquidityPools[msg.sender][tokenIn] += amountIn;
        liquidityPools[msg.sender][tokenOut] -= amountOut;
        // Emit the swap event
        emit Swap(tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    receive() external payable {}
}