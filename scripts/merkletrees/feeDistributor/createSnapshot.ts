import * as path from "path";
import * as fs from "fs";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

import { getOutputAddress } from "../../utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using wallet address: ${deployer.address}.`);

  const token = "SCLP";

  const locker = await ethers.getContractAt(
    "MAHAXLocker",
    await getOutputAddress("MAHAXLocker", "ethereum")
  );

  const feeDistributor = await ethers.getContractAt(
    "FeeDistributor",
    "0xCF61094829e68C4539E0378D31197204dA53b5E0"
  );

  console.log(`deployer address is ${deployer.address}.`);
  // await tokenC
  //   .connect(kucoin)
  //   .transfer(feeDistributor.address, "9671501663193507130358");
  const e18 = BigNumber.from(10).pow(18);

  let data = "id,owner,amount,amounte18\n";
  for (let i = 0; i <= 593; i++) {
    const isStaked = await locker.isStaked(i);
    console.log(`Fetching stake details for ${i}`);
    if (!isStaked) continue;

    const amount = await feeDistributor.callStatic.claim(i);
    const owner = await locker.ownerOf(i);
    console.log(owner, amount.toString());
    if (amount.eq(0)) continue;

    const amounte18 = amount.mul(1000).div(e18).toNumber() / 1000;
    data += `${i},${owner},${amount.toString()},${amounte18}\n`;

    fs.writeFileSync(path.resolve(__dirname, `./ownership-${token}.csv`), data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
