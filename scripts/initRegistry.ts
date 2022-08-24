import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}.`);

  const voterF = await ethers.getContractAt(
    "Registry",
    "0x270cb299bd822a856c0599235b3abdd1b42afe85"
  );

  console.log(`Deploying Registry implementation...`);
  const tx = await voterF.initialize(
    "0xb4d930279552397bba2ee473229f89ec245bc365", // address _maha,
    "0xB756B18a5C796Af8eDF26da4DEc9e0495E5Ac456", // address _gaugeVoter,
    "0x2dd0b4BcD086DC603e864A898c9125d2c22F00D4", // address _locker,
    "0x8b02998366f7437f6c4138f4b543ea5c000cd608", // address _governor,
    "0x438B06e4F4EB8F4F93Db6258a5E8A6547F3f23cC", // address _staker,
    "0x438B06e4F4EB8F4F93Db6258a5E8A6547F3f23cC",
    deployer.address // address _governance
  );
  console.log(`initialized Registry ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
