require( "source-map-support" ).install();

import type { Server } from "http";
import type { Express } from "express";

import { createServer } from "http";

import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

async function index( init: ( app: Express, server: Server ) => {} ){
  const { PORT, NODE_ENV } = process.env;

  try{
    dotenv.config( { path: `${NODE_ENV}.env` } );
  } catch( error ) {
    console.error( `\x1b[31m${error.message}\x1b[0m` );
    console.error( error );

    process.exit( -1 );
  }

  const app = express();
  const server = createServer( app );

  app.use( helmet() );

  app.use(
    express.static( "static", { extensions: [ "html" ] } ),
    express.json(),
    express.urlencoded( {
      extended: true
    } )
  );

  server.listen( PORT, () => {
    console.log( `> \x1b[36mStarted \x1b[35m${NODE_ENV}\x1b[36m server on port \x1b[35m${PORT}\x1b[0m` );
    init( app, server );
  } );
}

export default index;