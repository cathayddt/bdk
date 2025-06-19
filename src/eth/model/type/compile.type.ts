export enum CompileType {
  BDK_SOLC = 'bdkSolc',
  LOCAL_SOLC = 'localSolc',
  REMOTE_SOLC = 'remoteSolc',
}

export interface MinimalSolcInstance {
  compile: (input: string, ...args: any[]) => string
  version: () => string
}
