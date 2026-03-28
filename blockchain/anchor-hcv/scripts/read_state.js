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

  const state = await program.account.hcvState.fetch(statePda);

  console.log("Program:", program.programId.toBase58());
  console.log("State PDA:", statePda.toBase58());
  console.log("multisig_authority:", state.multisigAuthority.toBase58());
  console.log("mint:", state.mint.toBase58());
  console.log("nav_microunits:", state.navMicrounits.toString());
  console.log("algorithm_hash:", Buffer.from(state.algorithmHash).toString("hex"));
  console.log("strategies_hash:", Buffer.from(state.strategiesHash).toString("hex"));
  console.log("metadata_uri:", state.metadataUri);
  console.log("last_updated_at:", state.lastUpdatedAt.toString());
  console.log("bump:", state.bump);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
