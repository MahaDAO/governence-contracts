import * as fs from "fs";
import { network } from "hardhat";

export const saveABI = (key: string, abi: string, address: string) => {
  const filename = `./output/${network.name}.json`;

  let outputFile: any = {};
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename).toString();
    outputFile = data === "" ? {} : JSON.parse(data);
  }

  outputFile[key] = {
    abi,
    address,
  };

  fs.writeFileSync(filename, JSON.stringify(outputFile, null, 4));
  console.log(`saved ${key}:${address} into ${network.name}.json`);
};
