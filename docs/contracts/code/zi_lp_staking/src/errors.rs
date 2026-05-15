use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// `init()` has already been called
    AlreadyInitialized = 1,
    /// Caller is not the contract admin
    NotAdmin = 2,
    /// Amount must be greater than zero
    ZeroAmount = 3,
    /// Staker has no staked balance
    NothingStaked = 4,
    /// Lock period has not expired yet — unstake is blocked
    LockNotExpired = 5,
    /// Reward pool has insufficient Zi to cover new rewards for the period
    InsufficientRewardPool = 6,
    /// Contract is paused; all user actions are blocked
    ContractPaused = 7,
    /// Attempted to fund with zero Zi
    ZeroFundAmount = 8,
    /// LP token address has not been configured
    LpTokenNotSet = 9,
    /// Reward token address has not been configured
    RewardTokenNotSet = 10,
    /// Integer overflow in reward calculation (should never happen in practice)
    Overflow = 11,
}
