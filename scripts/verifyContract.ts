import { HardhatRuntimeEnvironment } from "hardhat/types";

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  address: string,
  constructorArguments: any[]
) {
  try {
    await wait(20 * 1000); // wait for 20s

    await hre.run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (error: any) {
    if (error.name !== "NomicLabsHardhatPluginError") {
      console.error(`- Error verifying: ${error.name}`);
      console.error(error);
    }
  }
}
