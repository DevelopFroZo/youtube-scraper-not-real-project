import fetch from "node-fetch";

const { YOUTUBE_API_KEY } = process.env;

async function getFromYoutube( method: string, params: Record<string, string> ): Promise<Record<string, string>>{
  const url =
    "https://www.googleapis.com/youtube/v3/" +
    `${method}?` +
    new URLSearchParams( { ...params, key: YOUTUBE_API_KEY! } ).toString();

  const response = await fetch( url );
  const json = await response.json();

  return json;
}

export { getFromYoutube };