import type { Express } from "express";

import { resolve } from "path";

import { Aliases } from "./aliases";
import { scan } from "./scan";
import { Router } from "./router";

const buildPath = resolve( "build" );
const buildControllersPath = resolve( buildPath, "controllers" );
const mainFile = resolve( buildPath, "server.js" );

async function index(){
  const buildPaths = scan( buildPath );
  const buildControllersPaths = buildPaths.filter( path => path.startsWith( buildControllersPath ) );

  process.env.PORT = process.argv[2] || "3000";
  process.env.NODE_ENV = process.argv[3] || "production";

  const aliases = new Aliases( "tsconfig.json" );

  aliases.replaceInFiles( ...buildPaths );

  await require( mainFile ).default( ( app: Express ) => {
    new Router( app, buildControllersPath ).init( buildControllersPaths );
  } );
}

index();