// a simple script to deploy a contract
import { ethers, network } from "hardhat";

async function main() {
  const VotingEscrowV1 = await ethers.getContractFactory("VotingEscrowV1");

  console.log(`\nDeploying VotingEscrowV1 instance...`);
  const instance = await VotingEscrowV1.deploy();

  await instance.deployed();
  console.log(`Deployed VotingEscrowV1 instance at ${instance.address}...`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
