import * as path from "path";
import * as fs from "fs";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

import { getOutputAddress } from "../../utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using wallet address: ${deployer.address}.`);

  const token = "SCLP";

  const feeDistributor = await ethers.getContractAt(
    "PendingFeeDistributor",
    await getOutputAddress(`${token}PendingFeeDistributor`, "ethereum")
  );

  const merkle = JSON.parse(
    fs
      .readFileSync(
        path.resolve(__dirname, `./stake-merkleProof-${token}.json`)
      )
      .toString()
  );

  const e18 = BigNumber.from(10).pow(18);

  console.log("merkle", merkle);

  let data = "id,owner,amount,amounte18\n";
  for (let i = 0; i <= merkle.leaves.length; i++) {
    const d = merkle.leaves[i].data;
    console.log(`Fetching details for ${i}`);

    const hasClaimed = await feeDistributor.hasClaimed(i);
    if (hasClaimed) continue;

    const amount = d.amount;
    const owner = d.owner;

    const amounte18 =
      BigNumber.from(amount).mul(1000).div(e18).toNumber() / 1000;
    data += `${d.id},${owner},${amount},${amounte18}\n`;

    fs.writeFileSync(
      path.resolve(__dirname, `./merkle-snapshot-${token}.csv`),
      data
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
