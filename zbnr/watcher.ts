import type { Server } from "http";
import type { Express } from "express";

import { resolve } from "path";

import { TSWatcher } from "./ts/watcher";
import { Buffer } from "./Buffer";
import { CachePurger } from "./CachePurger";
import { Router } from "./router";
import { scan } from "./scan";
import { DeletedData } from "./DeletedData";

// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
import { Aliases } from "./aliases";
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

import { promises } from "fs";

function filter( path: string ): void | false{
  if( !/\.js/.test( path ) || path.startsWith( buildAndRunPath ) ){
    return false;
  }
}

const controllers = "controllers";

const srcPath = resolve( "src" );
const buildPath = resolve( "build" );
const buildAndRunPath = resolve( "zbnr" );
const mainFilePath = resolve( buildPath, "server.js" );
const srcControllersPath = resolve( srcPath, controllers );
const buildControllersPath = resolve( buildPath, controllers );

const tsWatcher = new TSWatcher();
const buffer = new Buffer<string>( { filter } );
const cachePurger = new CachePurger( filter );
const deletedData = new DeletedData<string>( scan( srcControllersPath ) );
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
const aliases = new Aliases( "tsconfig.json" );
// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

let app: Express;
let server: Server;
let router: Router;

async function restart(){
  if( server ){
    await new Promise( res => server.close( res ) );
  }

  return new Promise<void>( res => {
    require( mainFilePath ).default( ( app_: Express, server_: Server ) => {
      app = app_;
      server = server_;
      router = new Router( app, buildControllersPath ).init( scan( buildControllersPath ) );
      res();
    } );
  } );
}

async function index(){
  process.env.PORT = process.argv[2] || "3000";
  process.env.NODE_ENV = process.argv[3] || "development";

  tsWatcher.before( "writeFile", ( path: string, oldTxt: string, bl: boolean ) => {
    const [ , newTxt ] = aliases.replaceInText( oldTxt );

    buffer.addData( resolve( path ) );

    return [ path, newTxt, bl ];
  } );

  buffer.hook( async ( paths, ready ) => {
    const purged = cachePurger.purge( ...paths );
    const resultPaths = [ ...paths ];

    for( const path of purged ){
      if( resultPaths.includes( path ) ) continue;

      resultPaths.push( path );
    }

    if( resultPaths.includes( mainFilePath ) ){
      await restart();
    } else {
      const removed = deletedData.find( scan( srcControllersPath ) );

      for( const rawPath of removed ){
        const path = rawPath.replace( srcPath, buildPath ).replace( /\.ts$/, ".js" );
        const uri = router.removePath( path );

        await promises.unlink( path );

        if( uri ){
          console.log( `> \x1b[36mRemoved \x1b[35m${uri}\x1b[0m` );
        }
      }

      for( const path of resultPaths ){
        const result = router.handlePath( path );

        if( result ){
          const [ actionNumber, uri ] = result;
          const actionText = actionNumber === 0 ? "Removed" : "Reloaded";

          console.log( `> \x1b[36m${actionText} \x1b[35m${uri}\x1b[0m` );
        }
      }
    }

    ready();
  } );

  tsWatcher.start();
}

index();