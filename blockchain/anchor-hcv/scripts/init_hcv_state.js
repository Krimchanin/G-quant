const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = new anchor.web3.PublicKey("G9RToW2Ud4sgSQpfxGKP4zA1aqGmyw5GBtwoedtcfC4i");

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
  const multisigVault = process.env.MULTISIG_VAULT;
  const metadataUri = process.env.METADATA_URI;

  if (!mintAddress) throw new Error("MINT_ADDRESS is required");
  if (!multisigVault) throw new Error("MULTISIG_VAULT is required");
  if (!metadataUri) throw new Error("METADATA_URI is required");

  const mint = new anchor.web3.PublicKey(mintAddress);
  const multisig = new anchor.web3.PublicKey(multisigVault);

  const initialNav = new anchor.BN(process.env.INITIAL_NAV_MICROUNITS || "0");
  const algorithmHash = hexTo32Bytes(
    process.env.ALGORITHM_HASH_HEX || "0000000000000000000000000000000000000000000000000000000000000000"
  );
  const strategiesHash = hexTo32Bytes(
    process.env.STRATEGIES_HASH_HEX || "0000000000000000000000000000000000000000000000000000000000000000"
  );

  const [statePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("hcv_state"), mint.toBuffer()],
    program.programId
  );

  console.log("Program:", program.programId.toBase58());
  console.log("State PDA:", statePda.toBase58());
  console.log("Mint:", mint.toBase58());
  console.log("Multisig:", multisig.toBase58());

  const tx = await program.methods
    .initialize(
      {
        multisigAuthority: multisig,
        mint,
        initialNavMicrounits: initialNav,
        algorithmHash: Array.from(algorithmHash),
        strategiesHash: Array.from(strategiesHash),
      },
      metadataUri
    )
    .accounts({
      state: statePda,
      payer: provider.wallet.publicKey,
      system_program: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Initialize signature:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
