use anchor_lang::prelude::*;

declare_id!("G9RToW2Ud4sgSQpfxGKP4zA1aqGmyw5GBtwoedtcfC4i");

// Bounded URI size keeps account rent predictable and blocks oversized writes.
const MAX_METADATA_URI_LEN: usize = 200;

#[program]
pub mod hcv_control {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        params: InitializeParams,
        metadata_uri: String,
    ) -> Result<()> {
        require_keys_neq!(params.multisig_authority, Pubkey::default(), HcvError::InvalidAuthority);
        require_keys_neq!(params.mint, Pubkey::default(), HcvError::InvalidMint);
        require!(metadata_uri.len() <= MAX_METADATA_URI_LEN, HcvError::MetadataUriTooLong);

        let state = &mut ctx.accounts.state;
        state.multisig_authority = params.multisig_authority;
        state.mint = params.mint;
        state.nav_microunits = params.initial_nav_microunits;
        state.algorithm_hash = params.algorithm_hash;
        state.strategies_hash = params.strategies_hash;
        state.metadata_uri = metadata_uri;
        state.last_updated_at = Clock::get()?.unix_timestamp;
        state.bump = ctx.bumps.state;

        emit!(StateInitialized {
            multisig_authority: state.multisig_authority,
            mint: state.mint,
            nav_microunits: state.nav_microunits,
            algorithm_hash: state.algorithm_hash,
            strategies_hash: state.strategies_hash,
            metadata_uri: state.metadata_uri.clone(),
            updated_at: state.last_updated_at,
        });

        Ok(())
    }

    pub fn update_nav(ctx: Context<OnlyMultisig>, params: UpdateNavParams) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.nav_microunits = params.nav_microunits;
        state.algorithm_hash = params.algorithm_hash;
        state.strategies_hash = params.strategies_hash;
        state.last_updated_at = Clock::get()?.unix_timestamp;

        emit!(NavUpdated {
            multisig_authority: state.multisig_authority,
            nav_microunits: state.nav_microunits,
            algorithm_hash: state.algorithm_hash,
            strategies_hash: state.strategies_hash,
            updated_at: state.last_updated_at,
        });

        Ok(())
    }

    pub fn update_metadata_uri(ctx: Context<OnlyMultisig>, metadata_uri: String) -> Result<()> {
        require!(metadata_uri.len() <= MAX_METADATA_URI_LEN, HcvError::MetadataUriTooLong);

        let state = &mut ctx.accounts.state;
        state.metadata_uri = metadata_uri;
        state.last_updated_at = Clock::get()?.unix_timestamp;

        emit!(MetadataUriUpdated {
            multisig_authority: state.multisig_authority,
            metadata_uri: state.metadata_uri.clone(),
            updated_at: state.last_updated_at,
        });

        Ok(())
    }

    pub fn rotate_multisig(ctx: Context<OnlyMultisig>, new_multisig_authority: Pubkey) -> Result<()> {
        require_keys_neq!(new_multisig_authority, Pubkey::default(), HcvError::InvalidAuthority);

        let state = &mut ctx.accounts.state;
        state.multisig_authority = new_multisig_authority;
        state.last_updated_at = Clock::get()?.unix_timestamp;

        emit!(MultisigRotated {
            previous_multisig_authority: ctx.accounts.multisig_authority.key(),
            new_multisig_authority,
            updated_at: state.last_updated_at,
        });

        Ok(())
    }

}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeParams {
    pub multisig_authority: Pubkey,
    pub mint: Pubkey,
    pub initial_nav_microunits: u64,
    pub algorithm_hash: [u8; 32],
    pub strategies_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct UpdateNavParams {
    // NAV is stored as fixed-point integer with 6 implied decimals to avoid float risk.
    pub nav_microunits: u64,
    pub algorithm_hash: [u8; 32],
    pub strategies_hash: [u8; 32],
}

#[derive(Accounts)]
#[instruction(params: InitializeParams)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = HcvState::LEN,
        seeds = [b"hcv_state", params.mint.as_ref()],
        bump
    )]
    pub state: Account<'info, HcvState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OnlyMultisig<'info> {
    #[account(
        mut,
        seeds = [b"hcv_state", state.mint.as_ref()],
        bump = state.bump,
        has_one = multisig_authority @ HcvError::Unauthorized
    )]
    pub state: Account<'info, HcvState>,
    pub multisig_authority: Signer<'info>,
}

#[account]
pub struct HcvState {
    // This key is expected to be a Squads vault address so all admin actions are multisig-gated.
    pub multisig_authority: Pubkey,
    pub mint: Pubkey,
    pub nav_microunits: u64,
    pub algorithm_hash: [u8; 32],
    pub strategies_hash: [u8; 32],
    pub metadata_uri: String,
    pub last_updated_at: i64,
    pub bump: u8,
}

impl HcvState {
    pub const LEN: usize = 8
        + 32
        + 32
        + 8
        + 32
        + 32
        + 4
        + MAX_METADATA_URI_LEN
        + 8
        + 1;
}

#[event]
pub struct StateInitialized {
    pub multisig_authority: Pubkey,
    pub mint: Pubkey,
    pub nav_microunits: u64,
    pub algorithm_hash: [u8; 32],
    pub strategies_hash: [u8; 32],
    pub metadata_uri: String,
    pub updated_at: i64,
}

#[event]
pub struct NavUpdated {
    pub multisig_authority: Pubkey,
    pub nav_microunits: u64,
    pub algorithm_hash: [u8; 32],
    pub strategies_hash: [u8; 32],
    pub updated_at: i64,
}

#[event]
pub struct MetadataUriUpdated {
    pub multisig_authority: Pubkey,
    pub metadata_uri: String,
    pub updated_at: i64,
}

#[event]
pub struct MultisigRotated {
    pub previous_multisig_authority: Pubkey,
    pub new_multisig_authority: Pubkey,
    pub updated_at: i64,
}

#[error_code]
pub enum HcvError {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid multisig authority")]
    InvalidAuthority,
    #[msg("Invalid mint address")]
    InvalidMint,
    #[msg("Metadata URI is too long")]
    MetadataUriTooLong,
}
