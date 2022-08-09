import hre, { ethers, network } from "hardhat";
import { getOutputAddress } from "../utils";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  const PROXY_ADMIN = "0xed74d7941EFb3aec09C02a2db41BCBf195c9216b";
  console.log(
    `Deployer address is ${deployer.address}, Proxy admin is ${PROXY_ADMIN}`
  );

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories
  const univ3GaugeContractFactory = await ethers.getContractFactory(
    "BaseGaugeV2UniV3"
  );
  const bribesContractFactory = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const voter = await ethers.getContractAt(
    "BaseV2Voter",
    await getOutputAddress("GaugeVoter")
  );
  const registry = await ethers.getContractAt(
    "Registry",
    await getOutputAddress("Registry")
  );

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokens = [
    "0xbeab728fcc37de548620f17e9a521374f4a35c02", // arth
    "0xc003235c028A18E55bacE946E91fAe95769348BB", // usdc
  ];

  const fee = 10000;

  const univ3GaugeContractInstance = await univ3GaugeContractFactory.deploy(
    tokens[0],
    tokens[1],
    fee,
    registry.address,
    uniPositionManager,
    { gasPrice }
  );

  await univ3GaugeContractInstance.deployed();

  const bribesInstance = await bribesContractFactory.deploy(registry.address);
  await bribesInstance.deployed();

  console.log("univ3GaugeContractInstance", univ3GaugeContractInstance.address);
  console.log("bribesInstance", bribesInstance.address);

  const tx1 = await voter.toggleWhitelist(univ3GaugeContractInstance.address);
  console.log("tx gauge whitelist", tx1.hash);
  await tx1.wait();

  const tx2 = await voter.toggleWhitelist(
    await univ3GaugeContractInstance.pool()
  );
  console.log("tx pool whitelist", tx2.hash);
  await tx2.wait();

  const tx3 = await voter.toggleWhitelist(bribesInstance.address);
  console.log("tx bribes whitelist", tx3.hash);
  await tx3.wait();

  const tx4 = await voter.registerGauge(
    await univ3GaugeContractInstance.pool(),
    bribesInstance.address,
    univ3GaugeContractInstance.address
  );
  console.log("tx registerGauge", tx4.hash);
  await tx4.wait();

  await verifyContract(hre, univ3GaugeContractInstance.address, [
    tokens[0],
    tokens[1],
    fee,
    registry.address,
    uniPositionManager,
  ]);

  await verifyContract(hre, bribesInstance.address, [registry.address]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
