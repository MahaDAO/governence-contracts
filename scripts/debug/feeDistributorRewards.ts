import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { getOutputAddress } from "../utils";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  // const [deployer] = await ethers.getSigners();

  const address = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";
  await helpers.impersonateAccount(address);
  const deployer = await ethers.getSigner(address);

  console.log(`deployer address is ${deployer.address}.`);

  const inst = await ethers.getContractAt(
    "FeeDistributor",
    "0xcf61094829e68c4539e0378d31197204da53b5e0"
  );

  console.log("distributor at", inst.address);
  console.log(
    "claim",
    (await inst.connect(deployer).callStatic.claim(1)).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
