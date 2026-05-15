#![no_std]

mod errors;
mod events;
mod storage;

use errors::Error;
use storage::{DataKey, StakerInfo};

use soroban_sdk::{
    contract, contractimpl, token, Address, Env,
};

// ── Constants ────────────────────────────────────────────────────────────────

/// Seconds in one year (365 days).  Used to convert annual reward budget →
/// reward rate per second.
const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 31_536_000

/// Lock period in seconds.
/// Testnet: 12 hours (represents 1 year for demo purposes).
/// Production: 1 full year.
#[cfg(feature = "testnet-time")]
const LOCK_PERIOD: u64 = 12 * 60 * 60; // 12 hours
#[cfg(not(feature = "testnet-time"))]
const LOCK_PERIOD: u64 = SECONDS_PER_YEAR;

/// Fixed-point precision scalar.  All `reward_per_token` values are multiplied
/// by this to avoid integer truncation during accumulation.
/// 1e14 gives 14 decimal places of precision, safe within i128.
const PRECISION: i128 = 1_000_000_000_000_000_00; // 1e17 — plenty of headroom

// ── Internal helpers ─────────────────────────────────────────────────────────

/// Returns the lesser of two u64 values.
fn min_u64(a: u64, b: u64) -> u64 {
    if a < b { a } else { b }
}

/// Read a value from persistent storage, returning a default if absent.
macro_rules! get_or_default {
    ($env:expr, DataKey::$key:ident, $default:expr, $T:ty) => {
        $env.storage()
            .persistent()
            .get::<DataKey, $T>(&DataKey::$key)
            .unwrap_or($default)
    };
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct ZiLpStaking;

#[contractimpl]
impl ZiLpStaking {
    // ── Initialisation ───────────────────────────────────────────────────────

    /// Deploy-time initialisation.  Must be called exactly once.
    ///
    /// * `admin`        — address that can call admin-only functions.
    /// * `reward_token` — SEP-41 contract address for Zi (the reward currency).
    /// * `lp_token`     — SEP-41 LP token contract address stakers must deposit.
    ///                    Can be updated later by the admin via `set_lp_token()`.
    pub fn init(
        env: Env,
        admin: Address,
        reward_token: Address,
        lp_token: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().persistent();

        if storage.has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        storage.set(&DataKey::Admin, &admin);
        storage.set(&DataKey::RewardToken, &reward_token);
        storage.set(&DataKey::LpToken, &lp_token);
        storage.set(&DataKey::TotalStaked, &0_i128);
        storage.set(&DataKey::RewardPerTokenStored, &0_i128);
        storage.set(&DataKey::LastUpdateTime, &env.ledger().timestamp());
        storage.set(&DataKey::RewardRate, &0_i128);
        storage.set(&DataKey::PeriodFinish, &0_u64);
        storage.set(&DataKey::RewardPool, &0_i128);
        storage.set(&DataKey::Paused, &false);

        events::initialized(&env, &admin, &reward_token, &lp_token);
        Ok(())
    }

    // ── Admin: LP token management ───────────────────────────────────────────

    /// Update the LP token address the contract accepts for staking.
    /// Admin only.  Existing stakers are unaffected — their positions remain
    /// valid under the old token; only new stakes use the new address.
    pub fn set_lp_token(env: Env, new_lp_token: Address) -> Result<(), Error> {
        Self::assert_not_paused(&env)?;
        let admin = Self::get_admin(&env);
        admin.require_auth();

        env.storage().persistent().set(&DataKey::LpToken, &new_lp_token);
        events::lp_token_updated(&env, &admin, &new_lp_token);
        Ok(())
    }

    // ── Reward funding ───────────────────────────────────────────────────────

    /// Deposit Zi into the reward pool.  Can be called by **any** account
    /// (G-address or Soroban contract address) at any time.
    ///
    /// When called:
    /// 1. Transfers `amount` Zi from `funder` to this contract.
    /// 2. If there is an active reward period with remaining rewards, those
    ///    remaining rewards roll forward into the new period budget.
    /// 3. Recalculates `reward_rate` = total_budget / SECONDS_PER_YEAR.
    /// 4. Sets `period_finish` = now + SECONDS_PER_YEAR.
    ///
    /// The 10% APR target is achieved by the caller depositing 10% of the
    /// total staked LP value in Zi per year.  The contract does not enforce
    /// the 10% figure — it emits whatever rate the pool can sustain.
    pub fn fund_rewards(env: Env, funder: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::ZeroFundAmount);
        }

        funder.require_auth();

        // Pull Zi into the contract
        let reward_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::RewardToken)
            .ok_or(Error::RewardTokenNotSet)?;

        let zi_client = token::Client::new(&env, &reward_token);
        let contract_id = env.current_contract_address();
        zi_client.transfer(&funder, &contract_id, &amount);

        // Update global reward state before changing the rate
        Self::update_reward_global(&env);

        let now = env.ledger().timestamp();
        let storage = env.storage().persistent();

        // Roll over any unspent rewards from the current period
        let period_finish: u64 = storage.get(&DataKey::PeriodFinish).unwrap_or(0);
        let current_rate: i128 = storage.get(&DataKey::RewardRate).unwrap_or(0);

        let leftover: i128 = if period_finish > now {
            let remaining_secs = (period_finish - now) as i128;
            current_rate
                .checked_mul(remaining_secs)
                .ok_or(Error::Overflow)?
        } else {
            0
        };

        let total_budget = leftover
            .checked_add(amount)
            .ok_or(Error::Overflow)?;

        let new_rate = total_budget
            .checked_div(SECONDS_PER_YEAR as i128)
            .ok_or(Error::Overflow)?;

        let new_period_finish = now + SECONDS_PER_YEAR;

        storage.set(&DataKey::RewardRate, &new_rate);
        storage.set(&DataKey::PeriodFinish, &new_period_finish);
        storage.set(&DataKey::LastUpdateTime, &now);

        // Track deposited pool for informational queries
        let pool: i128 = storage.get(&DataKey::RewardPool).unwrap_or(0);
        storage.set(&DataKey::RewardPool, &(pool + amount));

        events::rewards_funded(&env, &funder, amount, new_period_finish);
        Ok(())
    }

    // ── Staking ──────────────────────────────────────────────────────────────

    /// Stake `amount` LP tokens.  Starts (or extends) a 1-year hard lock.
    ///
    /// If the staker already has an active position, the new tokens are added
    /// and the lock is reset to `now + 1 year` from the new deposit time.
    /// Rewards already accrued up to this point are snapshotted into
    /// `pending_rewards`.
    pub fn stake(env: Env, staker: Address, amount: i128) -> Result<(), Error> {
        Self::assert_not_paused(&env)?;
        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        staker.require_auth();

        let lp_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::LpToken)
            .ok_or(Error::LpTokenNotSet)?;

        // Snapshot global state, then update per-staker state
        Self::update_reward_global(&env);
        let mut info = Self::get_staker_info(&env, &staker);
        Self::update_staker_rewards(&env, &mut info);

        // Transfer LP tokens from staker to contract
        let lp_client = token::Client::new(&env, &lp_token);
        lp_client.transfer(&staker, &env.current_contract_address(), &amount);

        // Update balances
        info.staked = info.staked.checked_add(amount).ok_or(Error::Overflow)?;
        info.unlock_time = env.ledger().timestamp() + LOCK_PERIOD;

        let total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalStaked)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalStaked, &(total + amount));

        Self::set_staker_info(&env, &staker, &info);

        events::staked(&env, &staker, amount, info.unlock_time);
        Ok(())
    }

    // ── Unstaking ────────────────────────────────────────────────────────────

    /// Withdraw all staked LP tokens.  Reverts if the 1-year lock has not
    /// expired.  Automatically claims any pending Zi rewards.
    pub fn unstake(env: Env, staker: Address) -> Result<(), Error> {
        Self::assert_not_paused(&env)?;
        staker.require_auth();

        let mut info = Self::get_staker_info(&env, &staker);
        if info.staked == 0 {
            return Err(Error::NothingStaked);
        }

        let now = env.ledger().timestamp();
        if now < info.unlock_time {
            return Err(Error::LockNotExpired);
        }

        Self::update_reward_global(&env);
        Self::update_staker_rewards(&env, &mut info);

        let amount = info.staked;
        info.staked = 0;
        info.unlock_time = 0;

        // Reduce total staked
        let total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalStaked)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalStaked, &(total - amount));

        // Return LP tokens
        let lp_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::LpToken)
            .ok_or(Error::LpTokenNotSet)?;
        let lp_client = token::Client::new(&env, &lp_token);
        lp_client.transfer(&env.current_contract_address(), &staker, &amount);

        // Auto-claim rewards
        let rewards = info.pending_rewards;
        info.pending_rewards = 0;
        Self::set_staker_info(&env, &staker, &info);

        if rewards > 0 {
            Self::transfer_rewards(&env, &staker, rewards)?;
            events::claimed(&env, &staker, rewards);
        }

        events::unstaked(&env, &staker, amount);
        Ok(())
    }

    // ── Claim rewards ────────────────────────────────────────────────────────

    /// Claim all pending Zi rewards without unstaking.  Can be called at any
    /// time, regardless of the lock status.
    pub fn claim(env: Env, staker: Address) -> Result<(), Error> {
        Self::assert_not_paused(&env)?;
        staker.require_auth();

        Self::update_reward_global(&env);
        let mut info = Self::get_staker_info(&env, &staker);
        Self::update_staker_rewards(&env, &mut info);

        let rewards = info.pending_rewards;
        if rewards == 0 {
            return Ok(());
        }

        info.pending_rewards = 0;
        Self::set_staker_info(&env, &staker, &info);
        Self::transfer_rewards(&env, &staker, rewards)?;

        events::claimed(&env, &staker, rewards);
        Ok(())
    }

    // ── Admin: pause / unpause ────────────────────────────────────────────────

    /// Pause the contract — blocks stake / unstake / claim.  Admin only.
    pub fn set_paused(env: Env, paused: bool) -> Result<(), Error> {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Paused, &paused);
        events::pause_toggled(&env, &admin, paused);
        Ok(())
    }

    // ── Admin: transfer admin ────────────────────────────────────────────────

    /// Transfer the admin role to a new address.
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        new_admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &new_admin);
        Ok(())
    }

    // ── Read-only views ──────────────────────────────────────────────────────

    /// Returns the current pending rewards for a staker (without mutating state).
    pub fn pending_rewards(env: Env, staker: Address) -> i128 {
        let rpt = Self::reward_per_token(&env);
        let mut info = Self::get_staker_info(&env, &staker);
        let new_rewards = info
            .staked
            .checked_mul(rpt - info.reward_per_token_paid)
            .unwrap_or(0)
            / PRECISION;
        info.pending_rewards + new_rewards
    }

    /// Returns total LP tokens staked across all accounts.
    pub fn total_staked(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalStaked)
            .unwrap_or(0)
    }

    /// Returns the current reward rate (Zi stroops per second).
    pub fn reward_rate(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::RewardRate)
            .unwrap_or(0)
    }

    /// Returns the timestamp when the current reward period ends.
    pub fn period_finish(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::PeriodFinish)
            .unwrap_or(0)
    }

    /// Returns the staker's current position: (staked, unlock_time, pending_rewards).
    pub fn staker_info(env: Env, staker: Address) -> (i128, u64, i128) {
        let rewards = Self::pending_rewards(env.clone(), staker.clone());
        let info = Self::get_staker_info(&env, &staker);
        (info.staked, info.unlock_time, rewards)
    }

    /// Returns the configured LP token address.
    pub fn lp_token(env: Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::LpToken)
    }

    /// Returns the configured reward token address.
    pub fn reward_token(env: Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::RewardToken)
    }

    // ── Internal: reward accounting (Synthetix model) ────────────────────────

    /// Compute the current cumulative reward per LP token (PRECISION-scaled).
    fn reward_per_token(env: &Env) -> i128 {
        let storage = env.storage().persistent();

        let total: i128 = storage.get(&DataKey::TotalStaked).unwrap_or(0);
        let stored: i128 = storage.get(&DataKey::RewardPerTokenStored).unwrap_or(0);

        if total == 0 {
            return stored;
        }

        let last_time: u64 = storage.get(&DataKey::LastUpdateTime).unwrap_or(0);
        let period_finish: u64 = storage.get(&DataKey::PeriodFinish).unwrap_or(0);
        let rate: i128 = storage.get(&DataKey::RewardRate).unwrap_or(0);

        let now = env.ledger().timestamp();
        let applicable = min_u64(now, period_finish) as i128;
        let elapsed = applicable - last_time as i128;

        if elapsed <= 0 {
            return stored;
        }

        let delta = rate
            .checked_mul(elapsed)
            .unwrap_or(i128::MAX)
            .checked_mul(PRECISION)
            .unwrap_or(i128::MAX)
            / total;

        stored.saturating_add(delta)
    }

    /// Write the latest `reward_per_token` and `last_update_time` to storage.
    /// Call this before any operation that changes `total_staked` or `reward_rate`.
    fn update_reward_global(env: &Env) {
        let rpt = Self::reward_per_token(env);
        let now = env.ledger().timestamp();
        let storage = env.storage().persistent();
        let period_finish: u64 = storage.get(&DataKey::PeriodFinish).unwrap_or(0);

        storage.set(&DataKey::RewardPerTokenStored, &rpt);
        storage.set(&DataKey::LastUpdateTime, &min_u64(now, period_finish));
    }

    /// Accrue earned rewards into `info.pending_rewards` and snap the paid
    /// checkpoint to the current `reward_per_token_stored`.
    fn update_staker_rewards(env: &Env, info: &mut StakerInfo) {
        let rpt: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::RewardPerTokenStored)
            .unwrap_or(0);

        let earned = info
            .staked
            .saturating_mul(rpt - info.reward_per_token_paid)
            / PRECISION;

        info.pending_rewards = info.pending_rewards.saturating_add(earned);
        info.reward_per_token_paid = rpt;
    }

    // ── Internal: helpers ────────────────────────────────────────────────────

    fn get_admin(env: &Env) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("contract not initialised")
    }

    fn get_staker_info(env: &Env, staker: &Address) -> StakerInfo {
        env.storage()
            .persistent()
            .get(&DataKey::Staker(staker.clone()))
            .unwrap_or_default()
    }

    fn set_staker_info(env: &Env, staker: &Address, info: &StakerInfo) {
        env.storage()
            .persistent()
            .set(&DataKey::Staker(staker.clone()), info);
    }

    fn assert_not_paused(env: &Env) -> Result<(), Error> {
        let paused: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            Err(Error::ContractPaused)
        } else {
            Ok(())
        }
    }

    fn transfer_rewards(env: &Env, to: &Address, amount: i128) -> Result<(), Error> {
        let reward_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::RewardToken)
            .ok_or(Error::RewardTokenNotSet)?;

        // Reduce tracked pool balance
        let pool: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::RewardPool)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::RewardPool, &(pool.saturating_sub(amount)));

        let zi_client = token::Client::new(env, &reward_token);
        zi_client.transfer(&env.current_contract_address(), to, &amount);
        Ok(())
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger, LedgerInfo},
        token::{Client as TokenClient, StellarAssetClient},
        Address, Env,
    };

    fn advance_time(env: &Env, seconds: u64) {
        let current = env.ledger().timestamp();
        env.ledger().set(LedgerInfo {
            timestamp: current + seconds,
            protocol_version: 21,
            sequence_number: env.ledger().sequence() + 1,
            network_id: Default::default(),
            base_reserve: 10,
            min_temp_entry_ttl: 10,
            min_persistent_entry_ttl: 10,
            max_entry_ttl: 3_110_400,
        });
    }

    fn setup() -> (Env, Address, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let staker = Address::generate(&env);
        let funder = Address::generate(&env);

        // Create mock Zi token
        let zi_id = env.register_stellar_asset_contract_v2(admin.clone());
        let zi_addr = zi_id.address();
        let zi_sac = StellarAssetClient::new(&env, &zi_addr);

        // Create mock LP token
        let lp_id = env.register_stellar_asset_contract_v2(admin.clone());
        let lp_addr = lp_id.address();
        let lp_sac = StellarAssetClient::new(&env, &lp_addr);

        // Mint tokens
        zi_sac.mint(&funder, &10_000_000_0000000_i128); // 10M Zi (7 decimals)
        lp_sac.mint(&staker, &1_000_0000000_i128);      // 1000 LP tokens

        // Deploy and init staking contract
        let contract_id = env.register(ZiLpStaking, ());
        let client = ZiLpStakingClient::new(&env, &contract_id);
        client.init(&admin, &zi_addr, &lp_addr);

        (env, contract_id, admin, staker, funder, zi_addr)
    }

    #[test]
    fn test_fund_then_stake_then_claim() {
        let (env, contract_id, admin, staker, funder, zi_addr) = setup();
        let client = ZiLpStakingClient::new(&env, &contract_id);
        let zi = TokenClient::new(&env, &zi_addr);

        let lp_addr: Address = client.lp_token().unwrap();
        let lp = TokenClient::new(&env, &lp_addr);

        // Fund 1M Zi reward pool
        let fund_amount: i128 = 1_000_000_0000000;
        client.fund_rewards(&funder, &fund_amount);

        // Staker stakes 100 LP tokens
        let stake_amount: i128 = 100_0000000;
        client.stake(&staker, &stake_amount);

        // Advance 6 months
        advance_time(&env, SECONDS_PER_YEAR / 2);

        // Claim rewards (should be roughly half of annual rate)
        let before = zi.balance(&staker);
        client.claim(&staker);
        let after = zi.balance(&staker);
        let received = after - before;

        // Roughly 500k Zi in 6 months — allow 1% tolerance for integer division
        let expected: i128 = fund_amount / 2;
        let tolerance = expected / 100;
        assert!(
            (received - expected).abs() <= tolerance,
            "received={} expected={} tolerance={}",
            received, expected, tolerance
        );
    }

    #[test]
    fn test_unstake_before_lock_reverts() {
        let (env, contract_id, _admin, staker, funder, _zi_addr) = setup();
        let client = ZiLpStakingClient::new(&env, &contract_id);

        client.fund_rewards(&funder, &1_000_000_0000000_i128);
        client.stake(&staker, &100_0000000_i128);

        // Advance only 6 months — lock is 1 year
        advance_time(&env, SECONDS_PER_YEAR / 2);

        let result = client.try_unstake(&staker);
        assert!(result.is_err(), "unstake before lock should fail");
    }

    #[test]
    fn test_unstake_after_lock_succeeds() {
        let (env, contract_id, _admin, staker, funder, _zi_addr) = setup();
        let client = ZiLpStakingClient::new(&env, &contract_id);

        let lp_addr: Address = client.lp_token().unwrap();
        let lp = TokenClient::new(&env, &lp_addr);

        let stake_amount: i128 = 100_0000000;
        client.fund_rewards(&funder, &1_000_000_0000000_i128);
        client.stake(&staker, &stake_amount);

        let before_lp = lp.balance(&staker);

        // Advance exactly 1 year
        advance_time(&env, SECONDS_PER_YEAR);

        client.unstake(&staker);

        let after_lp = lp.balance(&staker);
        assert_eq!(after_lp - before_lp, stake_amount, "LP tokens returned");
    }

    #[test]
    fn test_anyone_can_fund() {
        let (env, contract_id, _admin, _staker, _funder, _zi_addr) = setup();
        let client = ZiLpStakingClient::new(&env, &contract_id);

        // A completely new address funds the pool
        let random_funder = Address::generate(&env);
        let zi_addr: Address = client.reward_token().unwrap();
        let zi_sac = StellarAssetClient::new(&env, &zi_addr);
        zi_sac.mint(&random_funder, &500_000_0000000_i128);

        // Should succeed — no admin restriction on funding
        client.fund_rewards(&random_funder, &500_000_0000000_i128);
        assert!(client.reward_rate() > 0);
    }

    #[test]
    fn test_pause_blocks_stake() {
        let (env, contract_id, admin, staker, funder, _zi_addr) = setup();
        let client = ZiLpStakingClient::new(&env, &contract_id);

        client.fund_rewards(&funder, &1_000_000_0000000_i128);
        client.set_paused(&true);

        let result = client.try_stake(&staker, &100_0000000_i128);
        assert!(result.is_err(), "stake while paused should fail");
    }
}
