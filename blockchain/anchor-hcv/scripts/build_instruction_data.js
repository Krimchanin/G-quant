const anchor = require("@coral-xyz/anchor");
const bs58 = require("bs58");
const fs = require("fs");
const path = require("path");

function hexTo32Bytes(hex) {
  const normalized = (hex || "").toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Hash must be 32 bytes hex (64 chars)");
  }
  return Uint8Array.from(Buffer.from(normalized, "hex"));
}

function printOutput(buf) {
  console.log("hex:", Buffer.from(buf).toString("hex"));
  console.log("base58:", bs58.encode(Buffer.from(buf)));
  console.log("base64:", Buffer.from(buf).toString("base64"));
}

function main() {
  const mode = process.env.IX_TYPE;
  const idlPath = path.join(__dirname, "..", "target", "idl", "hcv_control.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found at ${idlPath}. Run: anchor build`);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const coder = new anchor.BorshInstructionCoder(idl);

  if (mode === "update_nav") {
    const nav = new anchor.BN(process.env.NEW_NAV_MICROUNITS || "0");
    const algorithmHash = hexTo32Bytes(process.env.NEW_ALGORITHM_HASH_HEX || "0".repeat(64));
    const strategiesHash = hexTo32Bytes(process.env.NEW_STRATEGIES_HASH_HEX || "0".repeat(64));

    const data = coder.encode("update_nav", {
      params: {
        navMicrounits: nav,
        algorithmHash: Array.from(algorithmHash),
        strategiesHash: Array.from(strategiesHash),
      },
    });

    console.log("instruction:", mode);
    printOutput(data);
    return;
  }

  if (mode === "update_metadata_uri") {
    const uri = process.env.NEW_METADATA_URI;
    if (!uri) {
      throw new Error("NEW_METADATA_URI is required for update_metadata_uri");
    }

    const data = coder.encode("update_metadata_uri", { metadata_uri: uri });
    console.log("instruction:", mode);
    printOutput(data);
    return;
  }

  throw new Error("Set IX_TYPE=update_nav or IX_TYPE=update_metadata_uri");
}

main();
