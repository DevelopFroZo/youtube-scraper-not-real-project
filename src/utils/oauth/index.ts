import type { Express } from "express";

import {
  Url,
  BindUri,
  AuthEndpoint,
  TokenEndpoint,
  ClientId,
  ClientSecret,
  AfterTokenRequestFunction,
  ResponseType,
  GrantType,
  Params,
  BeforeCodeRequestFunction,
  BeforeTokenRequestFunction,
  TokenRequestFetchMethod
} from "./types";

import { getCodeMiddleware } from "./code";
import { getTokenMiddleware } from "./token";

interface RequiredOptions {
  app: Express,
  url: Url,
  bind_uri: BindUri,
  auth_endpoint: AuthEndpoint,
  token_endpoint: TokenEndpoint,
  fetch: Function,
  client_id: ClientId,
  client_secret: ClientSecret,
  afterTokenRequestFunction: AfterTokenRequestFunction
}

interface OptionalOptions {
  response_type?: ResponseType,
  grant_type?: GrantType,
  codeRequestParams?: Params,
  beforeCodeRequestFunction?: BeforeCodeRequestFunction,
  beforeTokenRequestFunction?: BeforeTokenRequestFunction,
  tokenRequestFetchMethod?: TokenRequestFetchMethod
}

function oauth(
  {
    app,
    url,
    bind_uri,
    auth_endpoint,
    token_endpoint,
    fetch,
    client_id,
    client_secret,
    afterTokenRequestFunction
  }: RequiredOptions,
  {
    response_type = "code",
    grant_type = "authorization_code",
    codeRequestParams,
    beforeCodeRequestFunction,
    beforeTokenRequestFunction,
    tokenRequestFetchMethod = "POST"
  }: OptionalOptions = {}
){
  const redirectUri = encodeURIComponent( `${url}${bind_uri}/code` );

  app.get( `${bind_uri}`, getCodeMiddleware(
    redirectUri,
    auth_endpoint,
    client_id,
    response_type,
    codeRequestParams,
    beforeCodeRequestFunction
  ) );

  app.get( `${bind_uri}/code`, getTokenMiddleware(
    redirectUri,
    token_endpoint,
    fetch,
    client_id,
    client_secret,
    grant_type,
    tokenRequestFetchMethod,
    beforeTokenRequestFunction,
    afterTokenRequestFunction
  ) );
}

export { oauth };