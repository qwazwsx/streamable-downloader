# streamable-downloader
📽️ batch download videos from streamable.com

quick script I wrote because I needed to batch download all of my streamable videos

### USAGE

`node index.js <cookies> <concurrent request>`

**cookies -** string that contains cookies

**concurrent requests -** optional number of concurrent downloads to allow (default 7)

ex: `node index.js "upload_speed=123; ... ... ..." 10`

### HOW TO GET COOKIES FROM STREAMABLE

1. log in to streamable
2. press F12 (or CTRL+SHIFT+I)
3. go to the network tab
4. reload the page (CTRL+R)
5. find the first entry, it should be titled `streamable.com`
6. in the headers tab, under `request headers` look for a `cookie` entry
6. copy the text next to `cookie`, what you copied should look something like this: `upload_speed=123; dashboard=true; user_name="XXX@XXX.XYZ"; is_pro=0; driftt_aid=XXX; DFTT_END_USER_PREV_BOOTSTRAPPED=true; _ga=XXX; session=XXX; __gads=ID=XXX; muted=false; volume=0.15; dark_mode=false; euconsent=XXXX; user_code=XXX`
