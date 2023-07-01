import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs";
import * as path from "path";

interface Dep {
  path: string;
  depType: "direct" | "dynamic";
}

interface DepsMap {
  [path: string]: Dep[];
}

export const collectDeps = (filePath: string, _depsMap: DepsMap = {}) => {
  const depsMap = _depsMap;
  const code = fs.readFileSync(filePath, "utf8");
  const ast = parse(code, { sourceType: "module" });

  // init
  const parsedFilePath = path.resolve(path.dirname(filePath), filePath);
  depsMap[parsedFilePath] = [];

  // traverse
  traverse(ast, {
    ImportDeclaration(node) {
      const depRawPath = node.node.source.value;
      const parsedDepPath = path.resolve(path.dirname(filePath), depRawPath);
      const isLoopDep = depsMap[parsedDepPath];
      if (isLoopDep) {
        console.warn("duplicated dependency", parsedDepPath);
        return;
      }
      depsMap[parsedFilePath].push({
        path: parsedDepPath,
        depType: "direct",
      });

      collectDeps(parsedDepPath, depsMap);
    },
  });

  console.log(depsMap);
};

collectDeps("./test_data/index.ts");
