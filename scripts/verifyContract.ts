import { HardhatRuntimeEnvironment } from "hardhat/types";

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  address: string,
  constructorArguments: any[]
) {
  await wait(60 * 1000); // wait for a minute
  console.log(`Verifying contract deployed at address: ${address}`);
  await hre.run("verify:verify", {
    address,
    constructorArguments,
  });
}
