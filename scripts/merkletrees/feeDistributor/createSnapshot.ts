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
    await getOutputAddress(`${token}FeeDistributor`, "ethereum")
  );

  const sclp = await ethers.getContractAt(
    "IERC20",
    await getOutputAddress(`${token}`, "ethereum")
  );

  const e18 = BigNumber.from(10).pow(18);

  await feeDistributor.checkpointToken();
  await feeDistributor.checkpointTotalSupply();

  helpers.mine(1);

  const account = "0xd6216fc19db775df9774a6e33526131da7d19a2c";
  await helpers.impersonateAccount(account);
  const kucoin = await ethers.getSigner(account);

  console.log(`deployer address is ${deployer.address}.`);
  await sclp
    .connect(kucoin)
    .transfer(feeDistributor.address, "9671501663193507130358");

  helpers.mine(1);

  console.log(await sclp.balanceOf(feeDistributor.address));

  let data = "id,owner,amount,amounte18\n";
  for (let i = 0; i <= 297; i++) {
    if (i === 14) continue;
    const isStaked = await locker.isStaked(i);
    console.log(`Fetching stake details for ${i}`, isStaked);
    if (!isStaked) continue;

    const amount = await feeDistributor.callStatic.claim(i);
    const owner = await locker.ownerOf(i);
    console.log(amount);
    if (amount.eq(0)) continue;

    const amounte18 = amount.mul(1000).div(e18).toNumber() / 1000;
    data += `${i},${owner},${amount},${amounte18}\n`;

    fs.writeFileSync(
      path.resolve(__dirname, `./stake-snapshot-${token}.csv`),
      data
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
