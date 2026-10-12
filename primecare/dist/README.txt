Prime Care Home Health website (primecarehomehealth.ca)

Inside: index.html (the whole site). No other files needed.

PUT IT ONLINE (WHC cPanel, same account as mcuire.ca)
1. cPanel > Domains > Create a New Domain: primecarehomehealth.ca
   (untick "Share document root"). cPanel creates a folder for it.
2. cPanel > File Manager > open that folder > Upload this zip > Extract.
   index.html must sit directly in that folder.
3. Note the server IP address shown in cPanel (right-hand "General Information" panel, "Shared IP Address").

POINT THE DOMAIN (GoDaddy)
4. GoDaddy > My Products > primecarehomehealth.ca > DNS.
5. Edit the "A" record named "@": change the value to the WHC IP from step 3. Save.
   Leave "www" (CNAME to @) as it is.
   DO NOT touch the MX, TXT or any Microsoft/autodiscover records: they run your email.
6. Wait 1 to 4 hours. Then in WHC cPanel > SSL/TLS Status, click "Run AutoSSL"
   so the site opens with https (the padlock).

CHANGE TEXT LATER
Phone, email, cities and hours are in config.json in the project; ask Claude to rebuild.
