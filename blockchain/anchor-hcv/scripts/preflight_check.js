const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idlPath = path.join(__dirname, "..", "target", "idl", "hcv_control.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run: anchor build`);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(idl, provider);

  const mintAddress = process.env.MINT_ADDRESS;
  if (!mintAddress) throw new Error("MINT_ADDRESS is required");

  const mint = new anchor.web3.PublicKey(mintAddress);
  const [statePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("hcv_state"), mint.toBuffer()],
    program.programId
  );

  const mintInfo = await provider.connection.getParsedAccountInfo(mint);
  if (!mintInfo.value) throw new Error("Mint account not found");

  const mintData = mintInfo.value.data;
  if (!("parsed" in mintData)) {
    throw new Error("Unexpected mint account format");
  }

  const parsed = mintData.parsed.info;
  const state = await program.account.hcvState.fetch(statePda);

  console.log("program_id:", program.programId.toBase58());
  console.log("state_pda:", statePda.toBase58());
  console.log("state.multisig_authority:", state.multisigAuthority.toBase58());
  console.log("state.mint:", state.mint.toBase58());
  console.log("mint.decimals:", parsed.decimals);
  console.log("mint.supply_raw:", parsed.supply);
  console.log("mint_authority:", parsed.mintAuthority ?? "(not set)");
  console.log("freeze_authority:", parsed.freezeAuthority ?? "(not set)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
