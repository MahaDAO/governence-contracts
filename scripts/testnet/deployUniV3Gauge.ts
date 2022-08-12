import hre, { ethers, network } from "hardhat";
import { getOutputAddress, saveABI } from "../utils";

import verifyContract from "../verifyContract";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokenA = "ARTH";
  const tokenB = "USDC";
  const fee = 10000;

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  const gasPrice = estimateGasPrice.mul(3).div(2);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, `gwei`)} gwei`);

  // Get all smart contract factories
  const univ3GaugeCF = await ethers.getContractFactory("BaseGaugeV2UniV3");
  const bribesCF = await ethers.getContractFactory("BaseV2Bribes");

  // Get all the deployed smart contracts.
  const voter = await ethers.getContractAt(
    "BaseV2Voter",
    await getOutputAddress("GaugeVoter")
  );
  const registry = await ethers.getContractAt(
    "Registry",
    await getOutputAddress("Registry")
  );

  const tokens = await Promise.all([
    getOutputAddress(tokenA),
    getOutputAddress(tokenB),
  ]);

  const univ3GaugeContractInstance = await univ3GaugeCF.deploy(
    tokens[0],
    tokens[1],
    fee,
    registry.address,
    uniPositionManager,
    { gasPrice }
  );

  await univ3GaugeContractInstance.deployed();

  const bribesInstance = await bribesCF.deploy(registry.address);
  await bribesInstance.deployed();

  console.log("univ3GaugeContractInstance", univ3GaugeContractInstance.address);
  console.log("bribesInstance", bribesInstance.address);

  !(await voter.whitelist(univ3GaugeContractInstance.address)) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(
        univ3GaugeContractInstance.address
      );
      console.log("tx gauge whitelist", tx.hash);
      await tx.wait();
    })());

  !(await voter.whitelist(await univ3GaugeContractInstance.pool())) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(
        await univ3GaugeContractInstance.pool()
      );
      console.log("tx pool whitelist", tx.hash);
      await tx.wait();
    })());

  !(await voter.whitelist(bribesInstance.address)) &&
    (await (async () => {
      const tx = await voter.toggleWhitelist(bribesInstance.address);
      console.log("tx bribes whitelist", tx.hash);
      await tx.wait();
    })());

  const tx4 = await voter.registerGaugeBribe(
    await univ3GaugeContractInstance.pool(),
    bribesInstance.address,
    univ3GaugeContractInstance.address
  );
  console.log("tx registerGauge", tx4.hash);
  await tx4.wait();

  await saveABI(
    `${tokenA}${tokenB}-UniV3Gauge`,
    "BaseGaugeV2UniV3",
    univ3GaugeContractInstance.address
  );
  await saveABI(
    `${tokenA}${tokenB}-UniV3Bribe`,
    "BaseV2Bribes",
    bribesInstance.address
  );

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
