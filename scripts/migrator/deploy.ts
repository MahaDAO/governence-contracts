import hre,{ ethers, network } from "hardhat";
import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying the contract on ${network.name}`);
  const [deployer] = await ethers.getSigners();
  const MAHA_BASE = "0x554bba833518793056CF105E66aBEA330672c0dE";
  const NAME = "";
  const SYMBOL = "";
  const MERKLE_ROOT = "";
  const TransparentProxy = await ethers.getContractFactory(
    "TransparentUpgradeableProxy"
  );
  const MigratorMaha = await ethers.getContractFactory("MigratorMaha");
  const migratorMahaImpl = await MigratorMaha.deploy();
  await migratorMahaImpl.deployed();

  console.log(`Migrator Maha Implementation ${migratorMahaImpl.address}`);

  const migratorMahaProxy = await TransparentProxy.deploy(
    migratorMahaImpl.address,
    await deployer.getAddress(),
    "0x"
  );
  await migratorMahaProxy.deployed();

  console.log(`Migrator Maha Proxy ${migratorMahaProxy.address}`);

//   const migrator = await ethers.getContractAt(
//     "MigratorMaha",
//     await migratorMahaProxy.address
//   );
//   await migrator.init(NAME, SYMBOL, MERKLE_ROOT, MAHA_BASE);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
