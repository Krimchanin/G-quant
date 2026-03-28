const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

function hexTo32Bytes(hex) {
  const normalized = hex.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Hash must be 32 bytes hex (64 chars)");
  }
  return Uint8Array.from(Buffer.from(normalized, "hex"));
}

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

  const nav = new anchor.BN(process.env.NEW_NAV_MICROUNITS || "123456");
  const algorithmHash = hexTo32Bytes(
    process.env.NEW_ALGORITHM_HASH_HEX || "1111111111111111111111111111111111111111111111111111111111111111"
  );
  const strategiesHash = hexTo32Bytes(
    process.env.NEW_STRATEGIES_HASH_HEX || "2222222222222222222222222222222222222222222222222222222222222222"
  );

  console.log("Program:", program.programId.toBase58());
  console.log("State PDA:", statePda.toBase58());
  console.log("Signer:", provider.wallet.publicKey.toBase58());

  const tx = await program.methods
    .updateNav({
      navMicrounits: nav,
      algorithmHash: Array.from(algorithmHash),
      strategiesHash: Array.from(strategiesHash),
    })
    .accounts({
      state: statePda,
      multisig_authority: provider.wallet.publicKey,
    })
    .rpc();

  console.log("UpdateNav signature:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
