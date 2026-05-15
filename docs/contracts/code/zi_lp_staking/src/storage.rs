use soroban_sdk::{contracttype, Address};

// ── Storage key namespace ────────────────────────────────────────────────────

/// All persistent storage keys used by the contract.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Contract admin (can set reward rate, pause, update LP token)
    Admin,
    /// The SEP-41 token used for rewards (Zi SAC or contract address)
    RewardToken,
    /// The LP token contract address stakers must deposit
    LpToken,
    /// Total LP tokens currently held by the contract
    TotalStaked,
    /// Accumulated reward per LP token (scaled by PRECISION), updated on every
    /// mutating call (stake / unstake / claim / fund_rewards)
    RewardPerTokenStored,
    /// Timestamp (ledger timestamp seconds) of the last time reward state was
    /// updated
    LastUpdateTime,
    /// Zi reward tokens per second emitted to all stakers.
    /// Admin sets this when funding the pool.  Formula:
    ///   reward_rate = annual_reward_budget / SECONDS_PER_YEAR
    RewardRate,
    /// Unix timestamp at which the current reward period ends.
    /// Rewards stop accruing after this point until the pool is topped up.
    PeriodFinish,
    /// Total Zi tokens held in the reward pool (unfunded balance tracking)
    RewardPool,
    /// Whether the contract is paused (emergency use only)
    Paused,
    /// Per-staker state
    Staker(Address),
}

// ── Per-staker record ────────────────────────────────────────────────────────

/// Stored for every address that stakes.
#[contracttype]
#[derive(Clone)]
pub struct StakerInfo {
    /// Amount of LP tokens currently staked.
    pub staked: i128,
    /// Snapshot of `reward_per_token_stored` at the time of the last update
    /// for this staker.  Used to compute newly accrued rewards.
    pub reward_per_token_paid: i128,
    /// Rewards accrued but not yet claimed.
    pub pending_rewards: i128,
    /// Unix timestamp (seconds) when the lock expires.
    /// Set to `env.ledger().timestamp() + LOCK_PERIOD` on `stake()`.
    /// A staker may only `unstake()` once this has passed.
    pub unlock_time: u64,
}

impl Default for StakerInfo {
    fn default() -> Self {
        StakerInfo {
            staked: 0,
            reward_per_token_paid: 0,
            pending_rewards: 0,
            unlock_time: 0,
        }
    }
}
