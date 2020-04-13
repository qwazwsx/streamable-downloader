# streamable-downloader

📽️ batch download videos from streamable.com.

## USAGE

`tsc -b && node index.js <cookies> <concurrent request>`

**cookies** -- string that contains cookies

**concurrent requests** -- optional number of concurrent downloads to allow (default 7)

## HOW TO GET COOKIES FROM STREAMABLE

1. Open the dev tools in your browser.
2. Go to the network tab.
3. Login to streamable.com.
5. Find the first network request entry; it should be titled `streamable.com`.
6. In the headers section, under "request headers" look for a `Cookie` entry.
6. Copy the text (minus the "Cookie" part). What you copied should contain something like this: `user_name="XXX@XXX.XYZ"; is_pro=0; driftt_aid=XXX;`, etc.