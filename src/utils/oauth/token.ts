import type { RequestHandler, Request, Response } from "express";

import type {
  TokenEndpoint,
  ClientId,
  ClientSecret,
  GrantType,
  TokenRequestFetchMethod,
  BeforeTokenRequestFunction,
  AfterTokenRequestFunction
} from "./types";

function getTokenMiddleware(
  redirect_uri: string,
  token_endpoint: TokenEndpoint,
  fetch: Function,
  client_id: ClientId,
  client_secret: ClientSecret,
  grant_type: GrantType,
  tokenRequestFetchMethod: TokenRequestFetchMethod,
  beforeTokenRequestFunction: BeforeTokenRequestFunction | undefined,
  afterTokenRequestFunction: AfterTokenRequestFunction
): RequestHandler{
  return async ( req: Request, res: Response ) => {
    if( beforeTokenRequestFunction ){
      const result = await beforeTokenRequestFunction( req, res );

      if( result === false ) return;
    }

    const { query: { code } } = req;

    const paramsArray = [
      [ "client_id", client_id ],
      [ "client_secret", client_secret ],
      [ "grant_type", grant_type ],
      [ "redirect_uri", redirect_uri ],
      [ "code", code ]
    ];

    const paramsString = paramsArray.map( pair => pair.join( "=" ) ).join( "&" );

    const response = await fetch( `${token_endpoint}?${paramsString}`, {
      method: tokenRequestFetchMethod
    } );

    const json = await response.json();

    afterTokenRequestFunction( json, req, res );
  };
}

export { getTokenMiddleware };