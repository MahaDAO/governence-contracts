import * as fs from "fs";
import { ethers, network } from "hardhat";

async function main() {
  console.log(`Fetching lock details to ${network.name}`);

  const mahax = await ethers.getContractAt(
    "MAHAXLocker",
    "0x7BAaDf1B222d97EAb89D8EC86728f5877760Babc"
  );

  const lastTokenId: number = 22;

  const snapshot: any[] = [];
  for (let i = 1; i <= lastTokenId; i++) {
    const lock: any = await mahax.locked(i);
    const owner: string = await mahax.ownerOf(i);

    snapshot.push({
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      amount: lock.amount,
      end: lock.end,
      start: lock.start,
      owner,
      id: i,
    });
  }

  fs.writeFileSync(
    `./output/${network.name}.snapshot.json`,
    JSON.stringify(snapshot, null, 4)
  );

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
