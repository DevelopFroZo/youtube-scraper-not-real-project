import ts from "typescript";

import { formatHost } from "./formatHost";

interface Options {
  baseUrl?: string,
  fileName?: string
}

interface OnOptions {
  before?: Function,
  after?: Function
}

class TSWatcher {
  private _host: any;

  constructor( {
    baseUrl = "./",
    fileName = "tsconfig.json"
  }: Options = {} ){
    const configPath = ts.findConfigFile( baseUrl, ts.sys.fileExists, fileName );

    if( !configPath ){
      throw new Error( 'Invalid "baseUrl" or "configName"' );
    }

    this._host = ts.createWatchCompilerHost(
      configPath,
      {},
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      diagnostic => {
        console.log(
          ts.formatDiagnosticsWithColorAndContext([diagnostic], formatHost),
        );
      },
      () => {}
    );
  }

  on( functionName: string, { before, after }: OnOptions = {} ): void{
    const originalFunction = this._host[ functionName ];

    this._host[ functionName ] = function(){
      let args;

      if( before ){
        args = before( ...arguments );
      }

      let result;

      if( args ){
        result = originalFunction( ...args );
      } else {
        result = originalFunction( ...arguments );
      }

      if( after ){
        after( result );
      }

      return result;
    };
  }

  before( functionName: string, before: Function ): void{
    this.on( functionName, { before } );
  }

  after( functionName: string, after: Function ): void{
    this.on( functionName, { after } );
  }

  start(): void{
    ts.createWatchProgram( this._host );
  }
}

export type { Options };
export { TSWatcher };