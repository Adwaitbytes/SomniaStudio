// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenStaking
 * @notice Users can stake ERC20 tokens and earn rewards over time
 */
contract TokenStaking is Ownable, ReentrancyGuard {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate; // rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public totalStaked;

    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_rewardRate > 0, "Invalid reward rate");

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Updates global and user-specific reward data
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @notice Calculates reward per staked token
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) /
            totalStaked;
    }

    /**
     * @notice Returns total rewards earned by a user
     */
    function earned(address account) public view returns (uint256) {
        return
            ((userStaked[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    /**
     * @notice Stake tokens to start earning rewards
     */
    function stake(uint256 amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Cannot stake zero");

        totalStaked += amount;
        userStaked[msg.sender] += amount;

        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Stake transfer failed"
        );

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Withdraw staked tokens
     */
    function withdraw(uint256 amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Cannot withdraw zero");
        require(userStaked[msg.sender] >= amount, "Insufficient stake");

        totalStaked -= amount;
        userStaked[msg.sender] -= amount;

        require(
            stakingToken.transfer(msg.sender, amount),
            "Withdraw transfer failed"
        );

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimReward()
        external
        nonReentrant
        updateReward(msg.sender)
    {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards");

        rewards[msg.sender] = 0;
        require(
            rewardToken.transfer(msg.sender, reward),
            "Reward transfer failed"
        );

        emit RewardPaid(msg.sender, reward);
    }

    /**
     * @notice Withdraw staked tokens and claim rewards
     */
    function exit() external {
        withdraw(userStaked[msg.sender]);
        claimReward();
    }

    /**
     * @notice Owner can update reward rate
     */
    function setRewardRate(uint256 newRate)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(newRate > 0, "Invalid rate");
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @notice Accept ETH if needed for future extensions
     */
    receive() external payable {}
}
