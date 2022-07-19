import hre, { ethers, network } from "hardhat";
import verifyContract from "./verifyContract";
import { saveABI } from "./utils";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const registry = "0x270Cb299Bd822A856c0599235b3ABdd1B42afe85";
  const _royaltyRcv = "0x6bfc9DB28f0A6d11a8d9d64c86026DDD2fad293B";
  const _royaltyFeeNumerator = "1000";

  const mahaxCF = await ethers.getContractFactory(`MAHAXLocker`);

  console.log(`Deploying MAHAX implementation...`);
  const mahax = await mahaxCF.deploy(
    registry,
    _royaltyRcv,
    _royaltyFeeNumerator
  );
  console.log(
    `Deployed MAHAXLocker at ${mahax.address}, ${mahax.deployTransaction.hash}`
  );
  await verifyContract(hre, mahax.address, [
    registry,
    _royaltyRcv,
    _royaltyFeeNumerator,
  ]);

  saveABI("MAHAXLocker", "MAHAXLocker", mahax.address);
  console.log(`Deployment on ${network.name} complete!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
