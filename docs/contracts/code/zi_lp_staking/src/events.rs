use soroban_sdk::{Address, Env, Symbol, symbol_short, Vec, IntoVal};

/// Emitted when the contract is initialised.
pub fn initialized(env: &Env, admin: &Address, reward_token: &Address, lp_token: &Address) {
    let topics = (symbol_short!("init"), admin.clone());
    env.events().publish(topics, (reward_token.clone(), lp_token.clone()));
}

/// Emitted when the reward pool is topped up.
pub fn rewards_funded(env: &Env, funder: &Address, amount: i128, new_period_finish: u64) {
    let topics = (symbol_short!("funded"), funder.clone());
    env.events().publish(topics, (amount, new_period_finish));
}

/// Emitted when a staker deposits LP tokens.
pub fn staked(env: &Env, staker: &Address, amount: i128, unlock_time: u64) {
    let topics = (symbol_short!("staked"), staker.clone());
    env.events().publish(topics, (amount, unlock_time));
}

/// Emitted when a staker withdraws LP tokens.
pub fn unstaked(env: &Env, staker: &Address, amount: i128) {
    let topics = (symbol_short!("unstaked"), staker.clone());
    env.events().publish(topics, amount);
}

/// Emitted when a staker claims pending Zi rewards.
pub fn claimed(env: &Env, staker: &Address, amount: i128) {
    let topics = (symbol_short!("claimed"), staker.clone());
    env.events().publish(topics, amount);
}

/// Emitted when the admin updates the LP token address.
pub fn lp_token_updated(env: &Env, admin: &Address, new_lp_token: &Address) {
    let topics = (symbol_short!("lp_upd"), admin.clone());
    env.events().publish(topics, new_lp_token.clone());
}

/// Emitted when the contract is paused or unpaused.
pub fn pause_toggled(env: &Env, admin: &Address, paused: bool) {
    let topics = (symbol_short!("pause"), admin.clone());
    env.events().publish(topics, paused);
}
