import type { Request, Response } from "express";

import { getFromYoutube } from "@u/getFromYoutube";

async function get(
  {
    query
  }: Request,
  res: Response
){
  const playlists = await getFromYoutube( "videos", query as any );

  res.json( {
    payload: playlists
  } );
}

export { get };