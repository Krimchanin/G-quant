import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("hcv_control", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.HcvControl as Program;

  it("loads workspace", async () => {
    expect(program.programId).to.not.equal(undefined);
  });

  // TODO: add full positive/negative authorization tests for:
  // initialize, update_nav, update_metadata_uri, rotate_multisig.
});
