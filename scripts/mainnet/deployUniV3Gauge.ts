import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress, saveABI } from "../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokenA = "ARTH";
  const tokenB = "MAHA";
  const fee = 10000;

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

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

  const univ3GaugeContractInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3Gauge`,
    "BaseGaugeV2UniV3",
    [tokens[0], tokens[1], fee, registry.address, uniPositionManager]
  );

  const bribesInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3Bribe`,
    "BaseV2Bribes",
    [registry.address]
  );

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
    `${tokenA}${tokenB}-UniV3-Pool`,
    "IUniswapV3Pool",
    await univ3GaugeContractInstance.pool(),
    true
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
